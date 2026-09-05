import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { inngest } from '@/lib/inngest';

export async function POST(req: NextRequest) {
  try {
    const clinicId = req.cookies.get('session')?.value;

    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    const calendarEvent = await prisma.calendarEvent.findFirst({
      where: { clinicId, status: 'confirmed' },
      orderBy: { scheduledStart: 'desc' }
    });

    if (!calendarEvent) {
      return NextResponse.json({ error: 'No confirmed calendar events found. Connect Google Calendar first.' }, { status: 400 });
    }

    const existingCase = await prisma.recoveryCase.findFirst({
      where: { clinicId, calendarEventId: calendarEvent.id }
    });

    if (existingCase) {
      return NextResponse.json({ error: 'A recovery case already exists for this event' }, { status: 409 });
    }

    const recoveryCase = await prisma.recoveryCase.create({
      data: {
        clinicId,
        calendarEventId: calendarEvent.id,
        originalClientId: 'test_client',
        originalClientName: calendarEvent.clientName,
        originalClientPhone: calendarEvent.clientPhone,
        originalAppointmentStart: calendarEvent.scheduledStart,
        originalServiceType: calendarEvent.serviceType,
        originalServiceDurationMin: calendarEvent.durationMin,
        availableSlots: [],
        cascadeStatus: 'PENDING_CALL_1',
        currentCallDepth: 0,
        finalOutcome: 'PENDING',
      }
    });

    await inngest.send({
      name: 'recovery.case.created',
      data: { caseId: recoveryCase.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Cascade triggered! The workflow will call the client shortly.',
      data: { caseId: recoveryCase.id }
    });
  } catch (error: any) {
    console.error('Failed to trigger cascade:', error);
    return NextResponse.json({ error: 'Failed to trigger cascade' }, { status: 500 });
  }
}
