import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { clinicName, email, password } = await req.json();

    // 1. Input Validation
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

    // 2. Duplicate User Check
    const existingStaff = await prisma.staff.findUnique({
      where: { email }
    });

    if (existingStaff) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // 3. Create the Clinic
    const clinic = await prisma.clinic.create({
      data: {
        name: clinicName,
        businessType: 'clinic', // Fix missing businessType
        timezone: 'America/New_York', // default
      }
    });

    // 4. Create the Staff member (Owner)
    const staff = await prisma.staff.create({
      data: {
        clinicId: clinic.id,
        name: email.split('@')[0],
        email: email,
        passwordHash: hashPassword(password), // Fixed: Hashed with SHA-256
        role: 'admin' // Fixed casing to match schema
      }
    });

    // 5. Set cookie (Auto Login)
    const response = NextResponse.json({ success: true, clinicId: clinic.id });
    response.cookies.set('session', clinic.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
