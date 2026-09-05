import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const clinicId = req.cookies.get('session')?.value;
    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const db = await getDb();
    const clinic = await db.collection('clinics').findOne({ id: clinicId });
    const staff = await db.collection('staff').findOne({ clinicId });

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

    const db = await getDb();
    const clinic = await db.collection('clinics').findOne({ id: clinicId });
    const staff = await db.collection('staff').findOne({ clinicId });

    if (!clinic || !staff) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    if (clinicName && clinicName !== clinic.name) {
      await db.collection('clinics').updateOne({ id: clinicId }, { $set: { name: clinicName, updatedAt: new Date() } });
    }

    if (phone !== undefined && phone !== clinic.phone) {
      await db.collection('clinics').updateOne({ id: clinicId }, { $set: { phone, updatedAt: new Date() } });
    }

    if (email && email !== staff.email) {
      const existing = await db.collection('staff').findOne({ email });
      if (existing && existing._id.toString() !== staff._id.toString()) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
      await db.collection('staff').updateOne({ clinicId }, { $set: { email, updatedAt: new Date() } });
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
      await db.collection('staff').updateOne({ clinicId }, { $set: { passwordHash: hash, updatedAt: new Date() } });
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

    const db = await getDb();
    await db.collection('staff').deleteMany({ clinicId });
    await db.collection('clinics').deleteOne({ id: clinicId });
    await db.collection('calendarEvents').deleteMany({ clinicId });
    await db.collection('recoveryCases').deleteMany({ clinicId });
    await db.collection('waitlistPeople').deleteMany({ clinicId });
    await db.collection('oauthTokens').deleteMany({ clinicId });

    const response = NextResponse.json({ success: true, message: 'Account deleted' });
    response.cookies.set('session', '', { maxAge: 0, path: '/' });

    return response;
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
