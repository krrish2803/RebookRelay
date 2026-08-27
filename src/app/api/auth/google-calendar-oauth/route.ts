import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const clinicId = request.cookies.get('session')?.value;
  if (!clinicId) {
    return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Requests a refresh token
    scope: scopes,
    prompt: 'consent' // Forces Google to provide a refresh token every time (useful for testing)
  });

  return NextResponse.redirect(url);
}
