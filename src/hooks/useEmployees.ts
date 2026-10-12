import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PAGINATED_LIST_ENDPOINTS } from '@/config/pagination'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { apiClient } from '@/lib/api'
import type {
  ApiResponse,
  CreateEmployeePayload,
  Employee,
  EmployeeType,
  UpdateEmployeePayload,
} from '@/types/employee'

export const employeeKeys = {
  all: ['employees'] as const,
  paginated: (searchTerm: string, pageSize: number) =>
    [...employeeKeys.all, 'paginated', searchTerm, pageSize] as const,
  options: () => [...employeeKeys.all, 'options'] as const,
  detail: (id: number) => [...employeeKeys.all, 'detail', id] as const,
  types: () => [...employeeKeys.all, 'types'] as const,
}

function getEmployeeLabel(employee: Employee) {
  const fullName = [employee.empFirstName, employee.empLastName]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .trim()

  return fullName || employee.empName || employee.employeeCode || `Employee #${employee.employeeId}`
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

export function useEmployeeOptions() {
  return useQuery({
    queryKey: employeeKeys.options(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<Employee[]>>('/Employee/GetEmployeeDetails')
        .then((response) =>
          (response.dataObj ?? [])
            .map((employee) => ({ id: employee.employeeId, label: getEmployeeLabel(employee) }))
            .sort((left, right) => left.label.localeCompare(right.label)),
        ),
    staleTime: 5 * 60_000,
  })
}

export function useEmployeeDetail(id: number | undefined) {
  return useQuery({
    queryKey: employeeKeys.detail(id!),
    queryFn: () =>
      apiClient.get<ApiResponse<Employee>>(`/Employee/GetEmployeeById/${id}`).then((r) => r.dataObj),
    enabled: !!id,
  })
}

export function useEmployeeTypes() {
  return useQuery({
    queryKey: employeeKeys.types(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<EmployeeType[]>>('/Employee/GetEmployeeType')
        .then((r) => r.dataObj ?? []),
    staleTime: 5 * 60_000,
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEmployeePayload) =>
      apiClient.post<ApiResponse<Employee>>('/Employee/AddEmployee', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: employeeKeys.all })
    },
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateEmployeePayload) =>
      apiClient.put<ApiResponse<Employee>>('/Employee/UpdateEmployee', data),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: employeeKeys.all })
      qc.invalidateQueries({ queryKey: employeeKeys.detail(variables.employeeId) })
    },
  })
}

export function useDeactivateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (employeeCode: string) =>
      apiClient.put<ApiResponse<null>>(
        `/Employee/DeactiveUserEmpStatus?userCode=${encodeURIComponent(employeeCode)}`,
        {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: employeeKeys.all })
    },
  })
}