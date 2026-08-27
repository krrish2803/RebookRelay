import prisma from './prisma';
import { google } from 'googleapis';
import { inngest } from './inngest';

/**
 * Syncs events from Google Calendar and detects no-shows or cancellations.
 * Uses real googleapis client and queries stored OAuth credentials.
 */
export async function syncGoogleCalendarEvents(clinicId: string) {
  console.log(`Starting calendar sync for clinic: ${clinicId}`);

  // 1. Fetch OAuth Token from DB
  const oauthToken = await prisma.oAuthToken.findUnique({
    where: { clinicId_provider: { clinicId, provider: 'google_calendar' } }
  });

  if (!oauthToken) {
    console.log(`No Google Calendar connection found for clinic: ${clinicId}`);
    return { syncedCount: 0, noShowsDetected: 0, cascadesInitiated: 0 };
  }

  // 2. Initialize Google OAuth Client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: oauthToken.accessToken,
    refresh_token: oauthToken.refreshToken,
    expiry_date: oauthToken.expiresAt.getTime()
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  let noShowsDetected = 0;
  let cascadesInitiated = 0;
  let syncedCount = 0;

  try {
    // 3. Fetch recent events from Google Calendar (last 2 hours)
    const timeMin = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString();
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const googleEvents = response.data.items || [];
    syncedCount = googleEvents.length;

    for (const event of googleEvents) {
      const description = event.description || '';
      const summary = event.summary || '';
      
      // Detect no shows by tags in the event summary or description
      const isNoShow = description.toLowerCase().includes('#noshow') || 
                       summary.toLowerCase().includes('no-show') ||
                       description.toLowerCase().includes('no show');

      if (!isNoShow) continue;

      // Extract client phone number from description (e.g. "Phone: +15551234567")
      const phoneMatch = description.match(/Phone:\s*(\+?[0-9\s\-]+)/i);
      const clientPhone = phoneMatch ? phoneMatch[1].trim().replace(/\s+/g, '') : '+15550123456';
      
      // Extract client email (e.g. "Email: client@example.com")
      const emailMatch = description.match(/Email:\s*([^\s]+@[^\s]+)/i);
      const clientEmail = emailMatch ? emailMatch[1].trim() : 'client@example.com';

      const googleEventId = event.id!;
      const clientName = summary.split('-')[0]?.trim() || 'Client';
      const serviceType = summary.split('-')[1]?.trim() || 'Consultation';
      const start = event.start?.dateTime ? new Date(event.start.dateTime) : new Date();
      const end = event.end?.dateTime ? new Date(event.end.dateTime) : new Date();
      
      const durationMin = Math.round((end.getTime() - start.getTime()) / (1000 * 60)) || 30;

      // Check if this event already exists in our database
      const existingEvent = await prisma.calendarEvent.findUnique({
        where: { googleEventId }
      });

      if (!existingEvent) {
        // Create new event in DB
        const newEvent = await prisma.calendarEvent.create({
          data: {
            clinicId: clinicId,
            googleEventId,
            clientName,
            clientEmail,
            clientPhone,
            serviceType,
            durationMin,
            scheduledStart: start,
            scheduledEnd: end,
            status: 'no_show',
          }
        });

        noShowsDetected++;
        const caseCreated = await triggerRecoveryCascade(newEvent);
        if (caseCreated) cascadesInitiated++;

      } else if (existingEvent.status !== 'no_show') {
        // Update to no show status
        const updatedEvent = await prisma.calendarEvent.update({
          where: { id: existingEvent.id },
          data: { status: 'no_show', syncedAt: new Date() }
        });

        noShowsDetected++;
        const caseCreated = await triggerRecoveryCascade(updatedEvent);
        if (caseCreated) cascadesInitiated++;
      }
    }

  } catch (error) {
    console.error('Error fetching from Google Calendar API:', error);
  }

  return { syncedCount, noShowsDetected, cascadesInitiated };
}

/**
 * Creates a RecoveryCase in the database and triggers the Inngest workflow.
 */
async function triggerRecoveryCascade(calendarEvent: any) {
  // Check if a recovery case already exists so we don't double-call
  const existingCase = await prisma.recoveryCase.findUnique({
    where: { calendarEventId: calendarEvent.id }
  });

  if (existingCase) return false;

  // Create the Recovery Case in Postgres
  const recoveryCase = await prisma.recoveryCase.create({
    data: {
      clinicId: calendarEvent.clinicId,
      calendarEventId: calendarEvent.id,
      originalClientId: 'temp', 
      originalClientName: calendarEvent.clientName,
      originalClientPhone: calendarEvent.clientPhone,
      originalAppointmentStart: calendarEvent.scheduledStart,
      originalServiceType: calendarEvent.serviceType,
      originalServiceDurationMin: calendarEvent.durationMin,
      availableSlots: [
        // We offer the exact slot that was just cancelled!
        {
          start_time: calendarEvent.scheduledStart,
          end_time: calendarEvent.scheduledEnd,
          service_duration: calendarEvent.durationMin
        }
      ],
      cascadeStatus: 'PENDING_CALL_1',
    }
  });

  // Fire the event to wake up the Inngest Orchestrator we built earlier!
  await inngest.send({
    name: 'recovery.case.created',
    data: { caseId: recoveryCase.id }
  });

  console.log(`[CASCADE INITIATED] Recovery Case ${recoveryCase.id} created for ${calendarEvent.clientName}`);
  return true;
}
