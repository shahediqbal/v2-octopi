import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { BatchRow, BatchDetail, UpdateBatchPayload } from '@/types/batch'
import type { ApiResponse } from '@/types/customer'

export const batchKeys = {
  all: ['batches'] as const,
  list: (status: string) => [...batchKeys.all, 'list', status] as const,
  detail: (id: number) => [...batchKeys.all, 'detail', id] as const,
}

export function useBatchList(statusFilter: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: batchKeys.list(statusFilter),
    queryFn: () =>
      apiClient
        .get<ApiResponse<BatchRow[]>>(`/Batch/GetBatchesGridData/${statusFilter}`)
        .then((r) => r.dataObj ?? []),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  })
}

export function useBatchDetail(id: number | undefined) {
  return useQuery({
    queryKey: batchKeys.detail(id ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<BatchDetail[]>>(`/Batch/GetBatchInfoById/${id}`)
        .then((r) => (r.dataObj ?? [])[0]),
    enabled: !!id,
  })
}

export function useUpdateBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateBatchPayload) =>
      apiClient.put('/Batch/UpdateBatch', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: batchKeys.all })
    },
  })
}
