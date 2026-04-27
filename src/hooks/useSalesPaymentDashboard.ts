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
  monthly: () => [...dashboardKeys.all, 'monthly'] as const,
}

export function useSalesPaymentSummary(
  start: string,
  end: string,
  intervalType: 'daily' | 'weekly' | 'monthly',
  dataType: 'sales' | 'payment',
) {
  return useQuery({
    queryKey: dashboardKeys.summary(start, end, intervalType, dataType),
    queryFn: () =>
      apiClient
        .get<ApiResponse<SalesPaymentSummaryItem[]>>(
          `/Report/GetSummarySalesOrPayment?startdate=${start}&enddate=${end}&intervalType=${intervalType}&dataType=${dataType}`,
        )
        .then((r) => r.dataObj ?? []),
    staleTime: 5 * 60_000,
  })
}

export function useMonthlyPurchaseSalesPayment() {
  return useQuery({
    queryKey: dashboardKeys.monthly(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<MonthlyPurchaseSalesPaymentItem[]>>(
          '/Report/GetMonthlyPurchaseSalesPaymentSummary',
        )
        .then((r) => r.dataObj ?? []),
    staleTime: 5 * 60_000,
  })
}
