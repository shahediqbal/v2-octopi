import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type {
  EmployeeTaskSummary,
  EmployeeTaskDetailResponse,
  EmployeeTaskFilters,
} from '@/types/employeeTask'

export const employeeTaskKeys = {
  all: ['employeeTask'] as const,
  summary: (filters: EmployeeTaskFilters) =>
    [...employeeTaskKeys.all, 'summary', filters] as const,
  details: (filters: EmployeeTaskFilters) =>
    [...employeeTaskKeys.all, 'details', filters] as const,
}

export function useEmployeeTaskSummary(filters: EmployeeTaskFilters, enabled: boolean) {
  return useQuery({
    queryKey: employeeTaskKeys.summary(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<EmployeeTaskSummary[]>>(
          `/Task/summary?startDate=${filters.startDate}&endDate=${filters.endDate}&employeeId=${filters.employeeId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}

export function useEmployeeTaskDetails(filters: EmployeeTaskFilters, enabled: boolean) {
  return useQuery({
    queryKey: employeeTaskKeys.details(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<EmployeeTaskDetailResponse[]>>(
          `/Task/details?startDate=${filters.startDate}&endDate=${filters.endDate}&employeeId=${filters.employeeId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
