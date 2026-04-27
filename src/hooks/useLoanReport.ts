import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { LoanReportDetailItem, LoanReportFilters, LoanReportSummaryItem } from '@/types/loanReport'

export const loanReportKeys = {
  all: ['loanReport'] as const,
  details: (filters: LoanReportFilters) => [...loanReportKeys.all, 'details', filters] as const,
  summary: (filters: LoanReportFilters) => [...loanReportKeys.all, 'summary', filters] as const,
}

export function useLoanReportDetails(filters: LoanReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: loanReportKeys.details(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<LoanReportDetailItem[]>>(
          `/Report/GetReportLoanDetails/${filters.customerId}/${filters.productId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}

export function useLoanReportSummary(filters: LoanReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: loanReportKeys.summary(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<LoanReportSummaryItem[]>>(
          `/Report/GetReportLoanSummery/${filters.customerId}/${filters.productId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
