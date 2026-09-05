import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        clinicName: clinic.name,
        email: staff.email,
        phone: clinic.phone || '',
        businessType: clinic.businessType,
        timezone: clinic.timezone,
        password: "••••••••"
      }
    });
  } catch (error: any) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const clinicId = req.cookies.get('session')?.value;

    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { clinicName, phone, email, currentPassword, newPassword } = body;

    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    const staff = await prisma.staff.findFirst({ where: { clinicId } });

    if (!clinic || !staff) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    if (clinicName && clinicName !== clinic.name) {
      await prisma.clinic.update({ where: { id: clinicId }, data: { name: clinicName } });
    }

    if (phone !== undefined && phone !== clinic.phone) {
      await prisma.clinic.update({ where: { id: clinicId }, data: { phone } });
    }

    if (email && email !== staff.email) {
      const existing = await prisma.staff.findUnique({ where: { email } });
      if (existing && existing.id !== staff.id) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
      await prisma.staff.update({ where: { id: staff.id }, data: { email } });
    }

    if (newPassword && currentPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, staff.passwordHash || '');
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      const hash = await bcrypt.hash(newPassword, 10);
      await prisma.staff.update({ where: { id: staff.id }, data: { passwordHash: hash } });
    }

    return NextResponse.json({ success: true, message: 'Settings updated' });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const clinicId = req.cookies.get('session')?.value;

    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.staff.deleteMany({ where: { clinicId } });
    await prisma.clinic.delete({ where: { id: clinicId } });

    const response = NextResponse.json({ success: true, message: 'Account deleted' });
    response.cookies.set('session', '', { maxAge: 0, path: '/' });

    return response;
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
