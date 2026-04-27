import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { PendingCancelReportItem } from '@/types/pendingCancelReport'

export const pendingCancelKeys = {
  all: ['pendingCancelReport'] as const,
  list: () => [...pendingCancelKeys.all, 'list'] as const,
}

export function usePendingCancelReport() {
  return useQuery({
    queryKey: pendingCancelKeys.list(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<PendingCancelReportItem[]>>('/Report/GetPendingAndCancelReport?status=1')
        .then((r) => r.dataObj ?? []),
    staleTime: 2 * 60_000,
  })
}
