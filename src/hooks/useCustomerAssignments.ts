import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse, Customer } from '@/types/customer'
import type { Employee } from '@/types/employee'
import type { CustomerAssignmentLists, CustomerEmployeeAssignmentPayload } from '@/types/customerAssignment'

const SALES_CUSTOMER_DEPARTMENT_ID = 3

export const customerAssignmentKeys = {
  all: ['customer-assignments'] as const,
  employees: (departmentId: number) => [...customerAssignmentKeys.all, 'employees', departmentId] as const,
  detail: (employeeId: number) => [...customerAssignmentKeys.all, 'detail', employeeId] as const,
}

export function useAssignmentEmployees(departmentId = SALES_CUSTOMER_DEPARTMENT_ID) {
  return useQuery({
    queryKey: customerAssignmentKeys.employees(departmentId),
    queryFn: () =>
      apiClient
        .get<ApiResponse<Employee[]>>('/Employee/GetEmployeeDetails')
        .then((response) => (response.dataObj ?? []).filter((e) => e.departmentId === departmentId)),
    staleTime: 5 * 60_000,
  })
}

export function useCustomerAssignments(employeeId: number | null) {
  return useQuery({
    queryKey: customerAssignmentKeys.detail(employeeId ?? 0),
    queryFn: async (): Promise<CustomerAssignmentLists> => {
      const response = await apiClient.get<ApiResponse<Customer[]>>('/Customer/GetCustomerDetails')
      const all = response.dataObj ?? []
      return {
        employeeId: employeeId ?? 0,
        assignedCustomers: all.filter((c) => c.employeeId === employeeId),
        unAssignedCustomers: all.filter((c) => c.employeeId == null || c.employeeId === 0 || c.employeeId !== employeeId),
      }
    },
    enabled: employeeId !== null,
  })
}

export function useUpdateCustomerAssignments(employeeId: number | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (assignments: CustomerEmployeeAssignmentPayload[]) =>
      apiClient.put<ApiResponse<null>>('/Customer/UpdateAssignEmployee', assignments),
    onSuccess: () => {
      if (employeeId !== null) {
        queryClient.invalidateQueries({ queryKey: customerAssignmentKeys.detail(employeeId) })
      }
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}