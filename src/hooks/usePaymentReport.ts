import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  PaymentReportApiResponse,
  PaymentReportFilters,
  PaymentReportItem,
} from '@/types/paymentReport'

/* ─────────────────── query keys ─────────────────── */

export const paymentReportKeys = {
  all: ['paymentReport'] as const,
  list: (filters: PaymentReportFilters) => [...paymentReportKeys.all, 'list', filters] as const,
}

/* ─────────────────── report query ─────────────────── */

/**
 * GET /Report/GetPaymentReport?startDate=&endDate=&parterId=
 * Only runs when `enabled` is true (user clicks "Load Data").
 */
export function usePaymentReport(filters: PaymentReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: paymentReportKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<PaymentReportApiResponse<PaymentReportItem[]>>(
          `/Report/GetPaymentReport?startDate=${filters.startDate}&endDate=${filters.endDate}&parterId=${filters.partnerId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}