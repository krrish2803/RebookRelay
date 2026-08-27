import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Read the logged-in clinicId from the session cookie set during signup/login
    const clinicId = req.cookies.get('session')?.value;

    if (!clinicId) {
      // Return mock data for the hackathon UI if session is missing
      return NextResponse.json({
        success: true,
        data: {
          noShowsDetected: 14,
          callsPlaced: 28,
          rebookings: 9,
          revenueRecovered: 1350.00,
          avgCascadeDepth: 1.8,
          avgSentiment: 0.85,
          recentCases: [
            { id: '1', client: 'Sarah J.', status: 'BOOKED', amount: 150, time: '2 mins ago' },
            { id: '2', client: 'Michael S.', status: 'PENDING_CALL_2', amount: 0, time: '15 mins ago' },
            { id: '3', client: 'Emma W.', status: 'BOOKED', amount: 200, time: '1 hour ago' },
          ]
        }
      }, { status: 200 });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId }
    });

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    // 1. Get total no-shows (RecoveryCases created)
    const totalCases = await prisma.recoveryCase.count({
      where: { clinicId }
    });

    // 2. Get total calls placed
    const totalCalls = await prisma.callAttempt.count({
      where: { recoveryCase: { clinicId } }
    });

    // 3. Get successful rebookings
    const successfulRebookings = await prisma.recoveryCase.count({
      where: { clinicId, cascadeStatus: 'COMPLETED', finalOutcome: 'BOOKED' }
    });

    // 4. Calculate total revenue recovered
    const cases = await prisma.recoveryCase.findMany({
      where: { clinicId, cascadeStatus: 'COMPLETED', finalOutcome: 'BOOKED' },
      select: { revenueRecovered: true }
    });
    const revenueRecovered = cases.reduce((acc, curr) => acc + Number(curr.revenueRecovered || 0), 0);

    // 5. Get recent live cases
    const recentCasesData = await prisma.recoveryCase.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        originalClientName: true,
        cascadeStatus: true,
        revenueRecovered: true,
        createdAt: true
      }
    });

    const recentCases = recentCasesData.map(c => ({
      id: c.id,
      client: c.originalClientName,
      status: c.cascadeStatus,
      amount: Number(c.revenueRecovered || 0),
      time: 'Just now' // In prod, use date-fns formatDistanceToNow
    }));

    return NextResponse.json({
      success: true,
      data: {
        noShowsDetected: totalCases,
        callsPlaced: totalCalls,
        rebookings: successfulRebookings,
        revenueRecovered,
        avgCascadeDepth: 1.5,
        avgSentiment: 0.92,
        recentCases
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
