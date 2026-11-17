-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'responder', 'survivor', 'user');

-- CreateEnum
CREATE TYPE "Specialization" AS ENUM ('general', 'counseling', 'legal', 'medical', 'shelter');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('physical_violence', 'sexual_violence', 'emotional_abuse', 'economic_abuse', 'stalking', 'trafficking', 'forced_marriage', 'other');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('received', 'dispatched', 'acknowledged', 'in_progress', 'resolved', 'escalated', 'failed', 'reported', 'assigned', 'closed');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "ReportSource" AS ENUM ('report', 'panic_alert');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('app', 'web', 'whatsapp', 'ussd', 'sms');

-- CreateEnum
CREATE TYPE "CaseUpdateType" AS ENUM ('status_change', 'note', 'assignment', 'risk_change', 'resolution');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('photo', 'audio', 'document', 'zp_form_32', 'other');

-- CreateEnum
CREATE TYPE "IncidentLogStatus" AS ENUM ('draft', 'finalized', 'exported');

-- CreateEnum
CREATE TYPE "Province" AS ENUM ('Lusaka', 'Copperbelt', 'Central', 'Eastern', 'Northern', 'Luapula', 'Western', 'Southern', 'North_Western', 'Muchinga');

-- CreateEnum
CREATE TYPE "MessageSenderRole" AS ENUM ('survivor', 'responder', 'admin', 'system');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('chat', 'sms', 'whatsapp', 'system');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('panic_alert', 'case_update', 'assignment', 'message', 'system');

-- CreateEnum
CREATE TYPE "PanicStatus" AS ENUM ('triggered', 'acknowledged', 'responded', 'resolved', 'escalated');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('vsu', 'osc', 'shelter', 'legal_aid', 'medical', 'counseling', 'hotline', 'police', 'child_protection', 'gbv_support', 'emergency_response', 'other');

-- CreateEnum
CREATE TYPE "ResponseUnitType" AS ENUM ('police', 'hospital', 'ngo', 'social_services', 'shelter', 'legal_aid', 'vsu', 'osc', 'other');

-- CreateEnum
CREATE TYPE "OnCallStatus" AS ENUM ('available', 'busy', 'off_duty');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('admin', 'responder');

-- CreateEnum
CREATE TYPE "WhatsAppStep" AS ENUM ('greeting', 'incident_type', 'description', 'location', 'anonymous_choice', 'name', 'submitted');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "role" "Role" NOT NULL DEFAULT 'survivor',
    "first_name" TEXT,
    "last_name" TEXT,
    "full_name" TEXT,
    "phone" TEXT,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "emergency_title" TEXT NOT NULL DEFAULT 'I need help',
    "profile_picture" TEXT,
    "specialization" "Specialization" NOT NULL DEFAULT 'general',
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "location_updated_at" TIMESTAMP(3),
    "notify_in_app" BOOLEAN NOT NULL DEFAULT true,
    "notify_sms" BOOLEAN NOT NULL DEFAULT true,
    "notify_push" BOOLEAN NOT NULL DEFAULT true,
    "privacy_share_location" BOOLEAN NOT NULL DEFAULT true,
    "privacy_share_case" BOOLEAN NOT NULL DEFAULT true,
    "privacy_allow_followup" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "label" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "AccessCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_email" TEXT,
    "actor_role" TEXT,
    "action_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "related_case_id" TEXT,
    "previous_value" JSONB,
    "new_value" JSONB,
    "timestamp" TEXT NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "case_id" TEXT,
    "incident_type" "IncidentType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'received',
    "risk_level" "RiskLevel" NOT NULL DEFAULT 'medium',
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "reporter_email" TEXT,
    "reporter_user_id" TEXT,
    "survivor_name" TEXT,
    "survivor_contact" TEXT,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "location_captured_at" TEXT,
    "location_description" TEXT,
    "assigned_responder" TEXT,
    "assigned_responder_name" TEXT,
    "assigned_unit_id" TEXT,
    "assigned_unit_name" TEXT,
    "attachments" TEXT[],
    "ai_summary" TEXT,
    "resolution_notes" TEXT,
    "resolved_at" TEXT,
    "acknowledged_at" TEXT,
    "acknowledged_by" TEXT,
    "dispatched_at" TEXT,
    "escalation_count" INTEGER NOT NULL DEFAULT 0,
    "report_source" "ReportSource" NOT NULL DEFAULT 'report',
    "channel" "Channel" NOT NULL DEFAULT 'app',
    "client_idempotency_key" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseUpdate" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "update_type" "CaseUpdateType" NOT NULL,
    "note" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "updated_by_name" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "CaseUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relationship" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "notify_location" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceVault" (
    "id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" "EvidenceType" NOT NULL,
    "description" TEXT,
    "case_id" TEXT,
    "case_ref" TEXT,
    "file_size_kb" DOUBLE PRECISION,
    "is_sensitive" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "EvidenceVault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentLog" (
    "id" TEXT NOT NULL,
    "who_perpetrator" TEXT,
    "who_witnesses" TEXT,
    "what_happened" TEXT NOT NULL,
    "what_injuries" TEXT,
    "when_date" TEXT NOT NULL,
    "when_time" TEXT,
    "where_location" TEXT NOT NULL,
    "where_province" "Province",
    "prior_incidents" TEXT,
    "police_report_number" TEXT,
    "status" "IncidentLogStatus" NOT NULL DEFAULT 'draft',
    "linked_case_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "IncidentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "sender_name" TEXT,
    "sender_role" "MessageSenderRole",
    "message" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL DEFAULT 'chat',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "related_case_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PanicAlert" (
    "id" TEXT NOT NULL,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "status" "PanicStatus" NOT NULL DEFAULT 'triggered',
    "responder_email" TEXT,
    "responder_name" TEXT,
    "is_silent" BOOLEAN NOT NULL DEFAULT false,
    "linked_case_id" TEXT,
    "client_idempotency_key" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "PanicAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "map_url" TEXT,
    "document_url" TEXT,
    "address" TEXT,
    "district" TEXT,
    "province" "Province",
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "operating_hours" TEXT,
    "languages" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponseUnit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit_type" "ResponseUnitType" NOT NULL,
    "description" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "whatsapp" TEXT,
    "address" TEXT,
    "district" TEXT,
    "province" "Province",
    "coverage_area" TEXT,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "on_call_status" "OnCallStatus" NOT NULL DEFAULT 'available',
    "operating_hours" TEXT,
    "lead_contact_name" TEXT,
    "lead_contact_email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "ResponseUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMessage" (
    "id" TEXT NOT NULL,
    "sender_name" TEXT,
    "sender_role" "StaffRole",
    "message" TEXT NOT NULL,
    "related_case_id" TEXT,
    "related_case_ref" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "StaffMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorCode" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "TwoFactorCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppSession" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phone_masked" TEXT,
    "step" "WhatsAppStep" NOT NULL DEFAULT 'greeting',
    "draft" JSONB,
    "linked_case_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "AccessCode_code_key" ON "AccessCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Case_case_id_key" ON "Case"("case_id");

-- CreateIndex
CREATE UNIQUE INDEX "Case_client_idempotency_key_key" ON "Case"("client_idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "PanicAlert_client_idempotency_key_key" ON "PanicAlert"("client_idempotency_key");
