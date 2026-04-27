import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { Employee } from '@/types/employee'
import type {
  UserRole,
  UserWithRole,
  SignupPayload,
  UpdateUserRolePayload,
  CreateRolePayload,
} from '@/types/userManagement'

export const userMgmtKeys = {
  all: ['userMgmt'] as const,
  roles: () => [...userMgmtKeys.all, 'roles'] as const,
  users: () => [...userMgmtKeys.all, 'users'] as const,
  employeeDetail: (id: number) => [...userMgmtKeys.all, 'employee', id] as const,
}

export function useUserRoles() {
  return useQuery({
    queryKey: userMgmtKeys.roles(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<UserRole[]>>('/Role/GetRoles/1')
      return (res.dataObj ?? []).filter(
        (r) => r.roleName.toLowerCase() !== 'customer',
      )
    },
    staleTime: 5 * 60_000,
  })
}

export function useUsersWithRoles() {
  return useQuery({
    queryKey: userMgmtKeys.users(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<UserWithRole[]>>('/Role/GetUserRoleList')
      return res.dataObj ?? []
    },
    staleTime: 30_000,
  })
}

export function useEmployeeDetail(id: number | null) {
  return useQuery({
    queryKey: userMgmtKeys.employeeDetail(id!),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Employee>>(`/Employee/GetEmployeeById/${id}`)
      return res.dataObj
    },
    enabled: id != null,
    staleTime: 5 * 60_000,
  })
}

export function useSignup() {
  return useMutation({
    mutationFn: (payload: SignupPayload) => apiClient.post('/User/Signup', payload),
  })
}

export function useUpdateUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateUserRolePayload) =>
      apiClient.put('/Role/UpdateUserRole', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userMgmtKeys.users() })
    },
  })
}

export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => apiClient.post('/Role/AddRole', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userMgmtKeys.roles() })
    },
  })
}
