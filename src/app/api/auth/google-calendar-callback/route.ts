import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  // Verify OAuth state to prevent CSRF
  const savedState = req.cookies.get('oauth_state')?.value;
  if (!state || state !== savedState) {
    return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 403 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    // Read the logged-in clinicId from the session cookie
    const clinicId = req.cookies.get('session')?.value;
    
    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId }
    });
    
    if (clinic && tokens.refresh_token) {
      await prisma.oAuthToken.upsert({
        where: { clinicId_provider: { clinicId: clinic.id, provider: 'google_calendar' } },
        update: {
          accessToken: tokens.access_token || '',
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000)
        },
        create: {
          clinicId: clinic.id,
          provider: 'google_calendar',
          accessToken: tokens.access_token || '',
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000)
        }
      });
    }

    // Redirect them back to the dashboard with a success message
    return NextResponse.redirect(new URL('/dashboard?calendar_connected=true', req.url));
  } catch (error) {
    console.error('Error exchanging Google OAuth code:', error);
    return NextResponse.json({ error: 'Failed to connect Google Calendar' }, { status: 500 });
  }
}
