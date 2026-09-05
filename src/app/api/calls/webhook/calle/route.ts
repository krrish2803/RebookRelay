import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { inngest } from '@/lib/inngest';

// Idempotency: track processed event IDs to avoid duplicate processing
const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // CALL-E WebhookEvent schema: { id, type, created_at, data: CallTask }
    const eventId = body.id;
    const callData = body.data;

    if (!callData?.id) {
      return NextResponse.json({ error: 'Missing call data' }, { status: 400 });
    }

    // Idempotency: skip if we already processed this event
    if (eventId && processedEvents.has(eventId)) {
      return NextResponse.json({ success: true, message: 'Duplicate event ignored' }, { status: 200 });
    }

    const callId = callData.id;                         // e.g. "call_xyz"
    const metadata = callData.metadata || {};           // We passed { case_id, call_sequence }
    const caseId = metadata.case_id;
    const status = callData.status;                     // "completed" | "failed"

    if (!callId || !caseId) {
      return NextResponse.json({ error: 'Missing required call identifiers' }, { status: 400 });
    }

    // Extract outcome from recipients (first recipient's summary or status)
    const recipient = callData.recipients?.[0];
    const transcript = recipient?.summary || null;
    const outcome = callData.taskCompleted ? 'BOOKED' : (status === 'failed' ? 'ERROR' : 'DECLINED');

    // 1. Update the CallAttempt log in the database
    await prisma.callAttempt.update({
      where: { calleCallId: callId },
      data: {
        outcome,
        transcript,
        completedAt: new Date(),
      }
    });

    // 2. Wake up the Inngest Orchestrator
    await inngest.send({
      name: 'call.completed',
      data: {
        calleCallId: callId,
        caseId: caseId,
        outcome: outcome,
      }
    });

    // 3. Mark event as processed for idempotency
    if (eventId) processedEvents.add(eventId);

    console.log(`Webhook received: Call ${callId} resulted in ${outcome}. Inngest notified.`);
    return NextResponse.json({ success: true, message: 'Webhook processed' }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
