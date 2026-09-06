import { NextRequest, NextResponse } from 'next/server';
import { bookCalendarEvent } from '@/lib/calendar-sync';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const clinicId = req.cookies.get('session')?.value;
    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId, clientName, clientEmail, clientPhone, serviceType, startTime, endTime } = await req.json();

    if (!clientName || !clientPhone || !serviceType || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await bookCalendarEvent({
      clinicId,
      clientName,
      clientEmail: clientEmail || 'client@rebookrelay.com',
      clientPhone,
      serviceType,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // If caseId provided, update the recovery case
    if (caseId) {
      const db = await getDb();
      await db.collection('recoveryCases').updateOne(
        { _id: new ObjectId(caseId) },
        {
          $set: {
            cascadeStatus: 'COMPLETED',
            finalOutcome: 'BOOKED',
            bookedSlot: { start_time: startTime, end_time: endTime },
            completedAt: new Date(),
            updatedAt: new Date(),
          }
        }
      );
    }

    return NextResponse.json({ success: true, eventId: result.eventId });
  } catch (error: any) {
    console.error('Book error:', error);
    return NextResponse.json({ error: 'Failed to book event' }, { status: 500 });
  }
}
