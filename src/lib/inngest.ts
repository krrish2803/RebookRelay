import { Inngest } from 'inngest';
import { getDb } from './mongodb';
import { initiateRecoveryCall, buildAgentScript } from './calle';
import { syncGoogleCalendarEvents, bookCalendarEvent } from './calendar-sync';
import { ObjectId } from 'mongodb';
import { WithId, Document } from 'mongodb';

export const inngest = new Inngest({
  id: 'rebookrelay',
  isDev: process.env.NODE_ENV === 'development',
});

interface RecoveryCaseData {
  _id: string;
  clinicId: string;
  calendarEventId: string;
  originalClientName: string;
  originalClientPhone: string;
  originalServiceType: string;
  originalServiceDurationMin: number;
  cascadeStatus: string;
  clinic: WithId<Document> | null;
}

export const cascadeWorkflow = inngest.createFunction(
  { id: 'recovery-cascade-workflow', triggers: [{ event: 'recovery.case.created' }] },
  async ({ event, step }) => {
    const { caseId } = event.data as { caseId: string };

    const recoveryCase = await step.run('fetch-recovery-case', async () => {
      const db = await getDb();
      const doc = await db.collection('recoveryCases').findOne({ _id: new ObjectId(caseId) });
      if (!doc) return null;
      const clinic = await db.collection('clinics').findOne({ _id: new ObjectId(doc.clinicId) });
      return { ...doc, clinic, _id: doc._id.toString() };
    }) as RecoveryCaseData | null;

    if (!recoveryCase) throw new Error(`Case ${caseId} not found`);
    if (!recoveryCase.clinic) throw new Error(`Clinic not found for case ${caseId}`);

    const clinic = recoveryCase.clinic;

    const call1Result = await step.run('initiate-call-1', async () => {
      const script = buildAgentScript(
        clinic.name,
        recoveryCase.originalClientName,
        recoveryCase.originalServiceType,
        false
      );

      if (!clinic.phone) {
        throw new Error(`Clinic phone number is not configured for clinic ${recoveryCase.clinicId}`);
      }

      return await initiateRecoveryCall({
        to: recoveryCase.originalClientPhone,
        from: clinic.phone,
        clinicName: clinic.name,
        clientName: recoveryCase.originalClientName,
        agentScript: script,
        caseId: recoveryCase._id,
        callSequence: 1
      });
    });

    if (!call1Result.success) {
      throw new Error(`Call 1 Failed: ${(call1Result as { success: false; error: string }).error}`);
    }

    const call1Outcome = await step.waitForEvent('call-1-completed', {
      event: 'call.completed',
      timeout: '10m',
      match: 'data.caseId',
      timeoutEvent: {
        data: { outcome: 'NO_ANSWER' }
      }
    });

    if (call1Outcome?.data.outcome === 'BOOKED') {
      await step.run('mark-case-booked', async () => {
        const db = await getDb();
        await db.collection('recoveryCases').updateOne(
          { _id: new ObjectId(caseId) },
          { $set: { cascadeStatus: 'COMPLETED', finalOutcome: 'BOOKED', updatedAt: new Date() } }
        );
      });

      const bookResult1 = await step.run('book-calendar-event', async () => {
        const slot = recoveryCase.availableSlots?.[0];
        if (!slot) return { booked: false };
        return await bookCalendarEvent({
          clinicId: recoveryCase.clinicId,
          clientName: recoveryCase.originalClientName,
          clientEmail: 'client@rebookrelay.com',
          clientPhone: recoveryCase.originalClientPhone,
          serviceType: recoveryCase.originalServiceType,
          startTime: new Date(slot.start_time),
          endTime: new Date(slot.end_time),
        });
      });

      if (bookResult1.success && bookResult1.htmlLink) {
        await step.run('save-calendar-link', async () => {
          const db = await getDb();
          await db.collection('recoveryCases').updateOne(
            { _id: new ObjectId(caseId) },
            { $set: { calendarEventLink: bookResult1.htmlLink } }
          );
        });
      }

      return { status: 'success', message: 'Original client rebooked + calendar updated' };
    }

    if (call1Outcome?.data.outcome === 'DECLINED' || call1Outcome?.data.outcome === 'NO_ANSWER') {
      const waitlistPerson1 = await step.run('get-next-waitlist-person', async () => {
        const db = await getDb();
        return await db.collection('waitlistPeople').findOne(
          { clinicId: recoveryCase.clinicId, serviceType: recoveryCase.originalServiceType, status: 'ACTIVE' },
          { sort: { priorityScore: -1 } }
        );
      });

      if (!waitlistPerson1) {
        await step.run('mark-case-failed', async () => {
          const db = await getDb();
          await db.collection('recoveryCases').updateOne(
            { _id: new ObjectId(caseId) },
            { $set: { cascadeStatus: 'COMPLETED', finalOutcome: 'NOT_BOOKED', updatedAt: new Date() } }
          );
        });
        return { status: 'ended', message: 'No one on waitlist available' };
      }

      const call2Result = await step.run('initiate-call-2-waitlist', async () => {
        const script = buildAgentScript(
          clinic.name,
          waitlistPerson1.name,
          recoveryCase.originalServiceType,
          true
        );

        if (!clinic.phone) {
          throw new Error(`Clinic phone number is not configured for clinic ${recoveryCase.clinicId}`);
        }

        return await initiateRecoveryCall({
          to: waitlistPerson1.phone,
          from: clinic.phone,
          clinicName: clinic.name,
          clientName: waitlistPerson1.name,
          agentScript: script,
          caseId: recoveryCase._id,
          callSequence: 2
        });
      });

      const call2Outcome = await step.waitForEvent('call-2-completed', {
        event: 'call.completed',
        timeout: '10m',
        match: 'data.caseId',
      });

      if (call2Outcome?.data.outcome === 'BOOKED') {
        await step.run('mark-case-booked-waitlist', async () => {
          const db = await getDb();
          await db.collection('recoveryCases').updateOne(
            { _id: new ObjectId(caseId) },
            { $set: { cascadeStatus: 'COMPLETED', finalOutcome: 'BOOKED', updatedAt: new Date() } }
          );
        });

        const bookResult2 = await step.run('book-calendar-event-waitlist', async () => {
          const slot = recoveryCase.availableSlots?.[0];
          if (!slot) return { booked: false };
          return await bookCalendarEvent({
            clinicId: recoveryCase.clinicId,
            clientName: waitlistPerson1.name,
            clientEmail: waitlistPerson1.email,
            clientPhone: waitlistPerson1.phone,
            serviceType: recoveryCase.originalServiceType,
            startTime: new Date(slot.start_time),
            endTime: new Date(slot.end_time),
          });
        });

        if (bookResult2.success && bookResult2.htmlLink) {
          await step.run('save-calendar-link-waitlist', async () => {
            const db = await getDb();
            await db.collection('recoveryCases').updateOne(
              { _id: new ObjectId(caseId) },
              { $set: { calendarEventLink: bookResult2.htmlLink } }
            );
          });
        }

        return { status: 'success', message: 'Waitlist client booked + calendar updated' };
      }

      if (!call2Outcome || call2Outcome.data.outcome === 'DECLINED' || call2Outcome.data.outcome === 'NO_ANSWER') {
        const waitlistPerson2 = await step.run('get-second-waitlist-person', async () => {
          const db = await getDb();
          return await db.collection('waitlistPeople').findOne(
            {
              clinicId: recoveryCase.clinicId,
              serviceType: recoveryCase.originalServiceType,
              status: 'ACTIVE',
              _id: { $ne: new ObjectId(waitlistPerson1._id.toString()) }
            },
            { sort: { priorityScore: -1 } }
          );
        });

        if (!waitlistPerson2) {
          await step.run('mark-case-failed-waitlist-2', async () => {
            const db = await getDb();
            await db.collection('recoveryCases').updateOne(
              { _id: new ObjectId(caseId) },
              { $set: { cascadeStatus: 'COMPLETED', finalOutcome: 'NOT_BOOKED', updatedAt: new Date() } }
            );
          });
          return { status: 'ended', message: 'No one else on waitlist available' };
        }

        const call3Result = await step.run('initiate-call-3-waitlist', async () => {
          const script = buildAgentScript(
            clinic.name,
            waitlistPerson2.name,
            recoveryCase.originalServiceType,
            true
          );

          if (!clinic.phone) {
            throw new Error(`Clinic phone number is not configured for clinic ${recoveryCase.clinicId}`);
          }

          return await initiateRecoveryCall({
            to: waitlistPerson2.phone,
            from: clinic.phone,
            clinicName: clinic.name,
            clientName: waitlistPerson2.name,
            agentScript: script,
            caseId: recoveryCase._id,
            callSequence: 3
          });
        });

        const call3Outcome = await step.waitForEvent('call-3-completed', {
          event: 'call.completed',
          timeout: '10m',
          match: 'data.caseId',
        });

        if (call3Outcome?.data.outcome === 'BOOKED') {
          await step.run('mark-case-booked-waitlist-2', async () => {
            const db = await getDb();
            await db.collection('recoveryCases').updateOne(
              { _id: new ObjectId(caseId) },
              { $set: { cascadeStatus: 'COMPLETED', finalOutcome: 'BOOKED', updatedAt: new Date() } }
            );
          });

          const bookResult3 = await step.run('book-calendar-event-waitlist-2', async () => {
            const slot = recoveryCase.availableSlots?.[0];
            if (!slot) return { booked: false };
            return await bookCalendarEvent({
              clinicId: recoveryCase.clinicId,
              clientName: waitlistPerson2.name,
              clientEmail: waitlistPerson2.email,
              clientPhone: waitlistPerson2.phone,
              serviceType: recoveryCase.originalServiceType,
              startTime: new Date(slot.start_time),
              endTime: new Date(slot.end_time),
            });
          });

          if (bookResult3.success && bookResult3.htmlLink) {
            await step.run('save-calendar-link-waitlist-2', async () => {
              const db = await getDb();
              await db.collection('recoveryCases').updateOne(
                { _id: new ObjectId(caseId) },
                { $set: { calendarEventLink: bookResult3.htmlLink } }
              );
            });
          }

          return { status: 'success', message: 'Waitlist client 2 booked + calendar updated' };
        } else {
          await step.run('mark-case-failed-cascade', async () => {
            const db = await getDb();
            await db.collection('recoveryCases').updateOne(
              { _id: new ObjectId(caseId) },
              { $set: { cascadeStatus: 'COMPLETED', finalOutcome: 'NOT_BOOKED', updatedAt: new Date() } }
            );
          });
          return { status: 'ended', message: 'Cascade completed without booking' };
        }
      }
    }
  }
);

export const automatedCalendarSync = inngest.createFunction(
  { id: "automated-calendar-sync", triggers: [{ cron: "*/15 * * * *" }] },
  async ({ step }) => {
    const clinicsToSync = await step.run('fetch-connected-clinics', async () => {
      const db = await getDb();
      const tokens = await db.collection('oauthTokens').find({ provider: 'google_calendar' }).toArray();
      const clinicIds = [...new Set(tokens.map((t: any) => t.clinicId))];
      const clinics = await db.collection('clinics').find({ _id: { $in: clinicIds.map(id => new ObjectId(id)) } }).toArray();
      return clinics;
    });

    if (clinicsToSync.length === 0) {
      return { message: "No connected calendars to sync." };
    }

    const totalNoShows = await step.run('sync-all-clinics', async () => {
      let count = 0;
      for (const clinic of clinicsToSync) {
        const result = await syncGoogleCalendarEvents(clinic._id.toString());
        count += result.noShowsDetected;
        console.log(`[CRON] Synced calendar for Clinic: ${clinic.name} — ${result.noShowsDetected} no-shows detected`);
      }
      return count;
    });

    return {
      message: `Successfully ran automated calendar sync for ${clinicsToSync.length} clinics.`,
      detected: totalNoShows
    };
  }
);
