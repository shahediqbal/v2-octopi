import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { CurrentStockItem, CurrentStockFilters } from '@/types/currentStock'

export const currentStockKeys = {
  all: ['currentStock'] as const,
  list: (f: CurrentStockFilters) => [...currentStockKeys.all, 'list', f] as const,
}

export function useCurrentStock(filters: CurrentStockFilters, enabled: boolean) {
  return useQuery({
    queryKey: currentStockKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<CurrentStockItem[]>>(
          `/Stock/GetCurrentStock/${filters.productId}/${filters.channelId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
