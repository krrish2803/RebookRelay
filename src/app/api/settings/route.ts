import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Read the logged-in clinicId from the session cookie set during signup/login
    const clinicId = req.cookies.get('session')?.value;

    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId }
    });

    const staff = await prisma.staff.findFirst({
      where: { clinicId }
    });

    if (!clinic || !staff) {
      return NextResponse.json({
        success: true,
        data: {
          clinicName: "No Clinic Found",
          email: "No Staff Found",
          password: ""
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        clinicName: clinic.name,
        email: staff.email,
        password: "••••••••" // Masked to prevent passwordHash leak
      }
    });
  } catch (error: any) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
