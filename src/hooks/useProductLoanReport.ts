import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { ProductLoanDetailItem, ProductLoanFilters, ProductLoanSummaryItem } from '@/types/productLoanReport'

export const productLoanKeys = {
  all: ['productLoan'] as const,
  details: (filters: ProductLoanFilters) => [...productLoanKeys.all, 'details', filters] as const,
  summary: (filters: ProductLoanFilters) => [...productLoanKeys.all, 'summary', filters] as const,
}

export function useProductLoanDetails(filters: ProductLoanFilters, enabled: boolean) {
  return useQuery({
    queryKey: productLoanKeys.details(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<ProductLoanDetailItem[]>>(
          `/Report/GetCustomerLoanDetails/${filters.customerId}/${filters.productId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}

export function useProductLoanSummary(filters: ProductLoanFilters, enabled: boolean) {
  return useQuery({
    queryKey: productLoanKeys.summary(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<ProductLoanSummaryItem[]>>(
          `/Report/GetCustomerLoanSummery/${filters.customerId}/${filters.productId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
