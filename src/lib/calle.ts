import { CalleClient } from '@call-e/calle';
import { getDb } from './mongodb';

export const calle = new CalleClient({
  apiKey: process.env.CALL_E_API_KEY || 'MISSING_API_KEY'
});

const DRY_RUN = process.env.CALL_E_DRY_RUN === 'true';

export interface CallInitiationParams {
  to: string;
  from: string;
  clinicName: string;
  clientName: string;
  agentScript: string;
  caseId: string;
  callSequence: number;
}

export async function initiateRecoveryCall(params: CallInitiationParams) {
  try {
    let callId: string;

    if (DRY_RUN) {
      callId = `dryrun_${Date.now()}`;
      console.log(`[DRY_RUN] Would call ${params.to} (${params.clientName}) — script: ${params.agentScript.substring(0, 80)}...`);
    } else {
      const response = await calle.calls.create({
        task: params.agentScript,
        recipient: { phone: params.to },
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/calls/webhook/calle`,
        metadata: {
          case_id: params.caseId,
          call_sequence: params.callSequence.toString()
        }
      });
      callId = response.id;
    }

    const db = await getDb();
    const result = await db.collection('callAttempts').insertOne({
      recoveryCaseId: params.caseId,
      callSequence: params.callSequence,
      calleCallId: callId,
      targetPersonId: 'temp',
      targetPersonName: params.clientName,
      targetPersonPhone: params.to,
      outcome: DRY_RUN ? 'DRY_RUN' : 'PENDING',
      initiatedAt: new Date(),
    });

    return { success: true, callId, attemptRecord: { id: result.insertedId.toString() } };
  } catch (error: any) {
    console.error('Failed to initiate CALL-E call:', error);

    const db = await getDb();
    await db.collection('callAttempts').insertOne({
      recoveryCaseId: params.caseId,
      callSequence: params.callSequence,
      calleCallId: `failed_${Date.now()}`,
      targetPersonId: 'temp',
      targetPersonName: params.clientName,
      targetPersonPhone: params.to,
      outcome: 'ERROR',
      notes: error.message,
      initiatedAt: new Date(),
    });

    return { success: false, error: error.message };
  }
}

export function buildAgentScript(
  clinicName: string,
  clientName: string,
  serviceType: string,
  isWaitlist: boolean
) {
  if (isWaitlist) {
    return `You are calling from ${clinicName}. You are speaking to ${clientName}, who is on the waitlist for a ${serviceType} appointment. 
A slot has just opened up today. 
Your goal is to politely inform them of the opening and ask if they would like to claim it. 
If they say yes, confirm the booking and say you will update their calendar. 
If they say no or they are busy, politely end the call.`;
  }

  return `You are calling from ${clinicName}. You are speaking to ${clientName}. 
They just missed their ${serviceType} appointment a few minutes ago.
Your goal is to empathetically ask if everything is okay, and offer to reschedule them for an open slot later today.
If they want to reschedule, confirm it. If they decline, politely end the call so we can contact the waitlist.`;
}
