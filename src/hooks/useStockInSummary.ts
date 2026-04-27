import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { StockInSummaryItem, StockInSummaryFilters } from '@/types/stockInSummary'

export const stockInSummaryKeys = {
  all: ['stockInSummary'] as const,
  list: (f: StockInSummaryFilters) => [...stockInSummaryKeys.all, 'list', f] as const,
}

export function useStockInSummary(filters: StockInSummaryFilters, enabled: boolean) {
  const params = new URLSearchParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
    statusId: String(filters.statusId),
  })
  if (filters.supplierId) params.set('supplierId', String(filters.supplierId))
  if (filters.customerId) params.set('customerId', String(filters.customerId))

  return useQuery({
    queryKey: stockInSummaryKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<StockInSummaryItem[]>>(
          `/Report/GetStockInSummaryReport?${params.toString()}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
