import { z } from "zod";
import { CASE_STATUSES, INCIDENT_TYPES, RISK_LEVELS, RESPONSE_UNIT_STATUSES, RESPONSE_UNIT_TYPES, EVIDENCE_TYPES, PANIC_ALERT_STATUSES } from "@/constants/appConstants";

export const CaseSchema = z.object({
  incident_type: z.enum(INCIDENT_TYPES),
  description: z.string().min(1),
  status: z.enum(CASE_STATUSES).optional(),
  risk_level: z.enum(RISK_LEVELS).optional(),
  survivor_name: z.string().optional(),
  survivor_contact: z.string().optional(),
  location_description: z.string().optional(),
});

export const MessageSchema = z.object({
  case_id: z.string().min(1),
  message: z.string().min(1),
  sender_name: z.string().optional(),
  sender_role: z.enum(["survivor", "responder", "admin", "system"]).optional(),
  channel: z.enum(["chat", "sms", "whatsapp", "system"]).optional(),
});

export const ResourceSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  province: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const EmergencyContactSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  relationship: z.string().optional(),
  priority: z.number().optional(),
  notify_location: z.boolean().optional(),
});

export const ResponseUnitSchema = z.object({
  name: z.string().min(1),
  unit_type: z.enum(RESPONSE_UNIT_TYPES),
  on_call_status: z.enum(RESPONSE_UNIT_STATUSES).optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  district: z.string().optional(),
  province: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const EvidenceUploadSchema = z.object({
  file_url: z.string().min(1),
  file_name: z.string().min(1),
  file_type: z.enum(EVIDENCE_TYPES),
  description: z.string().optional(),
  case_id: z.string().optional(),
  case_ref: z.string().optional(),
  file_size_kb: z.number().optional(),
  is_sensitive: z.boolean().optional(),
});

export const PanicAlertSchema = z.object({
  status: z.enum(PANIC_ALERT_STATUSES).optional(),
  location_lat: z.number().nullable().optional(),
  location_lng: z.number().nullable().optional(),
  responder_email: z.string().optional(),
  responder_name: z.string().optional(),
  is_silent: z.boolean().optional(),
  linked_case_id: z.string().optional(),
});

export const UserProfileSchema = z.object({
  role: z.string().optional(),
  emergency_title: z.string().optional(),
  two_factor_enabled: z.boolean().optional(),
});