import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  DropdownOption,
  DropdownApiResponse,
  DropdownType,
} from '@/types/dropdown'

// ─────────────────── Query Keys ───────────────────

export const dropdownKeys = {
  all: ['dropdown'] as const,
  type: (type: DropdownType) => [...dropdownKeys.all, type] as const,
  parameterized: (type: DropdownType, params: Record<string, unknown>) =>
    [...dropdownKeys.all, type, params] as const,
  paginated: (type: DropdownType, searchTerm: string, pageSize: number) =>
    [...dropdownKeys.all, type, searchTerm, pageSize] as const,
}

// ─────────────────── Load All Hook ───────────────────

/**
 * Fetches all options for a "Load All" dropdown type.
 * Caches aggressively (5 min stale, 30 min gc) since small lists rarely change.
 *
 * @example
 * const { data: suppliers } = useDropdown('supplier')
 * const { data: banks } = useDropdown('bank')
 */
export function useDropdown(type: DropdownType, enabled = true) {
  return useQuery({
    queryKey: dropdownKeys.type(type),
    queryFn: () =>
      apiClient
        .get<DropdownApiResponse<DropdownOption[]>>(
          `/KeyValue/GetDropdown?type=${encodeURIComponent(type)}`
        )
        .then((r) => r.dataObj),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    enabled,
  })
}

// ─────────────────── Employee by Channel Hook ───────────────────

/**
 * Fetches employees filtered by channelId via the unified GetDropdown endpoint.
 * GET /KeyValue/GetDropdown?type=employeebychannel&channelId={channelId}
 *
 * @example
 * const { data: employees } = useEmployeeByChannelDropdown(channelId)
 */
export function useEmployeeByChannelDropdown(channelId: number | null) {
  return useQuery({
    queryKey: dropdownKeys.parameterized('employeebychannel', { channelId }),
    queryFn: () =>
      apiClient
        .get<DropdownApiResponse<DropdownOption[]>>(
          `/KeyValue/GetDropdown?type=employeebychannel&channelId=${channelId}`
        )
        .then((r) => {
          const dataObj = r.dataObj
          // Handle both array and paginated response formats
          if (Array.isArray(dataObj)) return dataObj
          if (dataObj && typeof dataObj === 'object' && 'data' in dataObj)
            return (dataObj as unknown as { data: DropdownOption[] }).data ?? []
          return []
        }),
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    enabled: !!channelId,
  })
}
