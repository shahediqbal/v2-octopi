import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type {
  MonthlyPurchaseSalesPaymentItem,
  SalesPaymentSummaryItem,
} from '@/types/salesPaymentDashboard'

const dashboardKeys = {
  all: ['salesPaymentDashboard'] as const,
  summary: (start: string, end: string, interval: string, dataType: string) =>
    [...dashboardKeys.all, 'summary', start, end, interval, dataType] as const,
  monthly: (start?: string, end?: string) => [...dashboardKeys.all, 'monthly', start, end] as const,
}

export function useSalesPaymentSummary(
  start: string,
  end: string,
  intervalType: 'daily' | 'weekly' | 'monthly',
  dataType: 'sales' | 'payment',
  enabled = true,
) {
  return useQuery({
    queryKey: dashboardKeys.summary(start, end, intervalType, dataType),
    queryFn: () =>
      apiClient
        .get<ApiResponse<SalesPaymentSummaryItem[]>>(
          `/Report/GetSummarySalesOrPayment?startdate=${start}&enddate=${end}&intervalType=${intervalType}&dataType=${dataType}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 5 * 60_000,
  })
}

export function useMonthlyPurchaseSalesPayment(start?: string, end?: string, enabled = true) {
  const query = new URLSearchParams()
  if (start) query.set('startDate', start)
  if (end) query.set('endDate', end)

  return useQuery({
    queryKey: dashboardKeys.monthly(start, end),
    queryFn: () =>
      apiClient
        .get<ApiResponse<MonthlyPurchaseSalesPaymentItem[]>>(
          `/Report/GetMonthlyPurchaseSalesPaymentSummary${query.size ? `?${query}` : ''}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 5 * 60_000,
  })
}
