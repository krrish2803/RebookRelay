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

    const callId = callData.id;
    const metadata = callData.metadata || {};
    const caseId = metadata.case_id;
    const status = callData.status;

    if (!callId || !caseId) {
      return NextResponse.json({ error: 'Missing required call identifiers' }, { status: 400 });
    }

    // Verify the case_id belongs to a real RecoveryCase in our database.
    // This prevents unbound webhook events from arbitrary sources.
    const existingCase = await prisma.recoveryCase.findUnique({
      where: { id: caseId },
      select: { id: true }
    });

    if (!existingCase) {
      return NextResponse.json({ error: 'Unknown case_id — webhook rejected' }, { status: 403 });
    }

    // Extract outcome from recipients
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
