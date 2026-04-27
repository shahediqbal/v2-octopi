import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { DailyInvoiceTrackingItem, DailyInvoiceTrackingFilters } from '@/types/dailyInvoiceTracking'

export const dailyInvoiceTrackingKeys = {
  all: ['dailyInvoiceTracking'] as const,
  list: (filters: DailyInvoiceTrackingFilters) => [...dailyInvoiceTrackingKeys.all, 'list', filters] as const,
}

export function useDailyInvoiceTracking(filters: DailyInvoiceTrackingFilters, enabled: boolean) {
  return useQuery({
    queryKey: dailyInvoiceTrackingKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<DailyInvoiceTrackingItem[]>>(
          `/Report/GetDailyActivityTAT?startDate=${filters.startDate}&endDate=${filters.endDate}&parterId=${filters.partnerId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
