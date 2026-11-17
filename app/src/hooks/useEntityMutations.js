import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/queryKeys";
import { CaseService, CaseUpdateService } from "@/services/CaseService";
import { MessageService } from "@/services/MessageService";
import { NotificationService } from "@/services/NotificationService";
import { PanicAlertService } from "@/services/PanicAlertService";
import { ResponseUnitService } from "@/services/ResponseUnitService";
import { ResourceService } from "@/services/ResourceService";
import { EmergencyContactService } from "@/services/EmergencyContactService";
import { EvidenceService } from "@/services/EvidenceService";
import { UserService } from "@/services/UserService";
import { AuditLogService } from "@/services/AuditLogService";
import { IncidentLogService } from "@/services/IncidentLogService";
import { StaffMessageService } from "@/services/StaffMessageService";

const invalidate = (queryClient, keys) => keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));

export function useCreateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CaseService.create,
    onSuccess: () => invalidate(queryClient, [["cases"], ["notifications"]]),
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => CaseService.update(id, data),
    onSuccess: (_, { id }) => invalidate(queryClient, [["cases"], queryKeys.case(id), ["caseUpdates"], ["panicAlerts"]]),
  });
}

export function useCreateCaseUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CaseUpdateService.create,
    onSuccess: (_, data) => invalidate(queryClient, [["caseUpdates"], queryKeys.caseUpdates(data.case_id), ["cases"]]),
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: MessageService.create,
    onSuccess: (_, data) => invalidate(queryClient, [["messages"], queryKeys.messages(data.case_id), ["cases"], ["notifications"]]),
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: NotificationService.create,
    onSuccess: () => invalidate(queryClient, [["notifications"]]),
  });
}

export function useUpdatePanicAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => PanicAlertService.update(id, data),
    onSuccess: () => invalidate(queryClient, [["panicAlerts"], ["cases"]]),
  });
}

export function useUpdateResponseUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => ResponseUnitService.update(id, data),
    onSuccess: () => invalidate(queryClient, [["responseUnits"], ["cases"]]),
  });
}

export function useCreateResponseUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ResponseUnitService.create,
    onSuccess: () => invalidate(queryClient, [["responseUnits"]]),
  });
}

export function useCreateEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: EvidenceService.create,
    onSuccess: (_, data) => invalidate(queryClient, [["evidence"], queryKeys.evidence({ case_id: data.case_id }), ["cases"], ["notifications"]]),
  });
}

export function useDeleteEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: EvidenceService.delete,
    onSuccess: () => invalidate(queryClient, [["evidence"]]),
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ResourceService.create,
    onSuccess: () => invalidate(queryClient, [["resources"]]),
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => ResourceService.update(id, data),
    onSuccess: () => invalidate(queryClient, [["resources"]]),
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ResourceService.delete,
    onSuccess: () => invalidate(queryClient, [["resources"]]),
  });
}

export function useCreateEmergencyContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: EmergencyContactService.create,
    onSuccess: () => invalidate(queryClient, [["emergencyContacts"]]),
  });
}

export function useUpdateEmergencyContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => EmergencyContactService.update(id, data),
    onSuccess: () => invalidate(queryClient, [["emergencyContacts"]]),
  });
}

export function useDeleteEmergencyContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: EmergencyContactService.delete,
    onSuccess: () => invalidate(queryClient, [["emergencyContacts"]]),
  });
}

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UserService.updateMe,
    onSuccess: () => invalidate(queryClient, [queryKeys.currentUser, ["users"]]),
  });
}

export function useCreateAuditLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuditLogService.create,
    onSuccess: () => invalidate(queryClient, [["auditLogs"]]),
  });
}

export function useCreateIncidentLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: IncidentLogService.create,
    onSuccess: () => invalidate(queryClient, [["incidentLogs"]]),
  });
}

export function useUpdateIncidentLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => IncidentLogService.update(id, data),
    onSuccess: () => invalidate(queryClient, [["incidentLogs"]]),
  });
}

export function useCreateStaffMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: StaffMessageService.create,
    onSuccess: () => invalidate(queryClient, [["staffMessages"]]),
  });
}