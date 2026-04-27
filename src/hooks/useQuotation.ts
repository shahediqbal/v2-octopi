import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  ApiResponse,
  QuotationListItem,
  QuotationDetail,
  CreateQuotationPayload,
  UpdateQuotationPayload,
  ApproveQuotationPayload,
} from '@/types/quotation'

// ─────────────────── Query Keys ───────────────────

export const quotationKeys = {
  all: ['quotations'] as const,
  list: (order: string) => [...quotationKeys.all, 'list', order] as const,
  detail: (id: number) => [...quotationKeys.all, 'detail', id] as const,
}

// ─────────────────── Queries ───────────────────

/**
 * GET /Price/GetQuotationsGrid/-1/{order}
 * order: "-1" = all, "0" = unapproved, "1" = approved
 */
export function useQuotations(order: string) {
  return useQuery({
    queryKey: quotationKeys.list(order),
    queryFn: () =>
      apiClient
        .get<ApiResponse<QuotationListItem[]>>(`/Price/GetQuotationsGrid/-1/${order}`)
        .then((r) => r.dataObj ?? []),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

/** GET /Price/GetQuotationsDetails/{id} */
export function useQuotationDetail(id: number | undefined) {
  return useQuery({
    queryKey: quotationKeys.detail(id ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<QuotationDetail>>(`/Price/GetQuotationsDetails/${id}`)
        .then((r) => r.dataObj),
    enabled: !!id && id > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

// ─────────────────── Mutations ───────────────────

/** POST /Price/CreatePriceQuotation */
export function useCreateQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateQuotationPayload) =>
      apiClient.post<ApiResponse<unknown>>('/Price/CreatePriceQuotation', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: quotationKeys.all })
    },
  })
}

/** PUT /Price/UpdatePriceQuotation */
export function useUpdateQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateQuotationPayload) =>
      apiClient.put<ApiResponse<unknown>>('/Price/UpdatePriceQuotation', data),
    onSuccess: (_r, vars) => {
      void qc.invalidateQueries({ queryKey: quotationKeys.all })
      void qc.invalidateQueries({ queryKey: quotationKeys.detail(vars.pqSystemId) })
    },
  })
}

/** PUT /Price/ApprovePriceQuotation */
export function useApproveQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ApproveQuotationPayload) =>
      apiClient.put<ApiResponse<unknown>>('/Price/ApprovePriceQuotation', data),
    onSuccess: (_r, vars) => {
      void qc.invalidateQueries({ queryKey: quotationKeys.all })
      void qc.invalidateQueries({ queryKey: quotationKeys.detail(vars.pqSystemId) })
    },
  })
}
