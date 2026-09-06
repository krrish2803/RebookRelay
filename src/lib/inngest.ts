import { Inngest } from 'inngest';
import { getDb } from './mongodb';
import { initiateRecoveryCall, buildAgentScript, sendVoiceConfirmation } from './calle';
import { syncGoogleCalendarEvents, bookCalendarEvent, checkSlotAvailability } from './calendar-sync';
import { sendSms, buildRecoverySms, logSmsAttempt } from './sms';
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
  availableSlots: Array<{ start_time: string; end_time: string; service_duration: number }>;
  clinic: WithId<Document> | null;
}

async function checkSmsReply(db: any, caseId: string, phone: string): Promise<string | null> {
  const sms = await db.collection('smsAttempts').findOne({
    recoveryCaseId: caseId,
    targetPersonPhone: phone,
    outcome: { $in: ['REPLIED_YES', 'REPLIED_NO'] },
  });
  return sms?.outcome || null;
}

async function bookAndLinkCalendar(
  db: any,
  caseId: string,
  clinicId: string,
  clientName: string,
  clientEmail: string,
  clientPhone: string,
  serviceType: string,
  availableSlots: Array<{ start_time: string; end_time: string }>
) {
  const slot = availableSlots?.[0];
  if (!slot) return { booked: false };

  const result = await bookCalendarEvent({
    clinicId,
    clientName,
    clientEmail,
    clientPhone,
    serviceType,
    startTime: new Date(slot.start_time),
    endTime: new Date(slot.end_time),
  });

  if (result.success && result.htmlLink) {
    await db.collection('recoveryCases').updateOne(
      { _id: new ObjectId(caseId) },
      { $set: { calendarEventLink: result.htmlLink } }
    );
  }

  return result;
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
    const slot = recoveryCase.availableSlots?.[0];
    const slotTime = slot ? new Date(slot.start_time).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'later today';

    // ========== ROUND 1: Original Client ==========

    // Step 1: Send SMS to original client
    const sms1Result = await step.run('send-sms-original-client', async () => {
      const smsBody = buildRecoverySms(
        clinic.name,
        recoveryCase.originalClientName,
        recoveryCase.originalServiceType,
        slotTime,
        false
      );
      const result = await sendSms({
        to: recoveryCase.originalClientPhone,
        body: smsBody,
        caseId: recoveryCase._id,
        clinicId: recoveryCase.clinicId,
      });

      if (result.success) {
        await logSmsAttempt({
          caseId: recoveryCase._id,
          callSequence: 1,
          targetPersonName: recoveryCase.originalClientName,
          targetPersonPhone: recoveryCase.originalClientPhone,
          smsId: result.smsId || 'unknown',
          outcome: 'DELIVERED',
          messageBody: smsBody,
        });
      }

      return result;
    });

    // Step 2: Wait for SMS reply (poll every 30s for 5 minutes = 10 attempts)
    const sms1Reply = await step.run('wait-for-sms-reply-1', async () => {
      const db = await getDb();
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 30000));
        const reply = await checkSmsReply(db, caseId, recoveryCase.originalClientPhone);
        if (reply) return reply;
      }
      return null;
    });

    if (sms1Reply === 'REPLIED_YES') {
      await step.run('mark-case-booked-sms', async () => {
        const db = await getDb();
        await db.collection('recoveryCases').updateOne(
          { _id: new ObjectId(caseId) },
          { $set: { cascadeStatus: 'COMPLETED', finalOutcome: 'BOOKED', updatedAt: new Date() } }
        );
      });

      const bookResult = await step.run('book-calendar-sms', async () => {
        const db = await getDb();
        return await bookAndLinkCalendar(
          db, caseId, recoveryCase.clinicId,
          recoveryCase.originalClientName, 'client@rebookrelay.com',
          recoveryCase.originalClientPhone, recoveryCase.originalServiceType,
          recoveryCase.availableSlots
        );
      });

      const slot1 = recoveryCase.availableSlots?.[0];
      await step.run('voice-confirm-sms-original', async () => {
        return await sendVoiceConfirmation({
          caseId,
          clinicId: recoveryCase.clinicId,
          clientName: recoveryCase.originalClientName,
          clientPhone: recoveryCase.originalClientPhone,
          serviceType: recoveryCase.originalServiceType,
          slotTime: new Date(slot1?.start_time || new Date()),
          clinicName: clinic.name,
          clinicPhone: clinic.phone || '',
        });
      });

      return { status: 'success', message: 'Original client rebooked via SMS reply + voice confirmation sent' };
    }

    // Step 3: Call original client (SMS didn't work)
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
        const db = await getDb();
        return await bookAndLinkCalendar(
          db, caseId, recoveryCase.clinicId,
          recoveryCase.originalClientName, 'client@rebookrelay.com',
          recoveryCase.originalClientPhone, recoveryCase.originalServiceType,
          recoveryCase.availableSlots
        );
      });

      const slot1call = recoveryCase.availableSlots?.[0];
      await step.run('voice-confirm-call-original', async () => {
        return await sendVoiceConfirmation({
          caseId,
          clinicId: recoveryCase.clinicId,
          clientName: recoveryCase.originalClientName,
          clientPhone: recoveryCase.originalClientPhone,
          serviceType: recoveryCase.originalServiceType,
          slotTime: new Date(slot1call?.start_time || new Date()),
          clinicName: clinic.name,
          clinicPhone: clinic.phone || '',
        });
      });

      return { status: 'success', message: 'Original client rebooked via call + voice confirmation sent' };
    }

    // ========== ROUND 2: Waitlist Person #1 ==========

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

      // SMS to waitlist person #1
      const sms2Result = await step.run('send-sms-waitlist-1', async () => {
        const smsBody = buildRecoverySms(
          clinic.name,
          waitlistPerson1.name,
          recoveryCase.originalServiceType,
          slotTime,
          true
        );
        const result = await sendSms({
          to: waitlistPerson1.phone,
          body: smsBody,
          caseId: recoveryCase._id,
          clinicId: recoveryCase.clinicId,
        });

        if (result.success) {
          await logSmsAttempt({
            caseId: recoveryCase._id,
            callSequence: 2,
            targetPersonName: waitlistPerson1.name,
            targetPersonPhone: waitlistPerson1.phone,
            smsId: result.smsId || 'unknown',
            outcome: 'DELIVERED',
            messageBody: smsBody,
          });
        }

        return result;
      });

      // Wait for SMS reply
      const sms2Reply = await step.run('wait-for-sms-reply-2', async () => {
        const db = await getDb();
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 30000));
          const reply = await checkSmsReply(db, caseId, waitlistPerson1.phone);
          if (reply) return reply;
        }
        return null;
      });

      if (sms2Reply === 'REPLIED_YES') {
        await step.run('mark-case-booked-waitlist-sms', async () => {
          const db = await getDb();
          await db.collection('recoveryCases').updateOne(
            { _id: new ObjectId(caseId) },
            { $set: { cascadeStatus: 'COMPLETED', finalOutcome: 'BOOKED', updatedAt: new Date() } }
          );
        });

        await step.run('book-calendar-waitlist-sms', async () => {
          const db = await getDb();
          return await bookAndLinkCalendar(
            db, caseId, recoveryCase.clinicId,
            waitlistPerson1.name, waitlistPerson1.email,
            waitlistPerson1.phone, recoveryCase.originalServiceType,
            recoveryCase.availableSlots
          );
        });

        const slotWs1 = recoveryCase.availableSlots?.[0];
        await step.run('voice-confirm-sms-waitlist-1', async () => {
          return await sendVoiceConfirmation({
            caseId,
            clinicId: recoveryCase.clinicId,
            clientName: waitlistPerson1.name,
            clientPhone: waitlistPerson1.phone,
            serviceType: recoveryCase.originalServiceType,
            slotTime: new Date(slotWs1?.start_time || new Date()),
            clinicName: clinic.name,
            clinicPhone: clinic.phone || '',
          });
        });

        return { status: 'success', message: 'Waitlist client 1 booked via SMS reply + voice confirmation sent' };
      }

      // Check slot availability before calling
      const slotCheck2 = await step.run('check-slot-availability-2', async () => {
        const slot = recoveryCase.availableSlots?.[0];
        if (!slot) return { available: true };
        return await checkSlotAvailability(
          recoveryCase.clinicId,
          new Date(slot.start_time),
          new Date(slot.end_time)
        );
      });

      if (!slotCheck2.available) {
        await step.run('mark-case-slot-taken-2', async () => {
          const db = await getDb();
          await db.collection('recoveryCases').updateOne(
            { _id: new ObjectId(caseId) },
            { $set: { cascadeStatus: 'COMPLETED', finalOutcome: 'NOT_BOOKED', notes: `Slot no longer available: ${slotCheck2.reason}`, updatedAt: new Date() } }
          );
        });
        return { status: 'ended', message: `Slot no longer available: ${slotCheck2.reason}` };
      }

      // Call waitlist person #1
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
          const db = await getDb();
          return await bookAndLinkCalendar(
            db, caseId, recoveryCase.clinicId,
            waitlistPerson1.name, waitlistPerson1.email,
            waitlistPerson1.phone, recoveryCase.originalServiceType,
            recoveryCase.availableSlots
          );
        });

        const slotWc1 = recoveryCase.availableSlots?.[0];
        await step.run('voice-confirm-call-waitlist-1', async () => {
          return await sendVoiceConfirmation({
            caseId,
            clinicId: recoveryCase.clinicId,
            clientName: waitlistPerson1.name,
            clientPhone: waitlistPerson1.phone,
            serviceType: recoveryCase.originalServiceType,
            slotTime: new Date(slotWc1?.start_time || new Date()),
            clinicName: clinic.name,
            clinicPhone: clinic.phone || '',
          });
        });

        return { status: 'success', message: 'Waitlist client 1 booked via call + voice confirmation sent' };
      }

      // ========== ROUND 3: Waitlist Person #2 ==========

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

        // SMS to waitlist person #2
        const sms3Result = await step.run('send-sms-waitlist-2', async () => {
          const smsBody = buildRecoverySms(
            clinic.name,
            waitlistPerson2.name,
            recoveryCase.originalServiceType,
            slotTime,
            true
          );
          const result = await sendSms({
            to: waitlistPerson2.phone,
            body: smsBody,
            caseId: recoveryCase._id,
            clinicId: recoveryCase.clinicId,
          });

          if (result.success) {
            await logSmsAttempt({
              caseId: recoveryCase._id,
              callSequence: 3,
              targetPersonName: waitlistPerson2.name,
              targetPersonPhone: waitlistPerson2.phone,
              smsId: result.smsId || 'unknown',
              outcome: 'DELIVERED',
              messageBody: smsBody,
            });
          }

          return result;
        });

        // Wait for SMS reply
        const sms3Reply = await step.run('wait-for-sms-reply-3', async () => {
          const db = await getDb();
          for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 30000));
            const reply = await checkSmsReply(db, caseId, waitlistPerson2.phone);
            if (reply) return reply;
          }
          return null;
        });

        if (sms3Reply === 'REPLIED_YES') {
          await step.run('mark-case-booked-waitlist-2-sms', async () => {
            const db = await getDb();
            await db.collection('recoveryCases').updateOne(
              { _id: new ObjectId(caseId) },
              { $set: { cascadeStatus: 'COMPLETED', finalOutcome: 'BOOKED', updatedAt: new Date() } }
            );
          });

          await step.run('book-calendar-waitlist-2-sms', async () => {
            const db = await getDb();
            return await bookAndLinkCalendar(
              db, caseId, recoveryCase.clinicId,
              waitlistPerson2.name, waitlistPerson2.email,
              waitlistPerson2.phone, recoveryCase.originalServiceType,
              recoveryCase.availableSlots
            );
          });

          const slotWs2 = recoveryCase.availableSlots?.[0];
          await step.run('voice-confirm-sms-waitlist-2', async () => {
            return await sendVoiceConfirmation({
              caseId,
              clinicId: recoveryCase.clinicId,
              clientName: waitlistPerson2.name,
              clientPhone: waitlistPerson2.phone,
              serviceType: recoveryCase.originalServiceType,
              slotTime: new Date(slotWs2?.start_time || new Date()),
              clinicName: clinic.name,
              clinicPhone: clinic.phone || '',
            });
          });

          return { status: 'success', message: 'Waitlist client 2 booked via SMS reply + voice confirmation sent' };
        }

        // Check slot availability before calling
        const slotCheck3 = await step.run('check-slot-availability-3', async () => {
          const slot = recoveryCase.availableSlots?.[0];
          if (!slot) return { available: true };
          return await checkSlotAvailability(
            recoveryCase.clinicId,
            new Date(slot.start_time),
            new Date(slot.end_time)
          );
        });

        if (!slotCheck3.available) {
          await step.run('mark-case-slot-taken-3', async () => {
            const db = await getDb();
            await db.collection('recoveryCases').updateOne(
              { _id: new ObjectId(caseId) },
              { $set: { cascadeStatus: 'COMPLETED', finalOutcome: 'NOT_BOOKED', notes: `Slot no longer available: ${slotCheck3.reason}`, updatedAt: new Date() } }
            );
          });
          return { status: 'ended', message: `Slot no longer available: ${slotCheck3.reason}` };
        }

        // Call waitlist person #2
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
            const db = await getDb();
            return await bookAndLinkCalendar(
              db, caseId, recoveryCase.clinicId,
              waitlistPerson2.name, waitlistPerson2.email,
              waitlistPerson2.phone, recoveryCase.originalServiceType,
              recoveryCase.availableSlots
            );
          });

          const slotWc2 = recoveryCase.availableSlots?.[0];
          await step.run('voice-confirm-call-waitlist-2', async () => {
            return await sendVoiceConfirmation({
              caseId,
              clinicId: recoveryCase.clinicId,
              clientName: waitlistPerson2.name,
              clientPhone: waitlistPerson2.phone,
              serviceType: recoveryCase.originalServiceType,
              slotTime: new Date(slotWc2?.start_time || new Date()),
              clinicName: clinic.name,
              clinicPhone: clinic.phone || '',
            });
          });

          return { status: 'success', message: 'Waitlist client 2 booked via call + voice confirmation sent' };
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
