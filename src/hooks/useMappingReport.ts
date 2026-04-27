import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  ApiResponse,
  MappingReportItem,
  MappingReportFilters,
} from '@/types/mappingReport'

/* ─────────────────── query keys ─────────────────── */

export const mappingReportKeys = {
  all: ['mappingReport'] as const,
  list: (filters: MappingReportFilters) => [...mappingReportKeys.all, 'list', filters] as const,
}

/* ─────────────────── report query ─────────────────── */

/**
 * GET /Report/GetMappedItemReport?startDate=&endDate=&productId=&partnerId=
 * Only runs when `enabled` is true (user clicks "Load Data")
 *
 * Customer & Product dropdowns now use the centralized PaginatedCombobox
 * component (via useDropdown / usePaginatedDropdown hooks) instead of
 * dedicated legacy endpoints.
 */
export function useMappingReport(filters: MappingReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: mappingReportKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<MappingReportItem[]>>(
          `/Report/GetMappedItemReport?startDate=${filters.startDate}&endDate=${filters.endDate}&productId=${filters.productId}&partnerId=${filters.partnerId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
