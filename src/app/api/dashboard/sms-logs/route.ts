import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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

    const smsAttempts = await db.collection('smsAttempts')
      .find({ recoveryCaseId: { $in: caseIds } })
      .sort({ initiatedAt: -1 })
      .toArray();

    const formatted = smsAttempts.map((s: any) => ({
      id: s._id.toString(),
      client: s.targetPersonName,
      phone: s.targetPersonPhone,
      outcome: s.outcome,
      messageBody: s.messageBody,
      initiatedAt: s.initiatedAt,
      completedAt: s.completedAt,
      callSequence: s.callSequence,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Failed to fetch SMS logs:', error);
    return NextResponse.json({ error: 'Failed to fetch SMS logs' }, { status: 500 });
  }
}
