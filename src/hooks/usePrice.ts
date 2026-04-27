import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  ApiResponse,
  SellingPrice,
  SellingPriceHistory,
  CreateSellingPricePayload,
  UpdateSellingPricePayload,
  PurchasePrice,
  PurchasePriceHistory,
  CreatePurchasePricePayload,
  UpdatePurchasePricePayload,
} from '@/types/price'

// ─────────────────── Query Keys ───────────────────

export const priceKeys = {
  all: ['prices'] as const,
  sellingList: () => [...priceKeys.all, 'selling-list'] as const,
  sellingHistory: (id: number) => [...priceKeys.all, 'selling-history', id] as const,
  sellingDetail: (id: number) => [...priceKeys.all, 'selling-detail', id] as const,
  purchaseList: () => [...priceKeys.all, 'purchase-list'] as const,
  purchaseHistory: (id: number) => [...priceKeys.all, 'purchase-history', id] as const,
  purchaseDetail: (id: number) => [...priceKeys.all, 'purchase-detail', id] as const,
}

// ─────────────────── Selling Price Queries ───────────────────

/** GET /Price/GetAllSellingPrice */
export function useSellingPrices() {
  return useQuery({
    queryKey: priceKeys.sellingList(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ data: SellingPrice[] }>>('/Price/GetAllSellingPrice')
        .then((r) => r.dataObj?.data ?? []),
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  })
}

/** GET /Price/GetProductPriceHistory/{id} */
export function useSellingPriceHistory(id: number | null) {
  return useQuery({
    queryKey: priceKeys.sellingHistory(id ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ data: SellingPriceHistory[] }>>(`/Price/GetProductPriceHistory/${id}`)
        .then((r) => r.dataObj?.data ?? []),
    enabled: !!id && id > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

/** GET /Price/GetAllSellingPriceByProductId/{id} */
export function useSellingPriceDetail(id: number | undefined) {
  return useQuery({
    queryKey: priceKeys.sellingDetail(id ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ data: SellingPrice }>>(`/Price/GetAllSellingPriceByProductId/${id}`)
        .then((r) => r.dataObj?.data),
    enabled: !!id && id > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

// ─────────────────── Purchase Price Queries ───────────────────

/** GET /Price/GetAllPurcashePriceGrid  (NOTE: "Purcashe" is a backend typo) */
export function usePurchasePrices() {
  return useQuery({
    queryKey: priceKeys.purchaseList(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ data: PurchasePrice[] }>>('/Price/GetAllPurcashePriceGrid')
        .then((r) => r.dataObj?.data ?? []),
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  })
}

/** GET /Price/GetPurchasePriceHistory/{id} */
export function usePurchasePriceHistory(id: number | null) {
  return useQuery({
    queryKey: priceKeys.purchaseHistory(id ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ data: PurchasePriceHistory[] }>>(`/Price/GetPurchasePriceHistory/${id}`)
        .then((r) => r.dataObj?.data ?? []),
    enabled: !!id && id > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

/** GET /Price/GetPurchasePriceById/{id} */
export function usePurchasePriceDetail(id: number | undefined) {
  return useQuery({
    queryKey: priceKeys.purchaseDetail(id ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ data: PurchasePrice }>>(`/Price/GetPurchasePriceById/${id}`)
        .then((r) => r.dataObj?.data),
    enabled: !!id && id > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

// ─────────────────── Selling Price Mutations ───────────────────

/** POST /Price/AddProductPrice */
export function useCreateSellingPrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSellingPricePayload) =>
      apiClient.post<ApiResponse<unknown>>('/Price/AddProductPrice', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: priceKeys.sellingList() })
    },
  })
}

/** PUT /Price/UpdateProductSellingPrice */
export function useUpdateSellingPrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateSellingPricePayload) =>
      apiClient.put<ApiResponse<unknown>>('/Price/UpdateProductSellingPrice', data),
    onSuccess: (_r, vars) => {
      void qc.invalidateQueries({ queryKey: priceKeys.sellingList() })
      void qc.invalidateQueries({ queryKey: priceKeys.sellingDetail(vars.productId) })
    },
  })
}

// ─────────────────── Purchase Price Mutations ───────────────────

/** POST /Price/AddPurchasePrice */
export function useCreatePurchasePrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePurchasePricePayload) =>
      apiClient.post<ApiResponse<unknown>>('/Price/AddPurchasePrice', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: priceKeys.purchaseList() })
    },
  })
}

/** PUT /Price/UpdateProductPurchasePrice */
export function useUpdatePurchasePrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdatePurchasePricePayload) =>
      apiClient.put<ApiResponse<unknown>>('/Price/UpdateProductPurchasePrice', data),
    onSuccess: (_r, vars) => {
      void qc.invalidateQueries({ queryKey: priceKeys.purchaseList() })
      void qc.invalidateQueries({ queryKey: priceKeys.purchaseDetail(vars.productId) })
    },
  })
}
