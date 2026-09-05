import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { inngest } from '@/lib/inngest';

const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const eventId = body.id;
    const callData = body.data;

    if (!callData?.id) {
      return NextResponse.json({ error: 'Missing call data' }, { status: 400 });
    }

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

    const db = await getDb();
    const existingCase = await db.collection('recoveryCases').findOne({ _id: { $oid: caseId } });
    if (!existingCase) {
      return NextResponse.json({ error: 'Unknown case_id — webhook rejected' }, { status: 403 });
    }

    const recipient = callData.recipients?.[0];
    const transcript = recipient?.summary || null;
    const outcome = callData.taskCompleted ? 'BOOKED' : (status === 'failed' ? 'ERROR' : 'DECLINED');

    await db.collection('callAttempts').updateOne(
      { calleCallId: callId },
      { $set: { outcome, transcript, completedAt: new Date() } }
    );

    await inngest.send({
      name: 'call.completed',
      data: { calleCallId: callId, caseId, outcome }
    });

    if (eventId) processedEvents.add(eventId);

    console.log(`Webhook received: Call ${callId} resulted in ${outcome}. Inngest notified.`);
    return NextResponse.json({ success: true, message: 'Webhook processed' }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
