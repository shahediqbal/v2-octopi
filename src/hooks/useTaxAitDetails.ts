import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { TaxAitDetailItem, TaxAitDetailFilters } from '@/types/taxAitDetail'

export const taxAitDetailKeys = {
  all: ['taxAitDetail'] as const,
  list: (filters: TaxAitDetailFilters) => [...taxAitDetailKeys.all, 'list', filters] as const,
}

export function useTaxAitDetails(filters: TaxAitDetailFilters, enabled: boolean) {
  return useQuery({
    queryKey: taxAitDetailKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<TaxAitDetailItem[]>>(
          `/Report/GetTaxAitDetails?startDate=${filters.startDate}&endDate=${filters.endDate}&customerId=${filters.customerId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
