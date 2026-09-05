import { NextRequest, NextResponse } from 'next/server';
import { syncGoogleCalendarEvents } from '@/lib/calendar-sync';

export async function POST(req: NextRequest) {
  try {
    const clinicId = req.cookies.get('session')?.value;

    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

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
