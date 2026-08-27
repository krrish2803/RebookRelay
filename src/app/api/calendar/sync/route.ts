import { NextRequest, NextResponse } from 'next/server';
import { syncGoogleCalendarEvents } from '@/lib/calendar-sync';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Read the logged-in clinicId from the session cookie
    const clinicId = req.cookies.get('session')?.value;

    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    // Run the calendar sync logic!
    const result = await syncGoogleCalendarEvents(clinicId);

    return NextResponse.json({
      success: true,
      message: 'Calendar sync completed',
      data: result
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to sync calendar:', error);
    return NextResponse.json({ error: 'Failed to sync calendar', details: error.message }, { status: 500 });
  }
}
