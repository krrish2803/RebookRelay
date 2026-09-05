import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const clinicId = req.cookies.get('session')?.value;
    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const cases = await db.collection('recoveryCases')
      .find({ clinicId })
      .sort({ createdAt: -1 })
      .toArray();

    const formatted: Array<{
      id: string;
      client: any;
      phone: any;
      service: any;
      originalTime: any;
      status: any;
      finalOutcome: any;
      currentCallDepth: any;
      revenueRecovered: any;
      callAttempts: Array<{ id: string; target: any; outcome: any; callSequence: any; initiatedAt: any; completedAt: any }>;
      createdAt: any;
      completedAt: any;
    }> = cases.map((c: any) => ({
      id: c._id.toString(),
      client: c.originalClientName,
      phone: c.originalClientPhone,
      service: c.originalServiceType,
      originalTime: c.originalAppointmentStart,
      status: c.cascadeStatus,
      finalOutcome: c.finalOutcome,
      currentCallDepth: c.currentCallDepth,
      revenueRecovered: c.revenueRecovered,
      callAttempts: [],
      createdAt: c.createdAt,
      completedAt: c.completedAt,
    }));

    // Fetch call attempts for each case
    for (const c of formatted) {
      const calls = await db.collection('callAttempts')
        .find({ recoveryCaseId: c.id })
        .sort({ callSequence: 1 })
        .toArray();
      c.callAttempts = calls.map((a: any) => ({
        id: a._id.toString(),
        target: a.targetPersonName,
        outcome: a.outcome,
        callSequence: a.callSequence,
        initiatedAt: a.initiatedAt,
        completedAt: a.completedAt,
      }));
    }

    const stats = {
      total: cases.length,
      recovered: cases.filter((c: any) => c.finalOutcome === 'BOOKED').length,
      inProgress: cases.filter((c: any) => !c.completedAt).length,
      failed: cases.filter((c: any) => c.finalOutcome === 'NOT_BOOKED').length,
    };

    return NextResponse.json({ success: true, data: { cases: formatted, stats } });
  } catch (error: any) {
    console.error('Failed to fetch no-shows:', error);
    return NextResponse.json({ error: 'Failed to fetch no-shows' }, { status: 500 });
  }
}
