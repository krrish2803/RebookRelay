import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

const SALT_ROUNDS = 10;

export async function POST(req: NextRequest) {
  try {
    const { clinicName, email, password } = await req.json();

    if (!clinicName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const db = await getDb();

    const existingStaff = await db.collection('staff').findOne({ email });
    if (existingStaff) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const clinicResult = await db.collection('clinics').insertOne({
      name: clinicName,
      businessType: 'clinic',
      timezone: 'America/New_York',
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const clinicId = clinicResult.insertedId.toString();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await db.collection('staff').insertOne({
      clinicId,
      name: email.split('@')[0],
      email,
      passwordHash,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = NextResponse.json({ success: true, clinicId });
    response.cookies.set('session', clinicId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
