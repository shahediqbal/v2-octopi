import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  SalesReportApiResponse,
  SalesReportItem,
  SalesReportFilters,
} from '@/types/salesReport'

/* ─────────────────── query keys ─────────────────── */

export const salesReportKeys = {
  all: ['salesReport'] as const,
  list: (filters: SalesReportFilters) => [...salesReportKeys.all, 'list', filters] as const,
}

/* ─────────────────── report query ─────────────────── */

/**
 * GET /Report/GetSalesInfoReport?startDate=&endDate=&parterId=
 * Only runs when `enabled` is true (user clicks "Load Data").
 */
export function useSalesReport(filters: SalesReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: salesReportKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<SalesReportApiResponse<SalesReportItem[]>>(
          `/Report/GetSalesInfoReport?startDate=${filters.startDate}&endDate=${filters.endDate}&parterId=${filters.partnerId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
