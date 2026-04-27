import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { StockByProductItem } from '@/types/stockByProduct'

export const stockByProductKeys = {
  all: ['stockByProduct'] as const,
  detail: (productId: number) => [...stockByProductKeys.all, 'detail', productId] as const,
}

export function useStockByProduct(productId: number, enabled: boolean) {
  return useQuery({
    queryKey: stockByProductKeys.detail(productId),
    queryFn: () =>
      apiClient
        .get<ApiResponse<StockByProductItem[]>>(
          `/Stock/GetCurrentStock/${productId}/2`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
