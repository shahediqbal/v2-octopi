import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { DeliveryConveyanceItem, DeliveryConveyanceFilters } from '@/types/deliveryConveyance'

export const deliveryConveyanceKeys = {
  all: ['deliveryConveyance'] as const,
  list: (filters: DeliveryConveyanceFilters) =>
    [...deliveryConveyanceKeys.all, 'list', filters] as const,
}

export function useDeliveryConveyance(filters: DeliveryConveyanceFilters, enabled: boolean) {
  return useQuery({
    queryKey: deliveryConveyanceKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<DeliveryConveyanceItem[]>>(
          `/Report/GetDeliveryConveyance?startDate=${filters.startDate}&endDate=${filters.endDate}&employeeId=${filters.employeeId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
