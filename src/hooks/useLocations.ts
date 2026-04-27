import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PAGINATED_LIST_ENDPOINTS } from '@/config/pagination'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { apiClient } from '@/lib/api'
import type { ApiResponse, CreateLocationPayload, Location, UpdateLocationPayload } from '@/types/location'

export const locationKeys = {
  all: ['locations'] as const,
  list: () => [...locationKeys.all, 'list'] as const,
  paginatedList: (searchTerm: string, pageSize: number) =>
    [...locationKeys.all, 'paginated', searchTerm, pageSize] as const,
  detail: (id: number) => [...locationKeys.all, 'detail', id] as const,
}

export function useLocations() {
  return useQuery({
    queryKey: locationKeys.list(),
    queryFn: () => apiClient.get<ApiResponse<Location[]>>('/Location/GetLocations').then((response) => response.dataObj ?? []),
  })
}

export function usePaginatedLocations(searchTerm = '', pageSize = 50) {
  return usePaginatedList<Location>({
    queryKey: locationKeys.paginatedList(searchTerm, pageSize),
    endpointConfig: PAGINATED_LIST_ENDPOINTS.location,
    searchTerm,
    pageSize,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useLocationDetail(id: number | undefined) {
  return useQuery({
    queryKey: locationKeys.detail(id!),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Location[] | Location>>(`/Location/GetLocationById/${id}`)
      return normalizeLocationDetail(response.dataObj)
    },
    enabled: !!id,
  })
}

export function useCreateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLocationPayload) => apiClient.post<ApiResponse<Location>>('/Location/AddLocation', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all })
    },
  })
}

export function useUpdateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateLocationPayload) => apiClient.put<ApiResponse<Location>>('/Location/LocationUpdate', data),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all })
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(variables.locationId) })
    },
  })
}

export function useDeleteLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (locationId: number) => apiClient.delete<ApiResponse<null>>(`/Location/DeleteLocation?id=${locationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all })
    },
  })
}

function normalizeLocationDetail(dataObj: Location[] | Location | Record<string, unknown> | null | undefined): Location {
  if (Array.isArray(dataObj)) {
    return normalizeLocationDetail(dataObj[0] as unknown as Record<string, unknown> | undefined)
  }

  const source = (dataObj ?? {}) as Record<string, unknown>

  const locationId = source.locationId
    ?? source.LocationId
    ?? source.key
    ?? source.Key
    ?? 0

  const locationName = source.locationName
    ?? source.LocationName
    ?? source.value
    ?? source.Value
    ?? ''

  return {
    locationId: Number(locationId),
    locationName: String(locationName),
  }
}