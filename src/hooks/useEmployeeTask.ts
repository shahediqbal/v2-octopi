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

function buildTaskParams(filters: EmployeeTaskFilters): string {
  const params = new URLSearchParams({ startDate: filters.startDate, endDate: filters.endDate })
  if (filters.employeeId > 0) params.set('employeeId', String(filters.employeeId))
  return params.toString()
}

// API can return { employees: [...] }, { dataObj: { employees: [...] } }, { dataObj: [...] }, or { dataObj: { data: [...] } }
function unwrapEmployees<T>(payload: unknown): T[] {
  if (!payload) return []
  if (Array.isArray(payload)) return payload as T[]
  if (typeof payload !== 'object') return []

  const obj = payload as Record<string, unknown>
  if (Array.isArray(obj.employees)) return obj.employees as T[]
  if (Array.isArray(obj.data)) return obj.data as T[]
  if (obj.dataObj) return unwrapEmployees<T>(obj.dataObj)
  return []
}

export function useEmployeeTaskSummary(filters: EmployeeTaskFilters, enabled: boolean) {
  return useQuery({
    queryKey: employeeTaskKeys.summary(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<unknown>>(`/Task/summary?${buildTaskParams(filters)}`)
        .then((r) => unwrapEmployees<EmployeeTaskSummary>(r)),
    enabled,
    staleTime: 2 * 60_000,
  })
}

export function useEmployeeTaskDetails(filters: EmployeeTaskFilters, enabled: boolean) {
  return useQuery({
    queryKey: employeeTaskKeys.details(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<unknown>>(`/Task/details?${buildTaskParams(filters)}`)
        .then((r) => unwrapEmployees<EmployeeTaskDetailResponse>(r)),
    enabled,
    staleTime: 2 * 60_000,
  })
}
