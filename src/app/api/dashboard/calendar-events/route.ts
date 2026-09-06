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
    const events = await db.collection('calendarEvents')
      .find({ clinicId })
      .sort({ scheduledStart: -1 })
      .toArray();

    const eventIds = events.map((e: any) => e._id.toString());
    const cases = await db.collection('recoveryCases')
      .find({ calendarEventId: { $in: eventIds } })
      .toArray();
    const caseMap = new Map(cases.map((c: any) => [c.calendarEventId, c]));

    const formatted = events.map((e: any) => {
      const recoveryCase = caseMap.get(e._id.toString());
      return {
        id: e._id.toString(),
        clientName: e.clientName,
        clientPhone: e.clientPhone,
        clientEmail: e.clientEmail,
        serviceType: e.serviceType,
        durationMin: e.durationMin,
        scheduledStart: e.scheduledStart,
        scheduledEnd: e.scheduledEnd,
        status: e.status,
        hasRecoveryCase: !!recoveryCase,
        recoveryCaseId: recoveryCase?._id?.toString() || null,
        recoveryStatus: recoveryCase?.cascadeStatus || null,
        recoveryOutcome: recoveryCase?.finalOutcome || null,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Failed to fetch calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
