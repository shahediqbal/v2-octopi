import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { InvoiceDetail } from '@/types/invoiceDetail'

export const invoiceDetailKeys = {
  all: ['invoiceDetail'] as const,
  detail: (id: number) => [...invoiceDetailKeys.all, id] as const,
}

export function useInvoiceDetail(soSystemId: number | null) {
  return useQuery({
    queryKey: invoiceDetailKeys.detail(soSystemId ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<InvoiceDetail>>(`/StockOut/GetStockOutByIdInternal/${soSystemId}`)
        .then((r) => r.dataObj ?? null),
    enabled: soSystemId != null && soSystemId > 0,
    staleTime: 5 * 60_000,
  })
}
