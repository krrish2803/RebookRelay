import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const clinicId = req.cookies.get('session')?.value;

    if (!clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const people = await prisma.waitlistPerson.findMany({
      where: { clinicId },
      orderBy: { priorityScore: 'desc' }
    });

    const formatted = people.map(p => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      email: p.email,
      serviceType: p.serviceType,
      preferredTimes: p.preferredTimes,
      daysOnWaitlist: p.daysOnWaitlist,
      status: p.status,
      priorityScore: p.priorityScore,
      noShowCount: p.noShowCount,
      lastBookedAt: p.lastBookedAt,
      createdAt: p.createdAt,
    }));

    const totalActive = people.filter(p => p.status === 'ACTIVE').length;
    const topPriority = people.length > 0 ? people[0]?.priorityScore ?? 0 : 0;

    return NextResponse.json({
      success: true,
      data: {
        people: formatted,
        stats: {
          totalActive,
          topPriority,
        }
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

    const { name, phone, email, serviceType, preferredTimes } = await req.json();

    if (!name || !phone || !email || !serviceType) {
      return NextResponse.json({ error: 'Name, phone, email, and serviceType are required' }, { status: 400 });
    }

    const existing = await prisma.waitlistPerson.findFirst({
      where: { clinicId, email, status: 'ACTIVE' }
    });

    if (existing) {
      return NextResponse.json({ error: 'This person is already on the waitlist' }, { status: 409 });
    }

    const daysOnWaitlist = 0;
    const priorityScore = 100;

    const person = await prisma.waitlistPerson.create({
      data: {
        clinicId,
        name,
        phone,
        email,
        serviceType,
        preferredTimes: preferredTimes || [],
        daysOnWaitlist,
        status: 'ACTIVE',
        priorityScore,
      }
    });

    return NextResponse.json({ success: true, data: person });
  } catch (error: any) {
    console.error('Failed to add to waitlist:', error);
    return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 });
  }
}
