import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  ApiResponse,
  PaymentListItem,
  PaymentDetail,
  InvoiceMetadata,
  InvoiceOption,
  ChequeOption,
  PaymentModeOption,
  CreatePaymentPayload,
  UpdatePaymentPayload,
  PaymentListFilters,
} from '@/types/payment'

// ─────────────────── Query Keys ───────────────────

export const paymentKeys = {
  all: ['payments'] as const,
  list: (filters: PaymentListFilters) => [...paymentKeys.all, 'list', filters] as const,
  detail: (id: number) => [...paymentKeys.all, 'detail', id] as const,
  customerInvoices: (customerId: number) => [...paymentKeys.all, 'customer-invoices', customerId] as const,
  customerCheques: (customerId: number) => [...paymentKeys.all, 'customer-cheques', customerId] as const,
  invoiceMetadata: (invoiceId: number) => [...paymentKeys.all, 'invoice-metadata', invoiceId] as const,
  paymentModes: ['payments', 'modes'] as const,
}

// ─────────────────── Queries ───────────────────

/** GET /CustomerPayment/GetPaymentInfoGridByParam — filtered list */
export function usePaymentList(filters: PaymentListFilters, enabled: boolean) {
  const params = new URLSearchParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
    customerId: String(filters.customerId),
  })
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<PaymentListItem[]>>(
          `/CustomerPayment/GetPaymentInfoGridByParam?${params.toString()}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 0,
    gcTime: 5 * 60_000,
  })
}

/** GET /CustomerPayment/GetPaymentRelatedDetailsById/:id */
export function usePaymentDetail(id: number | undefined) {
  return useQuery({
    queryKey: paymentKeys.detail(id ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<PaymentDetail>>(`/CustomerPayment/GetPaymentRelatedDetailsById/${id}`)
        .then((r) => r.dataObj),
    enabled: !!id,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

/** GET /CustomerPayment/GetPaymentCustomerInvoice/:customerId */
export function useCustomerInvoices(customerId: number | null) {
  return useQuery({
    queryKey: paymentKeys.customerInvoices(customerId ?? 0),
    queryFn: async () => {
      type RawInvoice = { soSystemId: number; soSystemNo: string }
      const res = await apiClient.get<ApiResponse<RawInvoice[]>>(
        `/CustomerPayment/GetPaymentCustomerInvoice/${customerId}`,
      )
      const items: InvoiceOption[] = (res.dataObj ?? [])
        .map((i) => ({ id: i.soSystemId, label: i.soSystemNo }))
        .sort((a, b) => a.label.localeCompare(b.label))
      return items
    },
    enabled: !!customerId && customerId > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

/** GET /CustomerPayment/GetPaymentCustomerCheque/:customerId */
export function useCustomerCheques(customerId: number | null) {
  return useQuery({
    queryKey: paymentKeys.customerCheques(customerId ?? 0),
    queryFn: async () => {
      type RawCheque = { chequeInfoId: number; chequeNumber: string }
      const res = await apiClient.get<ApiResponse<RawCheque[]>>(
        `/CustomerPayment/GetPaymentCustomerCheque/${customerId}`,
      )
      const items: ChequeOption[] = (res.dataObj ?? [])
        .map((c) => ({ id: c.chequeInfoId, label: c.chequeNumber }))
        .sort((a, b) => a.label.localeCompare(b.label))
      return items
    },
    enabled: !!customerId && customerId > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

/** GET /CustomerPayment/GetPaymentInvoiceMetaDataById/:invoiceId */
export function useInvoiceMetadata(invoiceId: number | null) {
  return useQuery({
    queryKey: paymentKeys.invoiceMetadata(invoiceId ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<InvoiceMetadata>>(
          `/CustomerPayment/GetPaymentInvoiceMetaDataById/${invoiceId}`,
        )
        .then((r) => r.dataObj),
    enabled: !!invoiceId && invoiceId > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

/** GET /KeyValue/GetPaymentMethodKeyValue/2 — payment modes dropdown */
export function usePaymentModes() {
  return useQuery({
    queryKey: paymentKeys.paymentModes,
    queryFn: async () => {
      type RawMode = { key: number; value: string }
      const res = await apiClient.get<ApiResponse<RawMode[]>>(
        '/KeyValue/GetPaymentMethodKeyValue/2',
      )
      const items: PaymentModeOption[] = (res.dataObj ?? [])
        .map((m) => ({ id: m.key, label: m.value }))
        .sort((a, b) => a.label.localeCompare(b.label))
      return items
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  })
}

// ─────────────────── Mutations ───────────────────

/** POST /CustomerPayment/AddPaymentInfo */
export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePaymentPayload) =>
      apiClient.post<ApiResponse<unknown>>('/CustomerPayment/AddPaymentInfo', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.all })
    },
  })
}

/** PUT /CustomerPayment/UpdatePaymentInfo */
export function useUpdatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdatePaymentPayload) =>
      apiClient.put<ApiResponse<unknown>>('/CustomerPayment/UpdatePaymentInfo', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.all })
    },
  })
}
