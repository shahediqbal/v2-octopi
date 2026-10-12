import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { StockAdjustmentReportItem } from '@/types/stockAdjustmentReport'

export const stockAdjustmentReportKeys = {
  all: ['stockAdjustmentReport'] as const,
  list: (productId: number) => [...stockAdjustmentReportKeys.all, 'list', productId] as const,
}

export function useStockAdjustmentReport(productId: number, enabled: boolean) {
  return useQuery({
    queryKey: stockAdjustmentReportKeys.list(productId),
    queryFn: () =>
      apiClient
        .get<ApiResponse<StockAdjustmentReportItem[]>>(
          `/StockIn/GetStockAdjustmentDetails/${productId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
