import { Inngest } from 'inngest';
import prisma from './prisma';
import { initiateRecoveryCall, buildAgentScript } from './calle';
import { syncGoogleCalendarEvents } from './calendar-sync';

// 1. Initialize Inngest Client
export const inngest = new Inngest({
  id: 'rebookrelay',
  // Inngest automatically picks up INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY from env
});

// 2. Define the core Cascade Workflow
export const cascadeWorkflow = inngest.createFunction(
  { id: 'recovery-cascade-workflow', triggers: [{ event: 'recovery.case.created' }] },
  async ({ event, step }) => {
    const { caseId } = event.data as { caseId: string };

    // STEP 1: Fetch the case from the database
    const recoveryCase = await step.run('fetch-recovery-case', async () => {
      return await prisma.recoveryCase.findUnique({
        where: { id: caseId },
        include: { clinic: true, calendarEvent: true }
      });
    });

    if (!recoveryCase) throw new Error(`Case ${caseId} not found`);

    // STEP 2: Call the Original Client
    const call1Result = await step.run('initiate-call-1', async () => {
      const script = buildAgentScript(
        recoveryCase.clinic.name,
        recoveryCase.originalClientName,
        recoveryCase.originalServiceType,
        false // isWaitlist = false
      );

      if (!recoveryCase.clinic.phone) {
        throw new Error(`Clinic phone number is not configured for clinic ${recoveryCase.clinic.id}`);
      }

      return await initiateRecoveryCall({
        to: recoveryCase.originalClientPhone,
        from: recoveryCase.clinic.phone, // Fixed hardcoded phone fallback
        clinicName: recoveryCase.clinic.name,
        clientName: recoveryCase.originalClientName,
        agentScript: script,
        caseId: recoveryCase.id,
        callSequence: 1
      });
    });

    if (!call1Result.success) {
      throw new Error(`Call 1 Failed: ${(call1Result as { success: false; error: string }).error}`);
    }

    // STEP 3: Wait for the CALL-E Webhook to fire (max wait 10 minutes)
    // The webhook endpoint will emit 'call.completed' to Inngest when it receives the data
    const call1Outcome = await step.waitForEvent('call-1-completed', {
      event: 'call.completed',
      timeout: '10m',
      match: 'data.caseId',
      timeoutEvent: {
        data: { outcome: 'NO_ANSWER' }
      }
    });

    // STEP 4: Decision Logic
    if (call1Outcome?.data.outcome === 'BOOKED') {
      await step.run('mark-case-booked', async () => {
        await prisma.recoveryCase.update({
          where: { id: caseId },
          data: { cascadeStatus: 'COMPLETED', finalOutcome: 'BOOKED' }
        });
      });
      return { status: 'success', message: 'Original client rebooked' };
    }

    // STEP 5: Cascade to Waitlist (If Original Client Declined or No Answer)
    if (call1Outcome?.data.outcome === 'DECLINED' || call1Outcome?.data.outcome === 'NO_ANSWER') {
      
      // Find the #1 person on the waitlist
      const waitlistPerson1 = await step.run('get-next-waitlist-person', async () => {
        return await prisma.waitlistPerson.findFirst({
          where: { 
            clinicId: recoveryCase.clinicId,
            serviceType: recoveryCase.originalServiceType,
            status: 'ACTIVE'
          },
          orderBy: { priorityScore: 'desc' }
        });
      });

      if (!waitlistPerson1) {
        await step.run('mark-case-failed', async () => {
          await prisma.recoveryCase.update({
            where: { id: caseId },
            data: { cascadeStatus: 'COMPLETED', finalOutcome: 'NOT_BOOKED' }
          });
        });
        return { status: 'ended', message: 'No one on waitlist available' };
      }

      // STEP 6: Call Waitlist Person 1
      const call2Result = await step.run('initiate-call-2-waitlist', async () => {
        const script = buildAgentScript(
          recoveryCase.clinic.name,
          waitlistPerson1.name,
          recoveryCase.originalServiceType,
          true // isWaitlist = true
        );

        if (!recoveryCase.clinic.phone) {
          throw new Error(`Clinic phone number is not configured for clinic ${recoveryCase.clinic.id}`);
        }

        return await initiateRecoveryCall({
          to: waitlistPerson1.phone,
          from: recoveryCase.clinic.phone, // Fixed hardcoded phone fallback
          clinicName: recoveryCase.clinic.name,
          clientName: waitlistPerson1.name,
          agentScript: script,
          caseId: recoveryCase.id,
          callSequence: 2
        });
      });

      // STEP 7: Wait for Waitlist Call Webhook
      const call2Outcome = await step.waitForEvent('call-2-completed', {
        event: 'call.completed',
        timeout: '10m',
        match: 'data.caseId',
      });

      if (call2Outcome?.data.outcome === 'BOOKED') {
        await step.run('mark-case-booked-waitlist', async () => {
          await prisma.recoveryCase.update({
            where: { id: caseId },
            data: { cascadeStatus: 'COMPLETED', finalOutcome: 'BOOKED' }
          });
        });
        return { status: 'success', message: 'Waitlist client booked' };
      }

      // STEP 8: Cascade to Waitlist Person 2 (Call Sequence 3)
      if (!call2Outcome || call2Outcome.data.outcome === 'DECLINED' || call2Outcome.data.outcome === 'NO_ANSWER') {
        
        // Find the #2 person on the waitlist (skip the first one)
        const waitlistPerson2 = await step.run('get-second-waitlist-person', async () => {
          return await prisma.waitlistPerson.findFirst({
            where: { 
              clinicId: recoveryCase.clinicId,
              serviceType: recoveryCase.originalServiceType,
              status: 'ACTIVE',
              id: { not: waitlistPerson1.id } // Skip waitlistPerson1
            },
            orderBy: { priorityScore: 'desc' }
          });
        });

        if (!waitlistPerson2) {
          await step.run('mark-case-failed-waitlist-2', async () => {
            await prisma.recoveryCase.update({
              where: { id: caseId },
              data: { cascadeStatus: 'COMPLETED', finalOutcome: 'NOT_BOOKED' }
            });
          });
          return { status: 'ended', message: 'No one else on waitlist available' };
        }

        // Call Waitlist Person 2
        const call3Result = await step.run('initiate-call-3-waitlist', async () => {
          const script = buildAgentScript(
            recoveryCase.clinic.name,
            waitlistPerson2.name,
            recoveryCase.originalServiceType,
            true // isWaitlist = true
          );

          if (!recoveryCase.clinic.phone) {
            throw new Error(`Clinic phone number is not configured for clinic ${recoveryCase.clinic.id}`);
          }

          return await initiateRecoveryCall({
            to: waitlistPerson2.phone,
            from: recoveryCase.clinic.phone,
            clinicName: recoveryCase.clinic.name,
            clientName: waitlistPerson2.name,
            agentScript: script,
            caseId: recoveryCase.id,
            callSequence: 3
          });
        });

        // Wait for Waitlist Call 3 Webhook
        const call3Outcome = await step.waitForEvent('call-3-completed', {
          event: 'call.completed',
          timeout: '10m',
          match: 'data.caseId',
        });

        if (call3Outcome?.data.outcome === 'BOOKED') {
          await step.run('mark-case-booked-waitlist-2', async () => {
            await prisma.recoveryCase.update({
              where: { id: caseId },
              data: { cascadeStatus: 'COMPLETED', finalOutcome: 'BOOKED' }
            });
          });
          return { status: 'success', message: 'Waitlist client 2 booked' };
        } else {
          await step.run('mark-case-failed-cascade', async () => {
            await prisma.recoveryCase.update({
              where: { id: caseId },
              data: { cascadeStatus: 'COMPLETED', finalOutcome: 'NOT_BOOKED' }
            });
          });
          return { status: 'ended', message: 'Cascade completed without booking' };
        }
      }
    }
  }
);

// 3. Automated CRON Job to Sync Calendars
export const automatedCalendarSync = inngest.createFunction(
  { id: "automated-calendar-sync", triggers: [{ cron: "*/15 * * * *" }] },
  async ({ step }) => {
    
    // We fetch all clinics that have a connected Google Account
    const clinicsToSync = await step.run('fetch-connected-clinics', async () => {
      const clinics = await prisma.clinic.findMany({
        include: { oauthTokens: true } // Fixed casing: oauthTokens instead of oAuthTokens
      });
      return clinics.filter(c => c.oauthTokens.length > 0);
    });

    if (clinicsToSync.length === 0) {
      return { message: "No connected calendars to sync." };
    }

    const totalNoShows = await step.run('sync-all-clinics', async () => {
      let count = 0;
      for (const clinic of clinicsToSync) {
        const result = await syncGoogleCalendarEvents(clinic.id);
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
