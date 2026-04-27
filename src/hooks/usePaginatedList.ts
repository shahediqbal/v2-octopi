import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query'
import { buildPaginatedUrl, type PaginatedEndpointConfig } from '@/config/pagination'
import { apiClient } from '@/lib/api'
import type { DropdownApiResponse, PaginatedResponse } from '@/types/dropdown'

export interface UsePaginatedListOptions {
  queryKey: QueryKey
  endpointConfig: PaginatedEndpointConfig
  searchTerm?: string
  pageSize?: number
  enabled?: boolean
  staleTime?: number
  gcTime?: number
  refetchOnWindowFocus?: boolean
  extraParams?: Record<string, string | number | boolean | null | undefined>
}

export function normalizePaginatedResponse<T>(
  dataObj: PaginatedResponse<T> | T[] | null | undefined,
  pageNumber: number,
  pageSize: number,
): PaginatedResponse<T> {
  if (!dataObj) {
    return { data: [], totalRecords: 0, pageNumber, pageSize, totalPages: 0 }
  }

  if (Array.isArray(dataObj)) {
    return {
      data: dataObj,
      totalRecords: dataObj.length,
      pageNumber: 1,
      pageSize: dataObj.length,
      totalPages: 1,
    }
  }

  return {
    ...dataObj,
    data: Array.isArray(dataObj.data) ? dataObj.data : [],
  }
}

export function usePaginatedList<T>({
  queryKey,
  endpointConfig,
  searchTerm = '',
  pageSize,
  enabled = true,
  staleTime = 60_000,
  gcTime,
  refetchOnWindowFocus = false,
  extraParams,
}: UsePaginatedListOptions) {
  const resolvedPageSize = pageSize ?? endpointConfig.pageSize

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const currentPage = typeof pageParam === 'number' ? pageParam : Number(pageParam) || 1
      const url = buildPaginatedUrl(
        endpointConfig,
        currentPage,
        resolvedPageSize,
        searchTerm,
        extraParams,
      )

      const response = await apiClient.get<
        DropdownApiResponse<PaginatedResponse<T> | T[]>
      >(url)

      const normalized = normalizePaginatedResponse(response.dataObj, currentPage, resolvedPageSize)

      return {
        ...normalized,
        data: endpointConfig.transformItems
          ? (endpointConfig.transformItems(normalized.data as unknown[]) as T[])
          : normalized.data,
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pageNumber < lastPage.totalPages
        ? lastPage.pageNumber + 1
        : undefined,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    enabled,
  })
}