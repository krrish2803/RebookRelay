import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const clinicId = req.cookies.get('session')?.value;
    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    const clinicCases = await db.collection('recoveryCases')
      .find({ clinicId })
      .toArray();
    const caseIds = clinicCases.map((c: any) => c._id.toString());

    const calls = await db.collection('callAttempts')
      .find({ recoveryCaseId: { $in: caseIds } })
      .toArray();

    const sms = await db.collection('smsAttempts')
      .find({ recoveryCaseId: { $in: caseIds } })
      .toArray();

    const confirmations = await db.collection('confirmationTokens')
      .find({ caseId: { $in: caseIds } })
      .toArray();

    const communications: Array<{
      id: string;
      type: 'call' | 'sms' | 'confirmation';
      client: string;
      phone: string;
      direction: string;
      outcome: string;
      summary: string;
      timestamp: Date;
      duration?: string;
      sentiment?: number;
    }> = [];

    for (const c of calls) {
      const duration = c.callDurationSec
        ? `${Math.floor(c.callDurationSec / 60)}:${String(c.callDurationSec % 60).padStart(2, '0')}`
        : null;

      let direction = 'Outbound';
      let callType = 'Call';
      if (c.callSequence === 0) {
        callType = 'Voice Confirmation';
        direction = 'Confirmation';
      } else if (c.callSequence === 1) {
        callType = 'Recovery Call';
      } else {
        callType = `Waitlist Offer #${c.callSequence}`;
      }

      communications.push({
        id: c._id.toString(),
        type: 'call',
        client: c.targetPersonName,
        phone: c.targetPersonPhone,
        direction,
        outcome: c.outcome,
        summary: `${callType} — ${c.outcome}`,
        timestamp: c.initiatedAt,
        duration: duration || undefined,
        sentiment: c.sentimentScore || undefined,
      });
    }

    for (const s of sms) {
      let smsType = 'SMS';
      if (s.callSequence === 1) smsType = 'Recovery SMS';
      else if (s.callSequence > 1) smsType = `Waitlist SMS #${s.callSequence}`;

      let outcomeLabel = s.outcome;
      if (s.outcome === 'REPLIED_YES') outcomeLabel = 'Replied YES';
      else if (s.outcome === 'REPLIED_NO') outcomeLabel = 'Replied NO';
      else if (s.outcome === 'DELIVERED') outcomeLabel = 'Delivered';

      communications.push({
        id: s._id.toString(),
        type: 'sms',
        client: s.targetPersonName,
        phone: s.targetPersonPhone,
        direction: 'Outbound',
        outcome: s.outcome,
        summary: `${smsType} — ${outcomeLabel}`,
        timestamp: s.initiatedAt,
      });
    }

    for (const t of confirmations) {
      communications.push({
        id: t._id.toString(),
        type: 'confirmation',
        client: t.clientName,
        phone: t.clientPhone || '',
        direction: 'Web',
        outcome: t.status,
        summary: `Voice Confirmation Link — ${t.status}`,
        timestamp: t.createdAt,
      });
    }

    communications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ success: true, data: communications });
  } catch (error: any) {
    console.error('Failed to fetch communication history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
