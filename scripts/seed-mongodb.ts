import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb+srv://USER:PASS@cluster.mongodb.net/rebookrelay';

async function seed() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db('rebookrelay');

    console.log('Connected to MongoDB. Seeding demo data...\n');

    // Clear existing data
    const collections = ['clinics', 'staff', 'oauthTokens', 'calendarEvents', 'recoveryCases', 'callAttempts', 'waitlistPeople', 'smsAttempts', 'confirmationTokens', 'auditLogs'];
    for (const col of collections) {
      await db.collection(col).deleteMany({});
    }
    console.log('Cleared all collections');

    // ========== 1. CLINIC ==========
    const clinicResult = await db.collection('clinics').insertOne({
      name: 'Serenity Dental Clinic',
      businessType: 'dental',
      timezone: 'America/New_York',
      phone: '+15550123456',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const clinicId = clinicResult.insertedId.toString();
    console.log(`Clinic: ${clinicId}`);

    // ========== 2. STAFF ==========
    const passwordHash = await bcrypt.hash('test123', 10);
    await db.collection('staff').insertOne({
      clinicId,
      name: 'Dr. Sarah Mitchell',
      email: 'sarah@serenitydental.com',
      passwordHash,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Staff: sarah@serenitydental.com / test123');

    // ========== 3. WAITLIST (8 people with preferences) ==========
    const now = new Date();
    const waitlistData = [
      {
        name: 'James Wilson', phone: '+15559876543', email: 'james@email.com',
        serviceType: 'Teeth Cleaning', priorityScore: 95, daysOnWaitlist: 14,
        preferredDays: ['Mon', 'Tue', 'Wed'], preferredTimeSlots: ['Morning', 'Afternoon'],
        contactMethod: 'sms', noShowCount: 0,
      },
      {
        name: 'Emily Chen', phone: '+15558765432', email: 'emily@email.com',
        serviceType: 'Teeth Cleaning', priorityScore: 88, daysOnWaitlist: 10,
        preferredDays: ['Thu', 'Fri'], preferredTimeSlots: ['Afternoon', 'Evening'],
        contactMethod: 'phone', noShowCount: 1,
      },
      {
        name: 'Michael Brown', phone: '+15557654321', email: 'michael@email.com',
        serviceType: 'Dental Checkup', priorityScore: 82, daysOnWaitlist: 7,
        preferredDays: ['Mon', 'Wed', 'Fri'], preferredTimeSlots: ['Morning'],
        contactMethod: 'sms', noShowCount: 0,
      },
      {
        name: 'Lisa Anderson', phone: '+15556543210', email: 'lisa@email.com',
        serviceType: 'Teeth Cleaning', priorityScore: 76, daysOnWaitlist: 5,
        preferredDays: ['Tue', 'Thu'], preferredTimeSlots: ['Morning', 'Afternoon'],
        contactMethod: 'email', noShowCount: 0,
      },
      {
        name: 'David Kim', phone: '+15555432109', email: 'david@email.com',
        serviceType: 'Root Canal', priorityScore: 92, daysOnWaitlist: 18,
        preferredDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], preferredTimeSlots: ['Morning', 'Afternoon', 'Evening'],
        contactMethod: 'phone', noShowCount: 2,
      },
      {
        name: 'Sarah Lopez', phone: '+15554321098', email: 'sarah.l@email.com',
        serviceType: 'Teeth Whitening', priorityScore: 70, daysOnWaitlist: 3,
        preferredDays: ['Sat'], preferredTimeSlots: ['Morning'],
        contactMethod: 'sms', noShowCount: 0,
      },
      {
        name: 'Kevin Patel', phone: '+15553210987', email: 'kevin@email.com',
        serviceType: 'Dental Checkup', priorityScore: 65, daysOnWaitlist: 2,
        preferredDays: ['Wed', 'Fri'], preferredTimeSlots: ['Afternoon'],
        contactMethod: 'phone', noShowCount: 0,
      },
      {
        name: 'Amanda Torres', phone: '+15552109876', email: 'amanda@email.com',
        serviceType: 'Teeth Cleaning', priorityScore: 60, daysOnWaitlist: 1,
        preferredDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], preferredTimeSlots: ['Morning', 'Afternoon'],
        contactMethod: 'sms', noShowCount: 0,
      },
    ];

    const waitlistIds: string[] = [];
    for (const p of waitlistData) {
      const result = await db.collection('waitlistPeople').insertOne({
        clinicId,
        status: 'ACTIVE',
        lastBookedAt: null,
        createdAt: new Date(now.getTime() - p.daysOnWaitlist * 86400000),
        updatedAt: new Date(),
        ...p,
      });
      waitlistIds.push(result.insertedId.toString());
    }
    console.log(`Waitlist: ${waitlistData.length} people with preferences`);

    // ========== 4. CALENDAR EVENTS (8 events) ==========
    const eventsData = [
      // No-show 1 - RECOVERED (completed)
      {
        googleEventId: 'gcal_001',
        clientName: 'Alex Thompson',
        clientEmail: 'alex@email.com',
        clientPhone: '+15551234001',
        serviceType: 'Teeth Cleaning',
        durationMin: 30,
        scheduledStart: new Date(now.getTime() - 3 * 3600000),
        scheduledEnd: new Date(now.getTime() - 3 * 3600000 + 30 * 60000),
        status: 'no_show',
      },
      // No-show 2 - IN PROGRESS (cascade active)
      {
        googleEventId: 'gcal_002',
        clientName: 'Rachel Green',
        clientEmail: 'rachel@email.com',
        clientPhone: '+15551234002',
        serviceType: 'Dental Checkup',
        durationMin: 45,
        scheduledStart: new Date(now.getTime() - 5 * 3600000),
        scheduledEnd: new Date(now.getTime() - 5 * 3600000 + 45 * 60000),
        status: 'no_show',
      },
      // No-show 3 - NOT BOOKED (failed)
      {
        googleEventId: 'gcal_005',
        clientName: 'Marcus Johnson',
        clientEmail: 'marcus@email.com',
        clientPhone: '+15551234005',
        serviceType: 'Teeth Whitening',
        durationMin: 60,
        scheduledStart: new Date(now.getTime() - 8 * 3600000),
        scheduledEnd: new Date(now.getTime() - 8 * 3600000 + 60 * 60000),
        status: 'no_show',
      },
      // No-show 4 - just detected, pending cascade
      {
        googleEventId: 'gcal_006',
        clientName: 'Priya Sharma',
        clientEmail: 'priya@email.com',
        clientPhone: '+15551234006',
        serviceType: 'Root Canal',
        durationMin: 90,
        scheduledStart: new Date(now.getTime() - 1 * 3600000),
        scheduledEnd: new Date(now.getTime() - 1 * 3600000 + 90 * 60000),
        status: 'no_show',
      },
      // Confirmed upcoming 1
      {
        googleEventId: 'gcal_003',
        clientName: 'Tom Harris',
        clientEmail: 'tom@email.com',
        clientPhone: '+15551234003',
        serviceType: 'Teeth Whitening',
        durationMin: 60,
        scheduledStart: new Date(now.getTime() + 2 * 3600000),
        scheduledEnd: new Date(now.getTime() + 2 * 3600000 + 60 * 60000),
        status: 'confirmed',
      },
      // Confirmed upcoming 2
      {
        googleEventId: 'gcal_007',
        clientName: 'Jessica Wang',
        clientEmail: 'jessica@email.com',
        clientPhone: '+15551234007',
        serviceType: 'Teeth Cleaning',
        durationMin: 30,
        scheduledStart: new Date(now.getTime() + 4 * 3600000),
        scheduledEnd: new Date(now.getTime() + 4 * 3600000 + 30 * 60000),
        status: 'confirmed',
      },
      // Confirmed upcoming 3
      {
        googleEventId: 'gcal_008',
        clientName: 'Brian Cooper',
        clientEmail: 'brian@email.com',
        clientPhone: '+15551234008',
        serviceType: 'Dental Checkup',
        durationMin: 45,
        scheduledStart: new Date(now.getTime() + 24 * 3600000),
        scheduledEnd: new Date(now.getTime() + 24 * 3600000 + 45 * 60000),
        status: 'confirmed',
      },
      // Completed
      {
        googleEventId: 'gcal_004',
        clientName: 'Nancy Drew',
        clientEmail: 'nancy@email.com',
        clientPhone: '+15551234004',
        serviceType: 'Root Canal',
        durationMin: 90,
        scheduledStart: new Date(now.getTime() - 24 * 3600000),
        scheduledEnd: new Date(now.getTime() - 24 * 3600000 + 90 * 60000),
        status: 'completed',
      },
    ];

    const eventIds: string[] = [];
    for (const e of eventsData) {
      const result = await db.collection('calendarEvents').insertOne({
        clinicId,
        createdAt: new Date(now.getTime() - 24 * 3600000),
        ...e,
      });
      eventIds.push(result.insertedId.toString());
    }
    console.log(`Calendar: ${eventsData.length} events (4 no-shows, 3 confirmed, 1 completed)`);

    // ========== 5. RECOVERY CASES (5 cases at different stages) ==========
    const casesData = [
      // Case 1: COMPLETED - BOOKED (Alex Thompson)
      {
        calendarEventId: eventIds[0],
        originalClientId: 'client_001',
        originalClientName: 'Alex Thompson',
        originalClientPhone: '+15551234001',
        originalAppointmentStart: eventsData[0].scheduledStart,
        originalServiceType: 'Teeth Cleaning',
        originalServiceDurationMin: 30,
        availableSlots: [{ start_time: eventsData[0].scheduledStart, end_time: eventsData[0].scheduledEnd, service_duration: 30 }],
        cascadeStatus: 'COMPLETED',
        maxCascadeDepth: 3,
        currentCallDepth: 2,
        finalOutcome: 'BOOKED',
        bookedSlot: { start_time: eventsData[0].scheduledStart, end_time: eventsData[0].scheduledEnd },
        revenueRecovered: 150,
        confirmationStatus: 'CONFIRMED',
        confirmationTime: new Date(now.getTime() - 1 * 3600000),
        completedAt: new Date(now.getTime() - 1.5 * 3600000),
        createdAt: new Date(now.getTime() - 3 * 3600000),
      },
      // Case 2: COMPLETED - BOOKED (Rachel Green via waitlist)
      {
        calendarEventId: eventIds[1],
        originalClientId: 'client_002',
        originalClientName: 'Rachel Green',
        originalClientPhone: '+15551234002',
        originalAppointmentStart: eventsData[1].scheduledStart,
        originalServiceType: 'Dental Checkup',
        originalServiceDurationMin: 45,
        availableSlots: [{ start_time: eventsData[1].scheduledStart, end_time: eventsData[1].scheduledEnd, service_duration: 45 }],
        cascadeStatus: 'COMPLETED',
        maxCascadeDepth: 3,
        currentCallDepth: 2,
        finalOutcome: 'BOOKED',
        bookedSlot: { start_time: eventsData[1].scheduledStart, end_time: eventsData[1].scheduledEnd },
        revenueRecovered: 200,
        confirmationStatus: 'PENDING',
        completedAt: new Date(now.getTime() - 2 * 3600000),
        createdAt: new Date(now.getTime() - 5 * 3600000),
      },
      // Case 3: COMPLETED - NOT_BOOKED (Marcus Johnson - all declined)
      {
        calendarEventId: eventIds[2],
        originalClientId: 'client_005',
        originalClientName: 'Marcus Johnson',
        originalClientPhone: '+15551234005',
        originalAppointmentStart: eventsData[2].scheduledStart,
        originalServiceType: 'Teeth Whitening',
        originalServiceDurationMin: 60,
        availableSlots: [{ start_time: eventsData[2].scheduledStart, end_time: eventsData[2].scheduledEnd, service_duration: 60 }],
        cascadeStatus: 'COMPLETED',
        maxCascadeDepth: 3,
        currentCallDepth: 3,
        finalOutcome: 'NOT_BOOKED',
        bookedSlot: null,
        revenueRecovered: null,
        completedAt: new Date(now.getTime() - 6 * 3600000),
        createdAt: new Date(now.getTime() - 8 * 3600000),
      },
      // Case 4: IN PROGRESS - PENDING_CALL_2 (Priya Sharma)
      {
        calendarEventId: eventIds[3],
        originalClientId: 'client_006',
        originalClientName: 'Priya Sharma',
        originalClientPhone: '+15551234006',
        originalAppointmentStart: eventsData[3].scheduledStart,
        originalServiceType: 'Root Canal',
        originalServiceDurationMin: 90,
        availableSlots: [{ start_time: eventsData[3].scheduledStart, end_time: eventsData[3].scheduledEnd, service_duration: 90 }],
        cascadeStatus: 'PENDING_CALL_2',
        maxCascadeDepth: 3,
        currentCallDepth: 1,
        finalOutcome: 'PENDING',
        bookedSlot: null,
        revenueRecovered: null,
        completedAt: null,
        createdAt: new Date(now.getTime() - 1 * 3600000),
      },
      // Case 5: PENDING - just created
      {
        calendarEventId: eventIds[3],
        originalClientId: 'client_006b',
        originalClientName: 'Priya Sharma',
        originalClientPhone: '+15551234006',
        originalAppointmentStart: eventsData[3].scheduledStart,
        originalServiceType: 'Root Canal',
        originalServiceDurationMin: 90,
        availableSlots: [],
        cascadeStatus: 'PENDING_CALL_1',
        maxCascadeDepth: 3,
        currentCallDepth: 0,
        finalOutcome: 'PENDING',
        bookedSlot: null,
        revenueRecovered: null,
        completedAt: null,
        createdAt: new Date(),
      },
    ];

    const caseIds: string[] = [];
    for (const c of casesData) {
      const result = await db.collection('recoveryCases').insertOne({
        clinicId,
        updatedAt: new Date(),
        ...c,
      });
      caseIds.push(result.insertedId.toString());
    }
    console.log(`Cases: ${casesData.length} (2 BOOKED, 1 NOT_BOOKED, 1 in-progress, 1 pending)`);

    // ========== 6. CALL ATTEMPTS (9 calls across cases) ==========
    const callsData = [
      // Case 1 (Alex) - Call 1: DECLINED, Call 2: BOOKED
      {
        recoveryCaseId: caseIds[0], callSequence: 1,
        calleCallId: 'calle_abc123', targetPersonId: 'client_001',
        targetPersonName: 'Alex Thompson', targetPersonPhone: '+15551234001',
        outcome: 'DECLINED',
        transcript: 'Hi Alex, this is Serenity Dental. We noticed you missed your Teeth Cleaning appointment today. Is everything okay?\n\nAlex: Yeah sorry, I got held up at work. I completely forgot.\n\nNo worries at all! These things happen. Would you like to reschedule for later today or tomorrow?\n\nAlex: Actually, I think I\'ll just reschedule online later. Thanks though.',
        sentimentScore: 0.45,
        callDurationSec: 145,
        notes: 'Client declined but was polite',
        initiatedAt: new Date(now.getTime() - 2.8 * 3600000),
        completedAt: new Date(now.getTime() - 2.8 * 3600000 + 145000),
      },
      {
        recoveryCaseId: caseIds[0], callSequence: 2,
        calleCallId: 'calle_def456', targetPersonId: waitlistIds[0],
        targetPersonName: 'James Wilson', targetPersonPhone: '+15559876543',
        outcome: 'BOOKED',
        transcript: 'Hi James, this is Serenity Dental! A Teeth Cleaning slot just opened up today at 2:00 PM. Because you\'re high priority on our waitlist, I wanted to offer it to you first. Would you like to claim it?\n\nJames: Oh really? Yes please! I\'ve been waiting for this.\n\nWonderful! I\'ve confirmed your booking for 2:00 PM today. You\'ll receive a confirmation text shortly.\n\nJames: Thank you so much!',
        sentimentScore: 0.92,
        callDurationSec: 98,
        notes: 'Waitlist client eagerly claimed the slot',
        initiatedAt: new Date(now.getTime() - 2.5 * 3600000),
        completedAt: new Date(now.getTime() - 2.5 * 3600000 + 98000),
      },
      // Case 2 (Rachel) - Call 1: DECLINED
      {
        recoveryCaseId: caseIds[1], callSequence: 1,
        calleCallId: 'calle_ghi789', targetPersonId: 'client_002',
        targetPersonName: 'Rachel Green', targetPersonPhone: '+15551234002',
        outcome: 'DECLINED',
        transcript: 'Hi Rachel, this is Serenity Dental. We missed you at your Dental Checkup today. Would you like to reschedule?\n\nRachel: Oh no, I totally forgot! I\'m actually in meetings all afternoon. Can I reschedule for next week?\n\nOf course! I\'ll have someone from our team reach out to find a time that works for you.\n\nRachel: Thanks, I appreciate it.',
        sentimentScore: 0.55,
        callDurationSec: 112,
        notes: 'Client busy, wants next week',
        initiatedAt: new Date(now.getTime() - 4.5 * 3600000),
        completedAt: new Date(now.getTime() - 4.5 * 3600000 + 112000),
      },
      // Case 3 (Marcus) - All 3 calls failed/declined
      {
        recoveryCaseId: caseIds[2], callSequence: 1,
        calleCallId: 'calle_mno345', targetPersonId: 'client_005',
        targetPersonName: 'Marcus Johnson', targetPersonPhone: '+15551234005',
        outcome: 'NO_ANSWER',
        transcript: null,
        sentimentScore: null,
        callDurationSec: 30,
        notes: 'No answer after 30 seconds',
        initiatedAt: new Date(now.getTime() - 7.5 * 3600000),
        completedAt: new Date(now.getTime() - 7.5 * 3600000 + 30000),
      },
      {
        recoveryCaseId: caseIds[2], callSequence: 2,
        calleCallId: 'calle_pqr678', targetPersonId: waitlistIds[4],
        targetPersonName: 'David Kim', targetPersonPhone: '+15555432109',
        outcome: 'DECLINED',
        transcript: 'Hi David, a Teeth Whitening slot opened up. Would you like to claim it?\n\nDavid: I appreciate the call, but I just had my whitening done last month. Maybe next time.',
        sentimentScore: 0.6,
        callDurationSec: 45,
        notes: 'Client already had service done',
        initiatedAt: new Date(now.getTime() - 7 * 3600000),
        completedAt: new Date(now.getTime() - 7 * 3600000 + 45000),
      },
      {
        recoveryCaseId: caseIds[2], callSequence: 3,
        calleCallId: 'calle_stu901', targetPersonId: waitlistIds[2],
        targetPersonName: 'Michael Brown', targetPersonPhone: '+15557654321',
        outcome: 'DECLINED',
        transcript: 'Hi Michael, a Teeth Whitening slot opened up. Would you like it?\n\nMichael: Oh, I\'m actually looking for a Dental Checkup, not whitening. Thanks though!',
        sentimentScore: 0.5,
        callDurationSec: 38,
        notes: 'Wrong service type',
        initiatedAt: new Date(now.getTime() - 6.5 * 3600000),
        completedAt: new Date(now.getTime() - 6.5 * 3600000 + 38000),
      },
      // Case 4 (Priya) - Call 1: NO_ANSWER (in progress)
      {
        recoveryCaseId: caseIds[3], callSequence: 1,
        calleCallId: 'calle_vwx234', targetPersonId: 'client_006',
        targetPersonName: 'Priya Sharma', targetPersonPhone: '+15551234006',
        outcome: 'NO_ANSWER',
        transcript: null,
        sentimentScore: null,
        callDurationSec: 30,
        notes: 'No answer - cascade will continue to waitlist',
        initiatedAt: new Date(now.getTime() - 0.8 * 3600000),
        completedAt: new Date(now.getTime() - 0.8 * 3600000 + 30000),
      },
      // Voice confirmations
      {
        recoveryCaseId: caseIds[0], callSequence: 0,
        calleCallId: 'calle_confirm_001', targetPersonId: 'confirmation',
        targetPersonName: 'James Wilson', targetPersonPhone: '+15559876543',
        outcome: 'BOOKED',
        transcript: 'Hi James, this is Serenity Dental. Your Teeth Cleaning is confirmed for 2:00 PM today. We look forward to seeing you!',
        sentimentScore: 0.95,
        callDurationSec: 25,
        notes: 'Voice confirmation for booked appointment',
        initiatedAt: new Date(now.getTime() - 2 * 3600000),
        completedAt: new Date(now.getTime() - 2 * 3600000 + 25000),
      },
      {
        recoveryCaseId: caseIds[1], callSequence: 0,
        calleCallId: 'calle_confirm_002', targetPersonId: 'confirmation',
        targetPersonName: 'Emily Chen', targetPersonPhone: '+15558765432',
        outcome: 'PENDING',
        transcript: null,
        sentimentScore: null,
        callDurationSec: null,
        notes: 'Voice confirmation pending for Dental Checkup',
        initiatedAt: new Date(now.getTime() - 1.5 * 3600000),
        completedAt: null,
      },
    ];

    for (const c of callsData) {
      await db.collection('callAttempts').insertOne({
        createdAt: c.initiatedAt,
        ...c,
      });
    }
    console.log(`Calls: ${callsData.length} attempts (8 completed, 1 pending)`);

    // ========== 7. SMS ATTEMPTS (4 SMS messages) ==========
    const smsData = [
      // Case 2 - SMS to waitlist Emily
      {
        recoveryCaseId: caseIds[1], callSequence: 2,
        calleCallId: 'sms_emily_001',
        targetPersonName: 'Emily Chen', targetPersonPhone: '+15558765432',
        outcome: 'REPLIED_YES',
        messageBody: 'Hi Emily! A Dental Checkup slot just opened up at 3:00 PM today at Serenity Dental. Would you like to claim it? Reply YES to book or NO to decline.',
        initiatedAt: new Date(now.getTime() - 2.2 * 3600000),
        completedAt: new Date(now.getTime() - 2 * 3600000),
      },
      // Case 4 - SMS to original client Priya
      {
        recoveryCaseId: caseIds[3], callSequence: 1,
        calleCallId: 'sms_priya_001',
        targetPersonName: 'Priya Sharma', targetPersonPhone: '+15551234006',
        outcome: 'DELIVERED',
        messageBody: 'Hi Priya, we missed you at your Root Canal appointment at Serenity Dental. Would you like to reschedule for later today? Reply YES to confirm or NO if you prefer not to.',
        initiatedAt: new Date(now.getTime() - 0.9 * 3600000),
        completedAt: null,
      },
      // Case 4 - SMS to waitlist David
      {
        recoveryCaseId: caseIds[3], callSequence: 2,
        calleCallId: 'sms_david_001',
        targetPersonName: 'David Kim', targetPersonPhone: '+15555432109',
        outcome: 'DELIVERED',
        messageBody: 'Hi David! A Root Canal slot just opened up at 4:00 PM today at Serenity Dental. Because you have high priority, you have 5 minutes to claim it. Reply YES to book or NO to decline.',
        initiatedAt: new Date(now.getTime() - 0.5 * 3600000),
        completedAt: null,
      },
      // Case 1 - SMS to James (already BOOKED via call)
      {
        recoveryCaseId: caseIds[0], callSequence: 2,
        calleCallId: 'sms_james_001',
        targetPersonName: 'James Wilson', targetPersonPhone: '+15559876543',
        outcome: 'REPLIED_YES',
        messageBody: 'Hi James! A Teeth Cleaning slot just opened up at 2:00 PM today at Serenity Dental. Would you like to claim it? Reply YES to book or NO to decline.',
        initiatedAt: new Date(now.getTime() - 2.6 * 3600000),
        completedAt: new Date(now.getTime() - 2.5 * 3600000),
      },
    ];

    for (const s of smsData) {
      await db.collection('smsAttempts').insertOne({
        createdAt: s.initiatedAt,
        ...s,
      });
    }
    console.log(`SMS: ${smsData.length} messages (2 replied YES, 2 delivered)`);

    // ========== 8. CONFIRMATION TOKENS (4 tokens) ==========
    const confirmData = [
      // Alex - CONFIRMED
      {
        caseId: caseIds[0],
        clientName: 'Alex Thompson',
        clientPhone: '+15551234001',
        serviceType: 'Teeth Cleaning',
        slotTime: eventsData[0].scheduledStart,
        clinicName: 'Serenity Dental Clinic',
        token: 'demo_token_alex_confirmed',
        status: 'CONFIRMED',
        respondedAt: new Date(now.getTime() - 1 * 3600000),
      },
      // Emily - PENDING
      {
        caseId: caseIds[1],
        clientName: 'Emily Chen',
        clientPhone: '+15558765432',
        serviceType: 'Dental Checkup',
        slotTime: eventsData[1].scheduledStart,
        clinicName: 'Serenity Dental Clinic',
        token: 'demo_token_emily_pending',
        status: 'PENDING',
      },
      // David - DECLINED
      {
        caseId: caseIds[2],
        clientName: 'David Kim',
        clientPhone: '+15555432109',
        serviceType: 'Teeth Whitening',
        slotTime: eventsData[2].scheduledStart,
        clinicName: 'Serenity Dental Clinic',
        token: 'demo_token_david_declined',
        status: 'DECLINED',
        respondedAt: new Date(now.getTime() - 5 * 3600000),
      },
      // Priya - PENDING
      {
        caseId: caseIds[3],
        clientName: 'Priya Sharma',
        clientPhone: '+15551234006',
        serviceType: 'Root Canal',
        slotTime: eventsData[3].scheduledStart,
        clinicName: 'Serenity Dental Clinic',
        token: 'demo_token_priya_pending',
        status: 'PENDING',
      },
    ];

    for (const t of confirmData) {
      await db.collection('confirmationTokens').insertOne({
        createdAt: new Date(now.getTime() - 3 * 3600000),
        expiresAt: new Date(now.getTime() + 21 * 3600000),
        ...t,
      });
    }
    console.log(`Confirmations: ${confirmData.length} tokens (1 confirmed, 2 pending, 1 declined)`);

    // ========== SUMMARY ==========
    console.log('\n' + '='.repeat(60));
    console.log('DEMO DATA SEED COMPLETE');
    console.log('='.repeat(60));
    console.log('');
    console.log('Login: sarah@serenitydental.com / test123');
    console.log('');
    console.log('Data seeded:');
    console.log('  1 clinic (Serenity Dental Clinic)');
    console.log('  1 staff member (Dr. Sarah Mitchell)');
    console.log('  8 waitlist people with preferences');
    console.log('  8 calendar events (4 no-shows, 3 confirmed, 1 completed)');
    console.log('  5 recovery cases (2 BOOKED, 1 NOT_BOOKED, 1 in-progress, 1 pending)');
    console.log('  9 call attempts (8 completed, 1 pending)');
    console.log('  4 SMS messages (2 replied YES, 2 delivered)');
    console.log('  4 confirmation tokens (1 confirmed, 2 pending, 1 declined)');
    console.log('');
    console.log('Demo URLs:');
    console.log('  Dashboard:    http://localhost:3000/dashboard');
    console.log('  No-Shows:     http://localhost:3000/dashboard/no-shows');
    console.log('  Calendar:     http://localhost:3000/dashboard/calendar');
    console.log('  History:      http://localhost:3000/dashboard/history');
    console.log('  Call Logs:    http://localhost:3000/dashboard/calls');
    console.log('  SMS Logs:     http://localhost:3000/dashboard/sms-logs');
    console.log('  Waitlist:     http://localhost:3000/dashboard/waitlist');
    console.log('  Settings:     http://localhost:3000/dashboard/settings');
    console.log('');
    console.log('Confirmation pages (public):');
    console.log('  Confirmed:  http://localhost:3000/confirm/demo_token_alex_confirmed');
    console.log('  Pending:    http://localhost:3000/confirm/demo_token_emily_pending');
    console.log('  Declined:   http://localhost:3000/confirm/demo_token_david_declined');

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
