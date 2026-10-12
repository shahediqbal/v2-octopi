import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { StockInBatchItem, StockInBatchFilters } from '@/types/stockInBatch'

export const stockInBatchKeys = {
  all: ['stockInBatch'] as const,
  list: (filters: StockInBatchFilters) => [...stockInBatchKeys.all, 'list', filters] as const,
}

function buildStockInBatchReportUrl(filters: StockInBatchFilters) {
  const params = new URLSearchParams({
    supplierId: String(filters.supplierId),
    productId: String(filters.productId),
    customerId: String(filters.customerId),
    startDate: filters.startDate,
    endDate: filters.endDate,
  })

  return `/Report/GetAllStockInBatchReport?${params.toString()}`
}

export function useStockInBatch(filters: StockInBatchFilters, enabled: boolean) {
  return useQuery({
    queryKey: stockInBatchKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<StockInBatchItem[]>>(buildStockInBatchReportUrl(filters))
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
