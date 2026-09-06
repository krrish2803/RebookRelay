import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const clinicId = req.cookies.get('session')?.value;
    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const people = await db.collection('waitlistPeople')
      .find({ clinicId })
      .sort({ priorityScore: -1 })
      .toArray();

    const formatted = people.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      phone: p.phone,
      email: p.email,
      serviceType: p.serviceType,
      preferredTimes: p.preferredTimes || [],
      preferredDays: p.preferredDays || [],
      preferredTimeSlots: p.preferredTimeSlots || [],
      contactMethod: p.contactMethod || 'phone',
      daysOnWaitlist: p.daysOnWaitlist,
      status: p.status,
      priorityScore: p.priorityScore,
      noShowCount: p.noShowCount || 0,
      lastBookedAt: p.lastBookedAt,
    }));

    const totalActive = formatted.filter((p: any) => p.status === 'ACTIVE').length;
    const topPriority = formatted.length > 0 ? formatted[0].priorityScore : 0;

    return NextResponse.json({
      success: true,
      data: {
        people: formatted,
        stats: { totalActive, topPriority }
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch waitlist:', error);
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clinicId = req.cookies.get('session')?.value;
    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, email, serviceType, preferredTimes, preferredDays, preferredTimeSlots, contactMethod } = body;

    if (!name || !phone || !email || !serviceType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();

    const existing = await db.collection('waitlistPeople').findOne({
      clinicId,
      email,
      status: 'ACTIVE'
    });

    if (existing) {
      return NextResponse.json({ error: 'This email is already on the waitlist' }, { status: 409 });
    }

    const result = await db.collection('waitlistPeople').insertOne({
      clinicId,
      name,
      phone,
      email,
      serviceType,
      preferredTimes: preferredTimes || [],
      preferredDays: preferredDays || [],
      preferredTimeSlots: preferredTimeSlots || [],
      contactMethod: contactMethod || 'phone',
      daysOnWaitlist: 0,
      status: 'ACTIVE',
      priorityScore: 100,
      noShowCount: 0,
      lastBookedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { id: result.insertedId.toString() }
    });
  } catch (error: any) {
    console.error('Failed to add to waitlist:', error);
    return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 });
  }
}
