import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseId, clientName, clientPhone, serviceType, slotTime, clinicName } = body;

    if (!caseId || !clientName || !slotTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    const token = crypto.randomBytes(32).toString('hex');

    const result = await db.collection('confirmationTokens').insertOne({
      caseId,
      clientName,
      clientPhone,
      serviceType,
      slotTime,
      clinicName,
      token,
      status: 'PENDING',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://rebookrelay.onrender.com'}/confirm/${token}`;

    return NextResponse.json({
      success: true,
      confirmUrl,
      tokenId: result.insertedId.toString(),
    });
  } catch (error: any) {
    console.error('Failed to create confirmation token:', error);
    return NextResponse.json({ error: 'Failed to create confirmation' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const db = await getDb();
    const record = await db.collection('confirmationTokens').findOne({ token });

    if (!record) {
      return NextResponse.json({ error: 'Invalid confirmation link' }, { status: 404 });
    }

    if (record.status !== 'PENDING') {
      return NextResponse.json({
        success: true,
        status: record.status,
        message: record.status === 'CONFIRMED' ? 'Appointment confirmed!' : 'Appointment declined.',
      });
    }

    if (new Date() > record.expiresAt) {
      return NextResponse.json({ error: 'Confirmation link expired' }, { status: 410 });
    }

    return NextResponse.json({
      success: true,
      status: 'PENDING',
      data: {
        clientName: record.clientName,
        serviceType: record.serviceType,
        slotTime: record.slotTime,
        clinicName: record.clinicName,
      },
    });
  } catch (error: any) {
    console.error('Failed to verify confirmation:', error);
    return NextResponse.json({ error: 'Failed to verify' }, { status: 500 });
  }
}
