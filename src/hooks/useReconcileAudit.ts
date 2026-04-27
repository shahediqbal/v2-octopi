import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { AuditItem, ReconcileAuditFilters, ReconciliationItem } from '@/types/reconcileAuditReport'

export const reconcileAuditKeys = {
  all: ['reconcileAudit'] as const,
  reconciliation: (filters: ReconcileAuditFilters) => [...reconcileAuditKeys.all, 'reconciliation', filters] as const,
  audit: (filters: ReconcileAuditFilters) => [...reconcileAuditKeys.all, 'audit', filters] as const,
}

export function useReconciliation(filters: ReconcileAuditFilters, enabled: boolean) {
  return useQuery({
    queryKey: reconcileAuditKeys.reconciliation(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<ReconciliationItem[]>>(
          `/Report/GetCurrentStockReconciliation?productId=${filters.productId}&channelId=${filters.channelId}&dateFrom=${filters.dateFrom}&dateTo=${filters.dateTo}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}

export function useAudit(filters: ReconcileAuditFilters, enabled: boolean) {
  return useQuery({
    queryKey: reconcileAuditKeys.audit(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<AuditItem[]>>(
          `/Report/GetCurrentStockAudit?productId=${filters.productId}&channelId=${filters.channelId}&dateFrom=${filters.dateFrom}&dateTo=${filters.dateTo}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
