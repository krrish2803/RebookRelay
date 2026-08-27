-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthToken" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryCase" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "calendarEventId" TEXT NOT NULL,
    "originalClientId" TEXT NOT NULL,
    "originalClientName" TEXT NOT NULL,
    "originalClientPhone" TEXT NOT NULL,
    "originalAppointmentStart" TIMESTAMP(3) NOT NULL,
    "originalServiceType" TEXT NOT NULL,
    "originalServiceDurationMin" INTEGER NOT NULL,
    "availableSlots" JSONB NOT NULL,
    "cascadeStatus" TEXT NOT NULL,
    "maxCascadeDepth" INTEGER NOT NULL DEFAULT 3,
    "currentCallDepth" INTEGER NOT NULL DEFAULT 0,
    "finalOutcome" TEXT,
    "bookedSlot" JSONB,
    "revenueRecovered" DECIMAL(8,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallAttempt" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "callSequence" INTEGER NOT NULL,
    "calleCallId" TEXT NOT NULL,
    "targetPersonId" TEXT NOT NULL,
    "targetPersonName" TEXT NOT NULL,
    "targetPersonPhone" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "sentimentScore" DOUBLE PRECISION,
    "transcript" TEXT,
    "notes" TEXT,
    "recordingUrl" TEXT,
    "callDurationSec" INTEGER,
    "initiatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistPerson" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "preferredTimes" JSONB NOT NULL,
    "daysOnWaitlist" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "priorityScore" DOUBLE PRECISION,
    "lastBookedAt" TIMESTAMP(3),
    "noShowCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "performedBy" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE INDEX "Staff_clinicId_idx" ON "Staff"("clinicId");

-- CreateIndex
CREATE INDEX "Staff_email_idx" ON "Staff"("email");

-- CreateIndex
CREATE INDEX "OAuthToken_clinicId_idx" ON "OAuthToken"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthToken_clinicId_provider_key" ON "OAuthToken"("clinicId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_googleEventId_key" ON "CalendarEvent"("googleEventId");

-- CreateIndex
CREATE INDEX "CalendarEvent_clinicId_idx" ON "CalendarEvent"("clinicId");

-- CreateIndex
CREATE INDEX "CalendarEvent_googleEventId_idx" ON "CalendarEvent"("googleEventId");

-- CreateIndex
CREATE INDEX "CalendarEvent_status_idx" ON "CalendarEvent"("status");

-- CreateIndex
CREATE INDEX "CalendarEvent_scheduledStart_idx" ON "CalendarEvent"("scheduledStart");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryCase_calendarEventId_key" ON "RecoveryCase"("calendarEventId");

-- CreateIndex
CREATE INDEX "RecoveryCase_clinicId_idx" ON "RecoveryCase"("clinicId");

-- CreateIndex
CREATE INDEX "RecoveryCase_cascadeStatus_idx" ON "RecoveryCase"("cascadeStatus");

-- CreateIndex
CREATE INDEX "RecoveryCase_createdAt_idx" ON "RecoveryCase"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CallAttempt_calleCallId_key" ON "CallAttempt"("calleCallId");

-- CreateIndex
CREATE INDEX "CallAttempt_recoveryCaseId_idx" ON "CallAttempt"("recoveryCaseId");

-- CreateIndex
CREATE INDEX "CallAttempt_calleCallId_idx" ON "CallAttempt"("calleCallId");

-- CreateIndex
CREATE INDEX "CallAttempt_outcome_idx" ON "CallAttempt"("outcome");

-- CreateIndex
CREATE INDEX "CallAttempt_completedAt_idx" ON "CallAttempt"("completedAt");

-- CreateIndex
CREATE INDEX "WaitlistPerson_clinicId_idx" ON "WaitlistPerson"("clinicId");

-- CreateIndex
CREATE INDEX "WaitlistPerson_serviceType_idx" ON "WaitlistPerson"("serviceType");

-- CreateIndex
CREATE INDEX "WaitlistPerson_status_idx" ON "WaitlistPerson"("status");

-- CreateIndex
CREATE INDEX "WaitlistPerson_priorityScore_idx" ON "WaitlistPerson"("priorityScore");

-- CreateIndex
CREATE INDEX "AuditLog_clinicId_idx" ON "AuditLog"("clinicId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthToken" ADD CONSTRAINT "OAuthToken_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCase" ADD CONSTRAINT "RecoveryCase_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCase" ADD CONSTRAINT "RecoveryCase_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallAttempt" ADD CONSTRAINT "CallAttempt_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistPerson" ADD CONSTRAINT "WaitlistPerson_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
