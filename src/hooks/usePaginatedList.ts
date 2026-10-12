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

/** Sentinel value meaning "fetch page 1 first to discover totalPages, then fetch the last page" */
const LAST_PAGE_SENTINEL = -1

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
  const reversePages = endpointConfig.sortDesc === true

  function applyClientSort(items: T[]): T[] {
    if (!endpointConfig.clientSortKey) return items
    const key = endpointConfig.clientSortKey as string
    return [...items].sort((a, b) => {
      const aVal = Number((a as Record<string, unknown>)[key] ?? 0)
      const bVal = Number((b as Record<string, unknown>)[key] ?? 0)
      return bVal - aVal
    })
  }

  function transformAndSort(raw: T[]): T[] {
    const transformed = endpointConfig.transformItems
      ? (endpointConfig.transformItems(raw as unknown[]) as T[])
      : raw
    return applyClientSort(transformed)
  }

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const isSentinel = pageParam === LAST_PAGE_SENTINEL

      if (isSentinel) {
        /* ── Step 1: probe page 1 to learn totalPages ── */
        const probeUrl = buildPaginatedUrl(endpointConfig, 1, resolvedPageSize, searchTerm, extraParams)
        const probeRes = await apiClient.get<DropdownApiResponse<PaginatedResponse<T> | T[]>>(probeUrl)
        const probe = normalizePaginatedResponse(probeRes.dataObj, 1, resolvedPageSize)

        if (probe.totalPages <= 1) {
          /* only one page — return it directly */
          return { ...probe, data: transformAndSort(probe.data) }
        }

        /* ── Step 2: fetch the actual last page ── */
        const lastUrl = buildPaginatedUrl(endpointConfig, probe.totalPages, resolvedPageSize, searchTerm, extraParams)
        const lastRes = await apiClient.get<DropdownApiResponse<PaginatedResponse<T> | T[]>>(lastUrl)
        const last = normalizePaginatedResponse(lastRes.dataObj, probe.totalPages, resolvedPageSize)
        return { ...last, data: transformAndSort(last.data) }
      }

      /* ── Normal / subsequent page fetch ── */
      const currentPage = typeof pageParam === 'number' ? pageParam : Number(pageParam) || 1
      const url = buildPaginatedUrl(endpointConfig, currentPage, resolvedPageSize, searchTerm, extraParams)
      const response = await apiClient.get<DropdownApiResponse<PaginatedResponse<T> | T[]>>(url)
      const normalized = normalizePaginatedResponse(response.dataObj, currentPage, resolvedPageSize)
      return { ...normalized, data: transformAndSort(normalized.data) }
    },
    initialPageParam: reversePages ? LAST_PAGE_SENTINEL : 1,
    getNextPageParam: reversePages
      ? (lastPage) => (lastPage.pageNumber > 1 ? lastPage.pageNumber - 1 : undefined)
      : (lastPage) => (lastPage.pageNumber < lastPage.totalPages ? lastPage.pageNumber + 1 : undefined),
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    enabled,
  })
}