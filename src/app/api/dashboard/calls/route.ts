import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const clinicId = req.cookies.get('session')?.value;

    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const calls = await prisma.callAttempt.findMany({
      where: {
        recoveryCase: { clinicId }
      },
      include: {
        recoveryCase: {
          select: {
            originalClientName: true,
            originalServiceType: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = calls.map(call => ({
      id: call.id,
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
      serviceType: call.recoveryCase.originalServiceType,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Failed to fetch calls:', error);
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
  }
}
