import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { ProductInWithAdjustmentItem, ProductInWithAdjustmentFilters } from '@/types/productInWithAdjustment'

export const productInWithAdjustmentKeys = {
  all: ['productInWithAdjustment'] as const,
  list: (f: ProductInWithAdjustmentFilters) => [...productInWithAdjustmentKeys.all, 'list', f] as const,
}

export function useProductInWithAdjustment(filters: ProductInWithAdjustmentFilters, enabled: boolean) {
  return useQuery({
    queryKey: productInWithAdjustmentKeys.list(filters),
    queryFn: async () => {
      const raw = await apiClient
        .get<ApiResponse<ProductInWithAdjustmentItem[]>>(
          `/Report/GetProductStockInWithAdjustment?startDate=${filters.startDate}&endDate=${filters.endDate}&productId=${filters.productId}`,
        )
        .then((r) => r.dataObj ?? [])

      return raw.map((item) => ({
        ...item,
        adjustmentAmount:
          item.adjustmentAmount ?? item.sidAdjustedAmount ?? item.sidAdjustmentAmount ?? item.sidAdjustmentQty ?? 0,
        adjustedUnitPrice:
          item.adjustedUnitPrice ?? item.sidAdjustedUnitPrice ?? item.sidFinalUnitPrice ?? item.sidConfirmedUnitPrice ?? 0,
      }))
    },
    enabled,
    staleTime: 2 * 60_000,
  })
}
