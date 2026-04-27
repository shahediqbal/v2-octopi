import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { StockAdjustmentReportItem, AdjustmentReference } from '@/types/stockAdjustmentReport'

export const stockAdjustmentReportKeys = {
  all: ['stockAdjustmentReport'] as const,
  references: ['stockAdjustmentReport', 'references'] as const,
  list: (refId: number) => [...stockAdjustmentReportKeys.all, 'list', refId] as const,
}

export function useAdjustmentReferences() {
  return useQuery({
    queryKey: stockAdjustmentReportKeys.references,
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ key: number; value: string }[]>>('/KeyValue/GetAdjsutmentRef')
        .then((r) =>
          (r.dataObj ?? [])
            .filter((item) => item.value != null)
            .map((item): AdjustmentReference => ({ id: item.key, label: item.value }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        ),
    staleTime: 5 * 60_000,
  })
}

export function useStockAdjustmentReport(referenceId: number, enabled: boolean) {
  return useQuery({
    queryKey: stockAdjustmentReportKeys.list(referenceId),
    queryFn: () =>
      apiClient
        .get<ApiResponse<StockAdjustmentReportItem[]>>(
          `/StockIn/GetStockAdjustmentDetails/${referenceId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
