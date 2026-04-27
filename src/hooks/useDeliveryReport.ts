import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { DeliveryReportFilters, DeliveryReportItem } from '@/types/deliveryReport'

export const deliveryReportKeys = {
  all: ['deliveryReport'] as const,
  list: (filters: DeliveryReportFilters) => [...deliveryReportKeys.all, 'list', filters] as const,
}

export function useDeliveryReport(filters: DeliveryReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: deliveryReportKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<DeliveryReportItem[]>>(
          `/Report/GetDeliveryInfoReport?startDate=${filters.startDate}&endDate=${filters.endDate}&parterId=${filters.partnerId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
