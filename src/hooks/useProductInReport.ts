import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { ProductInReportItem, ProductInReportFilters } from '@/types/productInReport'

export const productInReportKeys = {
  all: ['productInReport'] as const,
  list: (f: ProductInReportFilters) => [...productInReportKeys.all, 'list', f] as const,
}

export function useProductInReport(filters: ProductInReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: productInReportKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<ProductInReportItem[]>>(
          `/Report/GetProductInReport?startDate=${filters.startDate}&endDate=${filters.endDate}&productId=${filters.productId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
