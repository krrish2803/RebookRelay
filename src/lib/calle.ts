import { CalleClient } from '@call-e/calle';
import prisma from './prisma';

// Initialize the CALL-E SDK
export const calle = new CalleClient({
  apiKey: process.env.CALL_E_API_KEY || 'MISSING_API_KEY'
});

// DRY_RUN mode: when true, logs cascade steps without placing real calls.
// Set CALL_E_DRY_RUN=true in .env to enable.
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

/**
 * Initiates a phone call via the CALL-E API and logs the attempt in the database.
 * When DRY_RUN=true, simulates the call without hitting the API.
 */
export async function initiateRecoveryCall(params: CallInitiationParams) {
  try {
    let callId: string;

    if (DRY_RUN) {
      // Simulate a call without placing a real one
      callId = `dryrun_${Date.now()}`;
      console.log(`[DRY_RUN] Would call ${params.to} (${params.clientName}) — script: ${params.agentScript.substring(0, 80)}...`);
    } else {
      // Place a real call via the CALL-E SDK
      const response = await calle.calls.create({
        task: params.agentScript,
        recipient: {
          phone: params.to
        },
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/calls/webhook/calle`,
        metadata: {
          case_id: params.caseId,
          call_sequence: params.callSequence.toString()
        }
      });
      callId = response.id;
    }

    // Log the attempt in our database so we can track the cascade
    const callAttempt = await prisma.callAttempt.create({
      data: {
        recoveryCaseId: params.caseId,
        callSequence: params.callSequence,
        calleCallId: callId,
        targetPersonId: 'temp',
        targetPersonName: params.clientName,
        targetPersonPhone: params.to,
        outcome: DRY_RUN ? 'DRY_RUN' : 'PENDING',
        initiatedAt: new Date(),
      }
    });

    return { success: true, callId, attemptRecord: callAttempt };
  } catch (error: any) {
    console.error('Failed to initiate CALL-E call:', error);
    
    // Log the failure in DB
    await prisma.callAttempt.create({
      data: {
        recoveryCaseId: params.caseId,
        callSequence: params.callSequence,
        calleCallId: `failed_${Date.now()}`,
        targetPersonId: 'temp',
        targetPersonName: params.clientName,
        targetPersonPhone: params.to,
        outcome: 'ERROR',
        notes: error.message,
        initiatedAt: new Date(),
      }
    });
    
    return { success: false, error: error.message };
  }
}

/**
 * Dynamically builds the system prompt for the AI agent based on who it is calling.
 */
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
