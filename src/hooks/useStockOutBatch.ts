import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { StockOutBatchItem, StockOutBatchFilters } from '@/types/stockOutBatch'

export const stockOutBatchKeys = {
  all: ['stockOutBatch'] as const,
  list: (filters: StockOutBatchFilters) => [...stockOutBatchKeys.all, 'list', filters] as const,
}

export function useStockOutBatch(filters: StockOutBatchFilters, enabled: boolean) {
  return useQuery({
    queryKey: stockOutBatchKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<StockOutBatchItem[]>>(
          `/Report/GetAllStockOutBatchRelatedReport?customerId=${filters.customerId}&productId=${filters.productId}&startDate=${filters.startDate}&endDate=${filters.endDate}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
