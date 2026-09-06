import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const DRY_RUN = process.env.CALL_E_DRY_RUN === 'true';

export interface SmsParams {
  to: string;
  from?: string;
  body: string;
  caseId?: string;
  clinicId?: string;
}

export async function sendSms(params: SmsParams) {
  if (!accountSid || !authToken || !fromNumber) {
    console.log('[SMS] Twilio not configured — skipping SMS');
    return { success: false, error: 'Twilio not configured' };
  }

  if (DRY_RUN) {
    const smsId = `dryrun_sms_${Date.now()}`;
    console.log(`[DRY_RUN] Would send SMS to ${params.to}: ${params.body.substring(0, 80)}...`);
    return { success: true, smsId };
  }

  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      body: params.body,
      from: params.from || fromNumber,
      to: params.to,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/sms/webhook`,
    });

    console.log(`[SMS] Sent to ${params.to}: ${message.sid}`);
    return { success: true, smsId: message.sid };
  } catch (error: any) {
    console.error('[SMS] Failed to send:', error.message);
    return { success: false, error: error.message };
  }
}

export function buildRecoverySms(
  clinicName: string,
  clientName: string,
  serviceType: string,
  slotTime: string,
  isWaitlist: boolean
): string {
  if (isWaitlist) {
    return `Hi ${clientName}! A ${serviceType} slot just opened up at ${slotTime} at ${clinicName}. Would you like to claim it? Reply YES to book or NO to decline.`;
  }

  return `Hi ${clientName}, we missed you at your ${serviceType} appointment at ${clinicName}. Would you like to reschedule for ${slotTime}? Reply YES to confirm or NO if you'd prefer not to.`;
}

export async function logSmsAttempt(data: {
  caseId: string;
  callSequence: number;
  targetPersonName: string;
  targetPersonPhone: string;
  smsId: string;
  outcome: string;
  messageBody: string;
}) {
  const { getDb } = await import('./mongodb');
  const db = await getDb();

  await db.collection('smsAttempts').insertOne({
    recoveryCaseId: data.caseId,
    callSequence: data.callSequence,
    targetPersonName: data.targetPersonName,
    targetPersonPhone: data.targetPersonPhone,
    calleCallId: data.smsId,
    outcome: data.outcome,
    messageBody: data.messageBody,
    initiatedAt: new Date(),
    completedAt: null,
  });
}
