import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getDb } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

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
    const clinicId = req.cookies.get('session')?.value;

    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const db = await getDb();

    if (tokens.refresh_token) {
      const existing = await db.collection('oauthTokens').findOne({
        clinicId, provider: 'google_calendar'
      });

      const tokenData = {
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
        updatedAt: new Date(),
      };

      if (existing) {
        await db.collection('oauthTokens').updateOne(
          { clinicId, provider: 'google_calendar' },
          { $set: tokenData }
        );
      } else {
        await db.collection('oauthTokens').insertOne({
          clinicId,
          provider: 'google_calendar',
          ...tokenData,
          createdAt: new Date(),
        });
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rebookrelay.onrender.com';
    return NextResponse.redirect(new URL('/dashboard?calendar_connected=true', appUrl));
  } catch (error) {
    console.error('Error exchanging Google OAuth code:', error);
    return NextResponse.json({ error: 'Failed to connect Google Calendar' }, { status: 500 });
  }
}
