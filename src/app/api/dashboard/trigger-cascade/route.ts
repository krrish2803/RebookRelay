import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { inngest } from '@/lib/inngest';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const clinicId = req.cookies.get('session')?.value;
    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const clinic = await db.collection('clinics').findOne({ _id: new ObjectId(clinicId) });
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    const calendarEvent = await db.collection('calendarEvents')
      .findOne({ clinicId, status: 'confirmed' }, { sort: { scheduledStart: -1 } });

    if (!calendarEvent) {
      return NextResponse.json({ error: 'No confirmed calendar events found. Connect Google Calendar first.' }, { status: 400 });
    }

    const eventId = calendarEvent._id.toString();
    const existingCase = await db.collection('recoveryCases').findOne({ calendarEventId: eventId });
    if (existingCase) {
      return NextResponse.json({ error: 'A recovery case already exists for this event' }, { status: 409 });
    }

    const result = await db.collection('recoveryCases').insertOne({
      clinicId,
      calendarEventId: eventId,
      originalClientId: 'test_client',
      originalClientName: calendarEvent.clientName,
      originalClientPhone: calendarEvent.clientPhone,
      originalAppointmentStart: calendarEvent.scheduledStart,
      originalServiceType: calendarEvent.serviceType,
      originalServiceDurationMin: calendarEvent.durationMin,
      availableSlots: [],
      cascadeStatus: 'PENDING_CALL_1',
      maxCascadeDepth: 3,
      currentCallDepth: 0,
      finalOutcome: 'PENDING',
      bookedSlot: null,
      revenueRecovered: null,
      createdAt: new Date(),
      completedAt: null,
      updatedAt: new Date(),
    });

    const caseId = result.insertedId.toString();

    await inngest.send({
      name: 'recovery.case.created',
      data: { caseId }
    });

    return NextResponse.json({
      success: true,
      message: 'Cascade triggered! The workflow will call the client shortly.',
      data: { caseId }
    });
  } catch (error: any) {
    console.error('Failed to trigger cascade:', error);
    return NextResponse.json({ error: 'Failed to trigger cascade' }, { status: 500 });
  }
}
