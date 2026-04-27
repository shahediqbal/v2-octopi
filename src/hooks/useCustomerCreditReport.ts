import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type {
  CreditHistoryResponse,
  CreditSummaryItem,
  CustomerCreditFilters,
} from '@/types/customerCreditReport'

export const customerCreditKeys = {
  all: ['customerCredit'] as const,
  history: (filters: CustomerCreditFilters) =>
    [...customerCreditKeys.all, 'history', filters] as const,
  summary: (filters: CustomerCreditFilters) =>
    [...customerCreditKeys.all, 'summary', filters] as const,
}

export function useCustomerCreditHistory(filters: CustomerCreditFilters, enabled: boolean) {
  return useQuery({
    queryKey: customerCreditKeys.history(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<CreditHistoryResponse>>(
          `/Report/GetCustomerCreditHistory?startDate=${filters.startDate}&endDate=${filters.endDate}&customerId=${filters.customerId}`,
        )
        .then((r) => r.dataObj ?? { customerInfo: null, transctionInfo: [] }),
    enabled,
    staleTime: 2 * 60_000,
  })
}

export function useCustomerCreditSummary(filters: CustomerCreditFilters, enabled: boolean) {
  return useQuery({
    queryKey: customerCreditKeys.summary(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<CreditSummaryItem[]>>(
          `/Report/GetCustomerCreditSaleSummery?customerId=${filters.customerId}&startDate=${filters.startDate}&endDate=${filters.endDate}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
