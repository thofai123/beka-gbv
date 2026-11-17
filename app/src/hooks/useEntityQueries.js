import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const defaults = { staleTime: 30_000, refetchOnWindowFocus: false };

export function useCurrentUser(options = {}) {
  return useQuery({ queryKey: queryKeys.currentUser, queryFn: UserService.me, ...defaults, ...options });
}

export function useUsers(query = {}, options = {}) {
  const { sort, limit, skip, enabled = true } = options;
  return useQuery({
    queryKey: queryKeys.users({ query, sort, limit, skip }),
    queryFn: () => Object.keys(query).length ? UserService.filter(query, sort, limit, skip) : UserService.list(sort, limit, skip),
    enabled,
    ...defaults,
  });
}

export function useCases(query = {}, options = {}) {
  const { sort = "-created_date", limit, skip, enabled = true } = options;
  return useQuery({
    queryKey: queryKeys.cases(query, { sort, limit, skip }),
    queryFn: () => Object.keys(query).length ? CaseService.filter(query, sort, limit, skip) : CaseService.list(sort, limit, skip),
    enabled,
    ...defaults,
  });
}

export function useCase(id, options = {}) {
  return useQuery({ queryKey: queryKeys.case(id), queryFn: () => CaseService.getById(id), enabled: !!id, ...defaults, ...options });
}

export function useCaseUpdates(caseId, options = {}) {
  const { sort = "-created_date", limit = 50, enabled = true } = options;
  const query = caseId ? { case_id: caseId } : {};
  return useQuery({
    queryKey: queryKeys.caseUpdates(caseId || "all", { sort, limit }),
    queryFn: () => Object.keys(query).length ? CaseUpdateService.filter(query, sort, limit) : CaseUpdateService.list(sort, limit),
    enabled,
    ...defaults,
  });
}

export function useMessages(caseId, options = {}) {
  const { sort = "-created_date", limit = 500, enabled = true } = options;
  const query = caseId ? { case_id: caseId } : {};
  return useQuery({
    queryKey: queryKeys.messages(caseId || "all", { sort, limit }),
    queryFn: () => Object.keys(query).length ? MessageService.filter(query, sort, limit) : MessageService.list(sort, limit),
    enabled,
    ...defaults,
  });
}

export function useNotifications(query = {}, options = {}) {
  const { sort = "-created_date", limit, skip, enabled = true } = options;
  return useQuery({
    queryKey: queryKeys.notifications({ query, sort, limit, skip }),
    queryFn: () => Object.keys(query).length ? NotificationService.filter(query, sort, limit, skip) : NotificationService.list(sort, limit, skip),
    enabled,
    ...defaults,
  });
}

export function usePanicAlerts(query = {}, options = {}) {
  const { sort = "-created_date", limit, enabled = true } = options;
  return useQuery({
    queryKey: queryKeys.panicAlerts(query, { sort, limit }),
    queryFn: () => Object.keys(query).length ? PanicAlertService.filter(query, sort, limit) : PanicAlertService.list(sort, limit),
    enabled,
    ...defaults,
  });
}

export function useResponseUnits(query = {}, options = {}) {
  const { sort = "-created_date", limit, skip, enabled = true } = options;
  return useQuery({
    queryKey: queryKeys.responseUnits(query, { sort, limit, skip }),
    queryFn: () => Object.keys(query).length ? ResponseUnitService.filter(query, sort, limit, skip) : ResponseUnitService.list(sort, limit, skip),
    enabled,
    ...defaults,
  });
}

export function useResources(query = {}, options = {}) {
  const { sort = "name", limit, skip, enabled = true } = options;
  return useQuery({
    queryKey: queryKeys.resources(query, { sort, limit, skip }),
    queryFn: () => Object.keys(query).length ? ResourceService.filter(query, sort, limit, skip) : ResourceService.list(sort, limit, skip),
    enabled,
    ...defaults,
  });
}

export function useEmergencyContacts(query = {}, options = {}) {
  const { sort = "priority", limit, skip, enabled = true } = options;
  return useQuery({
    queryKey: queryKeys.emergencyContacts(query, { sort, limit, skip }),
    queryFn: () => Object.keys(query).length ? EmergencyContactService.filter(query, sort, limit, skip) : EmergencyContactService.list(sort, limit, skip),
    enabled,
    ...defaults,
  });
}

export function useEvidence(query = {}, options = {}) {
  const { sort = "-created_date", limit, skip, enabled = true } = options;
  return useQuery({
    queryKey: queryKeys.evidence(query, { sort, limit, skip }),
    queryFn: () => Object.keys(query).length ? EvidenceService.filter(query, sort, limit, skip) : EvidenceService.list(sort, limit, skip),
    enabled,
    ...defaults,
  });
}

export function useAuditLogs(query = {}, options = {}) {
  const { sort = "-created_date", limit = 100, skip, enabled = true } = options;
  return useQuery({
    queryKey: queryKeys.auditLogs(query, { sort, limit, skip }),
    queryFn: () => Object.keys(query).length ? AuditLogService.filter(query, sort, limit, skip) : AuditLogService.list(sort, limit, skip),
    enabled,
    ...defaults,
  });
}

export function useIncidentLogs(query = {}, options = {}) {
  const { sort = "-created_date", limit = 100, skip, enabled = true } = options;
  return useQuery({
    queryKey: queryKeys.incidentLogs(query, { sort, limit, skip }),
    queryFn: () => Object.keys(query).length ? IncidentLogService.filter(query, sort, limit, skip) : IncidentLogService.list(sort, limit, skip),
    enabled,
    ...defaults,
  });
}

export function useStaffMessages(query = {}, options = {}) {
  const { sort = "-created_date", limit = 50, skip, enabled = true } = options;
  return useQuery({
    queryKey: queryKeys.staffMessages(query, { sort, limit, skip }),
    queryFn: () => Object.keys(query).length ? StaffMessageService.filter(query, sort, limit, skip) : StaffMessageService.list(sort, limit, skip),
    enabled,
    ...defaults,
  });
}

export function useLiveEntityInvalidation(service, queryKeyPrefixes = [], onEvent) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const unsubscribe = service.subscribe((event) => {
      queryKeyPrefixes.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      onEvent?.(event);
    });
    return () => unsubscribe?.();
  }, [queryClient, service, onEvent]);
}