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

    const body = await req.json().catch(() => ({}));
    const { calendarEventId, availableSlots } = body;

    let calendarEvent;

    if (calendarEventId) {
      calendarEvent = await db.collection('calendarEvents').findOne({
        _id: new ObjectId(calendarEventId),
        clinicId,
      });
    } else {
      calendarEvent = await db.collection('calendarEvents')
        .findOne({ clinicId, status: 'confirmed' }, { sort: { scheduledStart: -1 } });
    }

    if (!calendarEvent) {
      return NextResponse.json({ error: 'Calendar event not found' }, { status: 404 });
    }

    const eventId = calendarEvent._id.toString();
    const existingCase = await db.collection('recoveryCases').findOne({ calendarEventId: eventId });
    if (existingCase) {
      return NextResponse.json({ error: 'A recovery case already exists for this event' }, { status: 409 });
    }

    const slots = availableSlots || [{
      start_time: calendarEvent.scheduledStart,
      end_time: calendarEvent.scheduledEnd,
      service_duration: calendarEvent.durationMin || 30,
    }];

    const result = await db.collection('recoveryCases').insertOne({
      clinicId,
      calendarEventId: eventId,
      originalClientId: 'manual_' + Date.now(),
      originalClientName: calendarEvent.clientName,
      originalClientPhone: calendarEvent.clientPhone,
      originalAppointmentStart: calendarEvent.scheduledStart,
      originalServiceType: calendarEvent.serviceType,
      originalServiceDurationMin: calendarEvent.durationMin,
      availableSlots: slots,
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
