import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { inngest } from '@/lib/inngest';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;

    console.log(`[SMS WEBHOOK] From: ${from}, Body: ${body}, SID: ${messageSid}`);

    if (!from || !body) {
      return new NextResponse('OK', { status: 200 });
    }

    const normalizedBody = body.trim().toUpperCase();

    if (normalizedBody === 'YES' || normalizedBody === 'Y') {
      const db = await getDb();

      const smsAttempt = await db.collection('smsAttempts')
        .findOne(
          { targetPersonPhone: from, outcome: 'DELIVERED' },
          { sort: { initiatedAt: -1 } }
        );

      if (!smsAttempt) {
        console.log(`[SMS WEBHOOK] No matching SMS attempt for ${from}`);
        return new NextResponse('OK', { status: 200 });
      }

      await db.collection('smsAttempts').updateOne(
        { _id: smsAttempt._id },
        { $set: { outcome: 'REPLIED_YES', completedAt: new Date() } }
      );

      const recoveryCase = await db.collection('recoveryCases').findOne({
        _id: smsAttempt.recoveryCaseId,
      });

      if (recoveryCase && recoveryCase.cascadeStatus !== 'COMPLETED') {
        await db.collection('recoveryCases').updateOne(
          { _id: recoveryCase._id },
          { $set: {
            cascadeStatus: 'COMPLETED',
            finalOutcome: 'BOOKED',
            updatedAt: new Date(),
          }}
        );

        const calendarEvent = await db.collection('calendarEvents').findOne({
          _id: recoveryCase.calendarEventId,
        });

        if (calendarEvent) {
          const { bookCalendarEvent } = await import('@/lib/calendar-sync');
          const result = await bookCalendarEvent({
            clinicId: recoveryCase.clinicId,
            clientName: smsAttempt.targetPersonName,
            clientEmail: 'client@rebookrelay.com',
            clientPhone: smsAttempt.targetPersonPhone,
            serviceType: recoveryCase.originalServiceType,
            startTime: new Date(recoveryCase.availableSlots?.[0]?.start_time || calendarEvent.scheduledStart),
            endTime: new Date(recoveryCase.availableSlots?.[0]?.end_time || calendarEvent.scheduledEnd),
          });

          if (result.success && result.htmlLink) {
            await db.collection('recoveryCases').updateOne(
              { _id: recoveryCase._id },
              { $set: { calendarEventLink: result.htmlLink } }
            );
          }
        }

        console.log(`[SMS WEBHOOK] Case ${recoveryCase._id} BOOKED via SMS reply`);
      }
    } else if (normalizedBody === 'NO' || normalizedBody === 'N') {
      const db = await getDb();
      await db.collection('smsAttempts').updateOne(
        { targetPersonPhone: from, outcome: 'DELIVERED' },
        { $set: { outcome: 'REPLIED_NO', completedAt: new Date() } }
      );
      console.log(`[SMS WEBHOOK] ${from} declined via SMS`);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('[SMS WEBHOOK] Error:', error);
    return new NextResponse('OK', { status: 200 });
  }
}
