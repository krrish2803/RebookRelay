import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const clinicId = req.cookies.get('session')?.value;

    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cases = await prisma.recoveryCase.findMany({
      where: { clinicId },
      include: {
        calendarEvent: {
          select: {
            serviceType: true,
            scheduledStart: true,
            scheduledEnd: true,
          }
        },
        callAttempts: {
          select: {
            id: true,
            targetPersonName: true,
            outcome: true,
            callSequence: true,
            initiatedAt: true,
            completedAt: true,
          },
          orderBy: { callSequence: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = cases.map(c => ({
      id: c.id,
      client: c.originalClientName,
      phone: c.originalClientPhone,
      service: c.originalServiceType,
      originalTime: c.originalAppointmentStart,
      status: c.cascadeStatus,
      finalOutcome: c.finalOutcome,
      currentCallDepth: c.currentCallDepth,
      revenueRecovered: c.revenueRecovered ? Number(c.revenueRecovered) : null,
      callAttempts: c.callAttempts.map(a => ({
        id: a.id,
        target: a.targetPersonName,
        outcome: a.outcome,
        callSequence: a.callSequence,
        initiatedAt: a.initiatedAt,
        completedAt: a.completedAt,
      })),
      createdAt: c.createdAt,
      completedAt: c.completedAt,
    }));

    const stats = {
      total: cases.length,
      recovered: cases.filter(c => c.finalOutcome === 'BOOKED').length,
      inProgress: cases.filter(c => !c.completedAt).length,
      failed: cases.filter(c => c.finalOutcome === 'NOT_BOOKED').length,
    };

    return NextResponse.json({ success: true, data: { cases: formatted, stats } });
  } catch (error: any) {
    console.error('Failed to fetch no-shows:', error);
    return NextResponse.json({ error: 'Failed to fetch no-shows' }, { status: 500 });
  }
}
