import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { PackingPrintFilters, PackingPrintItem } from '@/types/packingPrint'

const packingPrintKeys = {
  all: ['packingPrint'] as const,
  list: (filters: PackingPrintFilters) => [...packingPrintKeys.all, 'list', filters] as const,
}

export function usePackingPrintGrid(filters: PackingPrintFilters, enabled: boolean) {
  return useQuery({
    queryKey: packingPrintKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<PackingPrintItem[]>>(
          `/StockOut/StockOutPrintReportGridData?currentStatus=${filters.currentStatus}&startDate=${filters.startDate}&endDate=${filters.endDate}&customerId=${filters.customerId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
