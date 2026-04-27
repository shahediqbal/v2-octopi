import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { AllowanceCheckingItem, AllowanceCheckingFilters } from '@/types/allowanceChecking'

export const allowanceCheckingKeys = {
  all: ['allowanceChecking'] as const,
  list: (filters: AllowanceCheckingFilters) => [...allowanceCheckingKeys.all, 'list', filters] as const,
}

export function useAllowanceChecking(filters: AllowanceCheckingFilters, enabled: boolean) {
  return useQuery({
    queryKey: allowanceCheckingKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<AllowanceCheckingItem[]>>(
          `/Report/GetAllowanceRelatedReport?startDate=${filters.startDate}&endDate=${filters.endDate}&employeeId=${filters.employeeId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
