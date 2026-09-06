import { CalleClient } from '@call-e/calle';
import { getDb } from './mongodb';
import crypto from 'crypto';

export const calle = new CalleClient({
  apiKey: process.env.CALL_E_API_KEY || 'MISSING_API_KEY'
});

// DRY_RUN defaults to true when env var is absent or unset — live mode requires explicit opt-in
const DRY_RUN = process.env.CALL_E_DRY_RUN !== 'false';

// Webhook secret for validating incoming CALL-E webhooks
export const CALLE_WEBHOOK_SECRET = process.env.CALLE_WEBHOOK_SECRET || '';

/**
 * Check if a destination phone number is pre-approved for real calls.
 * Returns true if DRY_RUN is active (always safe) or if the number is in approvedDestinations.
 */
export async function isDestinationApproved(phone: string): Promise<boolean> {
  if (DRY_RUN) return true;
  const db = await getDb();
  const approved = await db.collection('approvedDestinations').findOne({ phone, status: 'ACTIVE' });
  return !!approved;
}

export interface CallInitiationParams {
  to: string;
  from: string;
  clinicName: string;
  clientName: string;
  agentScript: string;
  caseId: string;
  callSequence: number;
}

export interface ConfirmationParams {
  caseId: string;
  clinicId: string;
  clientName: string;
  clientPhone: string;
  serviceType: string;
  slotTime: Date;
  clinicName: string;
  clinicPhone: string;
}

export async function initiateRecoveryCall(params: CallInitiationParams) {
  try {
    let callId: string;

    if (DRY_RUN) {
      callId = `dryrun_${Date.now()}`;
      console.log(`[DRY_RUN] Would call ${params.to} (${params.clientName}) — script: ${params.agentScript.substring(0, 80)}...`);
    } else {
      // Safety: verify destination is approved before placing real call
      const approved = await isDestinationApproved(params.to);
      if (!approved) {
        throw new Error(`Destination ${params.to} is not in approvedDestinations. Add it before making real calls.`);
      }

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

export async function sendVoiceConfirmation(params: ConfirmationParams) {
  try {
    const db = await getDb();
    const token = crypto.randomBytes(32).toString('hex');

    await db.collection('confirmationTokens').insertOne({
      caseId: params.caseId,
      clientName: params.clientName,
      clientPhone: params.clientPhone,
      serviceType: params.serviceType,
      slotTime: params.slotTime,
      clinicName: params.clinicName,
      token,
      status: 'PENDING',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://rebookrelay.onrender.com'}/confirm/${token}`;
    const timeStr = params.slotTime.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const script = `You are calling from ${params.clinicName}. You are speaking to ${params.clientName}.
Great news! Your ${params.serviceType} appointment has been booked for ${timeStr} today.
I'm calling to confirm — can you make it?
If they say yes, tell them: "Wonderful! Please click the confirmation link we sent you to finalize your booking."
If they say no, tell them: "No problem, the slot will be released. Thank you for letting us know."
Keep the call short and friendly.`;

    let callId: string;

    if (DRY_RUN) {
      callId = `dryrun_confirm_${Date.now()}`;
      console.log(`[DRY_RUN] Would call ${params.clientPhone} (${params.clientName}) to confirm booking at ${timeStr}`);
      console.log(`[DRY_RUN] Confirmation URL: ${confirmUrl}`);
    } else {
      const response = await calle.calls.create({
        task: script,
        recipient: { phone: params.clientPhone },
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/calls/webhook/calle`,
        metadata: {
          case_id: params.caseId,
          call_sequence: 'confirmation',
        }
      });
      callId = response.id;
    }

    await db.collection('callAttempts').insertOne({
      recoveryCaseId: params.caseId,
      callSequence: 0,
      calleCallId: callId,
      targetPersonId: 'confirmation',
      targetPersonName: params.clientName,
      targetPersonPhone: params.clientPhone,
      outcome: DRY_RUN ? 'DRY_RUN' : 'PENDING',
      notes: `Voice confirmation call for ${params.serviceType} at ${timeStr}`,
      initiatedAt: new Date(),
    });

    console.log(`[CONFIRM] Voice confirmation call initiated for ${params.clientName} — URL: ${confirmUrl}`);

    return { success: true, callId, confirmUrl, token };
  } catch (error: any) {
    console.error('Failed to send voice confirmation:', error);
    return { success: false, error: error.message };
  }
}
