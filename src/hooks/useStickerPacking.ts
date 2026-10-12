import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  StickerOrderRow,
  StickerPackagingDetail,
  SalesOrderInternalDetail,
  CreateStickerPackagingPayload,
  UpdateStickerPackagingPayload,
  PackType,
} from '@/types/stickerPacking'
import type { ApiResponse } from '@/types/customer'
import type { StockOutApiResponse, StockOutOrderDetail } from '@/types/stockOut'

export const stickerPackingKeys = {
  all: ['stickerPacking'] as const,
  orders: (orderType: number) => [...stickerPackingKeys.all, 'orders', orderType] as const,
  detail: (soSystemId: number) => [...stickerPackingKeys.all, 'detail', soSystemId] as const,
  orderDetail: (soSystemId: number) => [...stickerPackingKeys.all, 'orderDetail', soSystemId] as const,
  fullDetail: (soSystemId: number) => [...stickerPackingKeys.all, 'fullDetail', soSystemId] as const,
  packTypes: () => [...stickerPackingKeys.all, 'packTypes'] as const,
}

export function useStickerOrders(orderType: number) {
  return useQuery({
    queryKey: stickerPackingKeys.orders(orderType),
    queryFn: () =>
      apiClient
        .get<ApiResponse<StickerOrderRow[]>>(`/StockOut/StickerStockOutOrderGridData/${orderType}`)
        .then((r) => r.dataObj ?? []),
    staleTime: 30_000,
  })
}

export function useStickerPackingDetail(soSystemId: number | undefined) {
  return useQuery({
    queryKey: stickerPackingKeys.detail(soSystemId ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<StickerPackagingDetail>>(`/StockOut/GetStickerPackagingDetailsForEdit/${soSystemId}`)
        .then((r) => r.dataObj),
    enabled: !!soSystemId,
  })
}

export function useSalesOrderInternalDetail(soSystemId: number | undefined) {
  return useQuery({
    queryKey: stickerPackingKeys.orderDetail(soSystemId ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ stockOutGeneralData: Record<string, unknown>; stockOutItemsData: SalesOrderInternalItem[] }>>(`/StockOut/GetStockOutOrderDetails/${soSystemId}`)
        .then((r) => {
          if (!r.dataObj) return undefined
          const g = r.dataObj.stockOutGeneralData as {
            soSystemId: number
            soSystemNo: string
            invoiceDate: string
            customerName: string
            jobType: string
          }
          return {
            soSystemId: g.soSystemId,
            soSystemNo: g.soSystemNo,
            invoiceDate: g.invoiceDate,
            customerName: g.customerName,
            jobType: g.jobType,
            stockOutItemsData: r.dataObj.stockOutItemsData ?? [],
          } as SalesOrderInternalDetail
        }),
    enabled: !!soSystemId,
  })
}

export function useSalesOrderDetail(soSystemId: number | undefined) {
  return useQuery({
    queryKey: stickerPackingKeys.fullDetail(soSystemId ?? 0),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<StockOutOrderDetail>>(`/StockOut/GetStockOutOrderDetails/${soSystemId}`)
        .then((r) => r.dataObj),
    enabled: !!soSystemId,
  })
}

export function usePackTypes() {  return useQuery({
    queryKey: stickerPackingKeys.packTypes(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<PackType[]>>('/Product/GetPackType')
        .then((r) => r.dataObj ?? []),
    staleTime: 5 * 60_000,
  })
}

export function useCreateStickerPacking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateStickerPackagingPayload) =>
      apiClient.post('/StockOut/CreateStickerPackaging', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stickerPackingKeys.all })
    },
  })
}

export function useUpdateStickerPacking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateStickerPackagingPayload) =>
      apiClient.put('/StockOut/UpdateStickerPackaging', payload),
    onSuccess: (_data, variables) => {
      const soSystemId = variables[0]?.soSystemId
      if (soSystemId) {
        queryClient.invalidateQueries({ queryKey: stickerPackingKeys.detail(soSystemId) })
      }
      queryClient.invalidateQueries({ queryKey: stickerPackingKeys.all })
    },
  })
}
