import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  Role,
  RoleDetails,
  CreateRolePayload,
  UpdateRoleDetailsPayload,
  ApiResponse,
} from '@/types/roleAndMenu'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const roleKeys = {
  all: ['roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
  detail: (id: number) => [...roleKeys.all, 'detail', id] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch all roles — GET /Role/GetRoles/1 */
export function useRoles() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<Role[]>>('/Role/GetRoles/1')
        .then((r) => r.dataObj ?? []),
  })
}

/**
 * Fetch full details for a specific role including its menu lists.
 * Only fires when `id` is a valid positive number.
 * GET /Role/GetRoleDetails/{id}
 */
export function useRoleDetails(id: number | null) {
  return useQuery({
    queryKey: roleKeys.detail(id ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<RoleDetails>>(`/Role/GetRoleDetails/${id}`)
        .then((r) => r.dataObj),
    enabled: id !== null && id > 0,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new role — POST /Role/AddRole */
export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRolePayload) =>
      apiClient.post<ApiResponse<unknown>>('/Role/AddRole', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.list() })
    },
  })
}

/**
 * Persist the current menu assignment for a role.
 * PUT /Role/UpdateRoleDetails
 */
export function useUpdateRoleDetails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateRoleDetailsPayload) =>
      apiClient.put<ApiResponse<unknown>>('/Role/UpdateRoleDetails', data),
    onSuccess: (_data, vars) => {
      // Invalidate the detail cache so next selection gets fresh data
      qc.invalidateQueries({ queryKey: roleKeys.detail(vars.roleId) })
    },
  })
}
