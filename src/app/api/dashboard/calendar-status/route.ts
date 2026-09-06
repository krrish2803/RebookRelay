import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const clinicId = req.cookies.get('session')?.value;
  if (!clinicId) {
    return NextResponse.json({ connected: false });
  }

  try {
    const db = await getDb();
    const token = await db.collection('oauthTokens').findOne({
      clinicId,
      provider: 'google_calendar',
    });

    return NextResponse.json({ connected: !!token });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
