import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { TaxAitSummaryItem, TaxAitSummaryFilters } from '@/types/taxAitSummary'

export const taxAitSummaryKeys = {
  all: ['taxAitSummary'] as const,
  list: (filters: TaxAitSummaryFilters) => [...taxAitSummaryKeys.all, 'list', filters] as const,
}

export function useTaxAitSummary(filters: TaxAitSummaryFilters, enabled: boolean) {
  return useQuery({
    queryKey: taxAitSummaryKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<TaxAitSummaryItem[]>>(
          `/Report/GetTaxAitSummary?startDate=${filters.startDate}&endDate=${filters.endDate}&customerId=${filters.customerId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
