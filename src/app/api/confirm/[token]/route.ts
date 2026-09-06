import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { response } = body;

    if (!response || !['YES', 'NO'].includes(response.toUpperCase())) {
      return NextResponse.json({ error: 'Response must be YES or NO' }, { status: 400 });
    }

    const db = await getDb();
    const record = await db.collection('confirmationTokens').findOne({ token });

    if (!record) {
      return NextResponse.json({ error: 'Invalid confirmation link' }, { status: 404 });
    }

    if (record.status !== 'PENDING') {
      return NextResponse.json({
        success: true,
        message: record.status === 'CONFIRMED' ? 'Already confirmed' : 'Already declined',
      });
    }

    if (new Date() > record.expiresAt) {
      return NextResponse.json({ error: 'Confirmation link expired' }, { status: 410 });
    }

    const newStatus = response.toUpperCase() === 'YES' ? 'CONFIRMED' : 'DECLINED';

    await db.collection('confirmationTokens').updateOne(
      { token },
      { $set: { status: newStatus, respondedAt: new Date() } }
    );

    const recoveryCase = await db.collection('recoveryCases').findOne({
      _id: new ObjectId(record.caseId),
    });

    if (recoveryCase) {
      if (newStatus === 'CONFIRMED') {
        await db.collection('recoveryCases').updateOne(
          { _id: recoveryCase._id },
          { $set: {
            confirmationStatus: 'CONFIRMED',
            confirmationTime: new Date(),
            updatedAt: new Date(),
          }}
        );
      } else {
        await db.collection('recoveryCases').updateOne(
          { _id: recoveryCase._id },
          { $set: {
            confirmationStatus: 'DECLINED',
            confirmationTime: new Date(),
            cascadeStatus: 'COMPLETED',
            finalOutcome: 'NOT_BOOKED',
            updatedAt: new Date(),
          }}
        );

        if (recoveryCase.calendarEventLink) {
          try {
            const { getDb: getDbForCalendar } = await import('@/lib/mongodb');
            const calDb = await getDbForCalendar();
            const oauth = await calDb.collection('oauthTokens').findOne({
              clinicId: recoveryCase.clinicId,
              provider: 'google_calendar',
            });

            if (oauth) {
              const { google } = await import('googleapis');
              const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
              );
              oauth2Client.setCredentials({
                access_token: oauth.accessToken,
                refresh_token: oauth.refreshToken,
                expiry_date: oauth.expiresAt.getTime(),
              });
              const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

              const calEvent = await calDb.collection('calendarEvents').findOne({
                _id: recoveryCase.calendarEventId,
              });

              if (calEvent?.googleEventId) {
                await calendar.events.delete({
                  calendarId: 'primary',
                  eventId: calEvent.googleEventId,
                });
              }
            }
          } catch (e) {
            console.error('Failed to cancel calendar event:', e);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: newStatus === 'CONFIRMED'
        ? 'Appointment confirmed! See you then.'
        : 'Appointment declined. The slot has been released.',
    });
  } catch (error: any) {
    console.error('Failed to process confirmation:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
