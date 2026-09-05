import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const clinicId = req.cookies.get('session')?.value;
    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    const calls = await db.collection('callAttempts')
      .find({ recoveryCaseId: { $exists: true } })
      .sort({ createdAt: -1 })
      .toArray();

    // Filter to only calls belonging to this clinic's recovery cases
    const clinicCases = await db.collection('recoveryCases')
      .find({ clinicId })
      .project({ _id: 1 })
      .toArray();
    const caseIds = new Set(clinicCases.map((c: any) => c._id.toString()));

    const clinicCalls = calls.filter((c: any) => caseIds.has(c.recoveryCaseId));

    const formatted = clinicCalls.map((call: any) => ({
      id: call._id.toString(),
      client: call.targetPersonName,
      phone: call.targetPersonPhone,
      type: call.callSequence === 1 ? 'Original Client Recovery' : `Waitlist Offer (#${call.callSequence})`,
      callSequence: call.callSequence,
      duration: call.callDurationSec ? `${Math.floor(call.callDurationSec / 60)}:${String(call.callDurationSec % 60).padStart(2, '0')}` : null,
      sentimentScore: call.sentimentScore,
      outcome: call.outcome,
      transcript: call.transcript,
      notes: call.notes,
      recordingUrl: call.recordingUrl,
      initiatedAt: call.initiatedAt,
      completedAt: call.completedAt,
      calleCallId: call.calleCallId,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Failed to fetch calls:', error);
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
  }
}
