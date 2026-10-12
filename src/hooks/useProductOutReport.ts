import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

/* ─── types ─── */

export interface ProductOutReportItem {
  soSystemId: number | null
  soSystemNo: string | null
  invoiceDate: string | null
  soCustomerId: number | null
  customerName: string | null
  customerAddress: string | null
  jobType: string | null
  sodProductId: number | null
  productName: string | null
  mappedProductId: number | null
  mappedProductName: string | null
  sodConfirmedQty: number | null
  sodConfirmedUnitPrice: number | null
  soCurrentStatus: number | null
  lifecycleName: string | null
  soAssociateCurrentStatus: number | null
  decessionPending: string | null
  soRemarks: string | null
  soCustomerReferance: string | null
  soRelatedLcId: string | null
  soVatRefNo: string | null
  soVatSystemInvoiceNo: string | null
}

export interface ProductOutReportFilters {
  startDate: string
  endDate: string
  productId: number
  customerId: number
}

interface ApiResponse {
  dataObj: ProductOutReportItem[]
  errMsg?: string
}

/* ─── query keys ─── */

export const productOutReportKeys = {
  all: ['productOutReport'] as const,
  list: (filters: ProductOutReportFilters) => [...productOutReportKeys.all, 'list', filters] as const,
}

/* ─── hook ─── */

/**
 * GET /Report/GetProductOutReport?startDate=&endDate=&productId=&customerId=
 * Only runs when `enabled` is true (user clicks "Load Data").
 */
export function useProductOutReport(filters: ProductOutReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: productOutReportKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse>(
          `/Report/GetProductOutReport?startDate=${filters.startDate}&endDate=${filters.endDate}&productId=${filters.productId}&customerId=${filters.customerId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 2 * 60_000,
  })
}
