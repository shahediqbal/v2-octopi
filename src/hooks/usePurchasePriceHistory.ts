import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { PurchasePriceHistoryItem, PurchasePriceHistoryFilters } from '@/types/purchasePriceHistory'

export const purchasePriceHistoryKeys = {
  all: ['purchasePriceHistory'] as const,
  list: (filters: PurchasePriceHistoryFilters) =>
    [...purchasePriceHistoryKeys.all, 'list', filters] as const,
}

export function usePurchasePriceHistory(filters: PurchasePriceHistoryFilters, enabled: boolean) {
  return useQuery({
    queryKey: purchasePriceHistoryKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<PurchasePriceHistoryItem[]>>(
          `/Report/GetPurchasePriceHistory/${filters.productId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
