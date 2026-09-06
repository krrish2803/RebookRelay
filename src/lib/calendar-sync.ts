import { getDb } from './mongodb';
import { google } from 'googleapis';
import { inngest } from './inngest';
import { ObjectId } from 'mongodb';

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

async function getCalendarClient(clinicId: string) {
  const db = await getDb();
  const oauth = await db.collection('oauthTokens').findOne({ clinicId, provider: 'google_calendar' });
  if (!oauth) return null;

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: oauth.accessToken,
    refresh_token: oauth.refreshToken,
    expiry_date: oauth.expiresAt.getTime()
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function bookCalendarEvent(params: {
  clinicId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceType: string;
  startTime: Date;
  endTime: Date;
}) {
  const calendar = await getCalendarClient(params.clinicId);
  if (!calendar) {
    return { success: false, error: 'Google Calendar not connected' };
  }

  try {
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `${params.clientName} - ${params.serviceType}`,
        description: `Client: ${params.clientName}\nPhone: ${params.clientPhone}\nEmail: ${params.clientEmail}\n\nBooked via RebookRelay AI Recovery.`,
        start: {
          dateTime: params.startTime.toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: params.endTime.toISOString(),
          timeZone: 'America/New_York',
        },
      },
    });

    console.log(`[BOOKED] Calendar event created: ${event.data.id} for ${params.clientName}`);
    return { success: true, eventId: event.data.id, htmlLink: event.data.htmlLink || null };
  } catch (error: any) {
    console.error('Failed to create calendar event:', error.message);
    return { success: false, error: error.message };
  }
}

export async function syncGoogleCalendarEvents(clinicId: string) {
  console.log(`Starting calendar sync for clinic: ${clinicId}`);

  const calendar = await getCalendarClient(clinicId);
  if (!calendar) {
    console.log(`No Google Calendar connection found for clinic: ${clinicId}`);
    return { syncedCount: 0, noShowsDetected: 0, cascadesInitiated: 0 };
  }

  const db = await getDb();
  let noShowsDetected = 0;
  let cascadesInitiated = 0;
  let syncedCount = 0;

  try {
    const timeMin = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString();
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const googleEvents = response.data.items || [];
    syncedCount = googleEvents.length;

    for (const event of googleEvents) {
      const description = event.description || '';
      const summary = event.summary || '';

      const isNoShow = description.toLowerCase().includes('#noshow') ||
                       summary.toLowerCase().includes('no-show') ||
                       description.toLowerCase().includes('no show');

      if (!isNoShow) continue;

      const phoneMatch = description.match(/Phone:\s*(\+?[0-9\s\-]+)/i);
      const clientPhone = phoneMatch ? phoneMatch[1].trim().replace(/\s+/g, '') : '+15550123456';

      const emailMatch = description.match(/Email:\s*([^\s]+@[^\s]+)/i);
      const clientEmail = emailMatch ? emailMatch[1].trim() : 'client@example.com';

      const googleEventId = event.id!;
      const clientName = summary.split('-')[0]?.trim() || 'Client';
      const serviceType = summary.split('-')[1]?.trim() || 'Consultation';
      const start = event.start?.dateTime ? new Date(event.start.dateTime) : new Date();
      const end = event.end?.dateTime ? new Date(event.end.dateTime) : new Date();
      const durationMin = Math.round((end.getTime() - start.getTime()) / (1000 * 60)) || 30;

      const existingEvent = await db.collection('calendarEvents').findOne({ googleEventId });

      if (!existingEvent) {
        const result = await db.collection('calendarEvents').insertOne({
          clinicId,
          googleEventId,
          clientName,
          clientEmail,
          clientPhone,
          serviceType,
          durationMin,
          scheduledStart: start,
          scheduledEnd: end,
          status: 'no_show',
          createdAt: new Date(),
        });

        noShowsDetected++;
        const newEvent = { _id: result.insertedId.toString(), clinicId, clientName, clientPhone, serviceType, scheduledStart: start, scheduledEnd: end, durationMin };
        const caseCreated = await triggerRecoveryCascade(newEvent);
        if (caseCreated) cascadesInitiated++;

      } else if (existingEvent.status !== 'no_show') {
        await db.collection('calendarEvents').updateOne(
          { _id: existingEvent._id },
          { $set: { status: 'no_show', syncedAt: new Date() } }
        );

        noShowsDetected++;
        const updatedEvent = { _id: existingEvent._id.toString(), clinicId: existingEvent.clinicId, clientName: existingEvent.clientName, clientPhone: existingEvent.clientPhone, serviceType: existingEvent.serviceType, scheduledStart: existingEvent.scheduledStart, scheduledEnd: existingEvent.scheduledEnd, durationMin: existingEvent.durationMin };
        const caseCreated = await triggerRecoveryCascade(updatedEvent);
        if (caseCreated) cascadesInitiated++;
      }
    }

  } catch (error) {
    console.error('Error fetching from Google Calendar API:', error);
  }

  return { syncedCount, noShowsDetected, cascadesInitiated };
}

async function triggerRecoveryCascade(calendarEvent: any) {
  const db = await getDb();
  const existingCase = await db.collection('recoveryCases').findOne({ calendarEventId: calendarEvent._id });
  if (existingCase) return false;

  const result = await db.collection('recoveryCases').insertOne({
    clinicId: calendarEvent.clinicId,
    calendarEventId: calendarEvent._id,
    originalClientId: 'temp',
    originalClientName: calendarEvent.clientName,
    originalClientPhone: calendarEvent.clientPhone,
    originalAppointmentStart: calendarEvent.scheduledStart,
    originalServiceType: calendarEvent.serviceType,
    originalServiceDurationMin: calendarEvent.durationMin,
    availableSlots: [
      {
        start_time: calendarEvent.scheduledStart,
        end_time: calendarEvent.scheduledEnd,
        service_duration: calendarEvent.durationMin
      }
    ],
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

  console.log(`[CASCADE INITIATED] Recovery Case ${caseId} created for ${calendarEvent.clientName}`);
  return true;
}
