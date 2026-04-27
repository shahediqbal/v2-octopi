import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { StockOutSalesReturnFilters, StockOutSalesReturnItem } from '@/types/stockOutSalesReturnReport'

export const stockOutSalesReturnKeys = {
  all: ['stockOutSalesReturn'] as const,
  list: (filters: StockOutSalesReturnFilters) => [...stockOutSalesReturnKeys.all, 'list', filters] as const,
}

export function useStockOutSalesReturnReport(filters: StockOutSalesReturnFilters, enabled: boolean) {
  return useQuery({
    queryKey: stockOutSalesReturnKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<StockOutSalesReturnItem[]>>(
          `/Report/GetCustomerStockOutWithStockInReport?customerId=${filters.customerId}&productId=${filters.productId}&startDate=${filters.startDate}&endDate=${filters.endDate}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
