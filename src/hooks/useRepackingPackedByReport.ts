import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  RepackingPackedByReportApiResponse,
  RepackingPackedByReportFilters,
  RepackingPackedByReportItem,
} from '@/types/repackingPackedByReport'

export const repackingPackedByReportKeys = {
  all: ['repackingPackedByReport'] as const,
  list: (filters: RepackingPackedByReportFilters) => [...repackingPackedByReportKeys.all, 'list', filters] as const,
}

/**
 * GET /Report/GetRepackingPackedBy with optional filter params.
 * Only runs when `enabled` is true (user clicks "Load Data").
 */
export function useRepackingPackedByReport(filters: RepackingPackedByReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: repackingPackedByReportKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams()

      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)
      if (filters.customerId > 0) params.set('customerId', String(filters.customerId))
      if (filters.employeeId > 0) params.set('employeeId', String(filters.employeeId))
      if (filters.soSystemId.trim()) params.set('soSystemId', filters.soSystemId.trim())
      if (filters.productId > 0) params.set('productId', String(filters.productId))

      const query = params.toString()
      const url = query ? `/Report/GetRepackingPackedBy?${query}` : '/Report/GetRepackingPackedBy'

      return apiClient
        .get<RepackingPackedByReportApiResponse<RepackingPackedByReportItem[]>>(url)
        .then((response) => response.dataObj ?? [])
    },
    enabled,
    staleTime: 2 * 60_000,
  })
}