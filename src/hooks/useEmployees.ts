import { PAGINATED_LIST_ENDPOINTS } from '@/config/pagination'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import type { Employee } from '@/types/employee'

export const employeeKeys = {
  all: ['employees'] as const,
  paginated: (searchTerm: string, pageSize: number) =>
    [...employeeKeys.all, 'paginated', searchTerm, pageSize] as const,
}

export function usePaginatedEmployees(searchTerm = '', pageSize = 50) {
  return usePaginatedList<Employee>({
    queryKey: employeeKeys.paginated(searchTerm, pageSize),
    endpointConfig: PAGINATED_LIST_ENDPOINTS.employee,
    searchTerm,
    pageSize,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}