import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  ApiResponse,
  ProformaInvoice,
  PiByStatus,
  PiNumberItem,
  PaymentTerm,
  CreatePiPayload,
  UpdatePiPayload,
  LcDocument,
  CreateLcPayload,
  UpdateLcDocPayload,
  LcLimitedUpdatePayload,
  LcEditListItem,
  LcEditListFilters,
  LcPaymentSummary,
  LcPaymentListItem,
  LcPaymentListFilters,
  LcPaymentEntryPayload,
  UpdateLcPaymentPayload,
} from '@/types/lcTracking'

// ─────────────────── Query Keys ───────────────────

export const lcKeys = {
  all: ['lc-tracking'] as const,
  // PI
  piList: () => [...lcKeys.all, 'pi-list'] as const,
  piDetail: (id: number) => [...lcKeys.all, 'pi-detail', id] as const,
  piNumbers: (custId: number, status: number) =>
    [...lcKeys.all, 'pi-numbers', custId, status] as const,
  paymentTerms: () => [...lcKeys.all, 'payment-terms'] as const,
  piPrice: (productId: number, custId: number, qty: number) =>
    [...lcKeys.all, 'pi-price', productId, custId, qty] as const,
  // LC Document
  piByStatus: (status: number) => [...lcKeys.all, 'pi-by-status', status] as const,
  lcDetail: (id: number) => [...lcKeys.all, 'lc-detail', id] as const,
  lcEditList: (filters: LcEditListFilters) => [...lcKeys.all, 'lc-edit-list', filters] as const,
  // LC Payment
  paymentSummary: (lcDocId: number) => [...lcKeys.all, 'payment-summary', lcDocId] as const,
  paymentHistory: (lcDocId: number) => [...lcKeys.all, 'payment-history', lcDocId] as const,
  paymentEditList: (filters: LcPaymentListFilters) =>
    [...lcKeys.all, 'payment-edit-list', filters] as const,
  paymentDetail: (id: number) => [...lcKeys.all, 'payment-detail', id] as const,
}

// ─────────────────── PI Queries ───────────────────

/** GET /LCTracking/GetAllProformaInvoices */
export function usePiList() {
  return useQuery({
    queryKey: lcKeys.piList(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<ProformaInvoice[]>>('/LCTracking/GetAllProformaInvoices')
        .then((r) => r.dataObj ?? []),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

/** GET /LCTracking/GetProformaInvoiceById/{id} */
export function usePiDetail(id: number | undefined) {
  return useQuery({
    queryKey: lcKeys.piDetail(id ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<ProformaInvoice>>(`/LCTracking/GetProformaInvoiceById/${id}`)
        .then((r) => r.dataObj),
    enabled: !!id && id > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

/** GET /LCTracking/GetPINumberList/{custId}/{status} */
export function usePiNumbers(custId: number | null, status = 0) {
  return useQuery({
    queryKey: lcKeys.piNumbers(custId ?? 0, status),
    queryFn: () =>
      apiClient
        .get<ApiResponse<PiNumberItem[]>>(`/LCTracking/GetPINumberList/${custId}/${status}`)
        .then((r) => r.dataObj ?? []),
    enabled: !!custId && custId > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

/** GET /LCTracking/GetPaymentTerms */
export function usePaymentTerms() {
  return useQuery({
    queryKey: lcKeys.paymentTerms(),
    queryFn: () =>
      apiClient
        .get<ApiResponse<PaymentTerm[]>>('/LCTracking/GetPaymentTerms')
        .then((r) => r.dataObj ?? []),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  })
}

/** GET /Price/GetPriceByCustomerAndQty/{productId}/{customerId}/{quantity} */
export function usePiItemPrice(
  productId: number | null,
  customerId: number | null,
  quantity: number,
) {
  return useQuery({
    queryKey: lcKeys.piPrice(productId ?? 0, customerId ?? 0, quantity),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<{ productPrice?: number; price?: number }>>(
        `/Price/GetPriceByCustomerAndQty/${productId}/${customerId}/${quantity}`,
      )
      return res.dataObj?.productPrice ?? res.dataObj?.price ?? 0
    },
    enabled: !!productId && productId > 0 && !!customerId && customerId > 0 && quantity > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

// ─────────────────── LC Document Queries ───────────────────

/** GET /LCTracking/GetListPIByStatus/{status} */
export function usePiByStatus(status: number) {
  return useQuery({
    queryKey: lcKeys.piByStatus(status),
    queryFn: () =>
      apiClient
        .get<ApiResponse<PiByStatus[]>>(`/LCTracking/GetListPIByStatus/${status}`)
        .then((r) => r.dataObj ?? []),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

/** GET /LCTracking/GetDocumentAndPaymentsById/{id} */
export function useLcDetail(id: number | undefined) {
  return useQuery({
    queryKey: lcKeys.lcDetail(id ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<LcDocument>>(`/LCTracking/GetDocumentAndPaymentsById/${id}`)
        .then((r) => r.dataObj),
    enabled: !!id && id > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

/**
 * GET /LCTracking/GetLCEidtList  (NOTE: "Eidt" is a backend typo)
 * enabled only when search is explicitly triggered
 */
export function useLcEditList(filters: LcEditListFilters, enabled: boolean) {
  const params = new URLSearchParams({
    customerId: String(filters.customerId ?? ''),
    fromDate: filters.fromDate ?? '',
    toDate: filters.toDate ?? '',
  })
  return useQuery({
    queryKey: lcKeys.lcEditList(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<LcEditListItem[]>>(`/LCTracking/GetLCEidtList?${params.toString()}`)
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 0,
    gcTime: 5 * 60_000,
  })
}

// ─────────────────── LC Payment Queries ───────────────────

/** GET /LCTracking/GetLCPaymentSummary/{lcDocId} */
export function useLcPaymentSummary(lcDocId: number | undefined) {
  return useQuery({
    queryKey: lcKeys.paymentSummary(lcDocId ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<LcPaymentSummary>>(`/LCTracking/GetLCPaymentSummary/${lcDocId}`)
        .then((r) => r.dataObj),
    enabled: !!lcDocId && lcDocId > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

/** GET /CustomerPayment/GetLCPaymentHistory/{lcDocId} */
export function useLcPaymentHistory(lcDocId: number | undefined) {
  return useQuery({
    queryKey: lcKeys.paymentHistory(lcDocId ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<LcPaymentListItem[]>>(
          `/CustomerPayment/GetLCPaymentHistory/${lcDocId}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled: !!lcDocId && lcDocId > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

/** GET payment list filtered by paymentMethodId=12 */
export function useLcPaymentEditList(filters: LcPaymentListFilters, enabled: boolean) {
  const params = new URLSearchParams({
    startDate: filters.startDate ?? '',
    endDate: filters.endDate ?? '',
    customerId: String(filters.customerId ?? ''),
    paymentMethodId: '12',
  })
  return useQuery({
    queryKey: lcKeys.paymentEditList(filters),
    queryFn: () =>
      apiClient
        .get<ApiResponse<LcPaymentListItem[]>>(
          `/CustomerPayment/GetPaymentInfoGridByParam?${params.toString()}`,
        )
        .then((r) => r.dataObj ?? []),
    enabled,
    staleTime: 0,
    gcTime: 5 * 60_000,
  })
}

/** GET /CustomerPayment/GetPaymentRelatedDetailsById/{id} */
export function useLcPaymentDetail(id: number | undefined) {
  return useQuery({
    queryKey: lcKeys.paymentDetail(id ?? 0),
    queryFn: () =>
      apiClient
        .get<ApiResponse<LcPaymentEntryPayload>>(
          `/CustomerPayment/GetPaymentRelatedDetailsById/${id}`,
        )
        .then((r) => r.dataObj),
    enabled: !!id && id > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

// ─────────────────── PI Mutations ───────────────────

/** POST /LCTracking/CreateProformaInvoice */
export function useCreatePi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePiPayload) =>
      apiClient.post<ApiResponse<unknown>>('/LCTracking/CreateProformaInvoice', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: lcKeys.piList() })
    },
  })
}

/** PUT /LCTracking/UpdateProformaInvoice */
export function useUpdatePi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdatePiPayload) =>
      apiClient.put<ApiResponse<unknown>>('/LCTracking/UpdateProformaInvoice', data),
    onSuccess: (_r, vars) => {
      void qc.invalidateQueries({ queryKey: lcKeys.piList() })
      void qc.invalidateQueries({ queryKey: lcKeys.piDetail(vars.piSystemId) })
    },
  })
}

/** DELETE /LCTracking/ProformaInvoices/{id} */
export function useDeletePi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<ApiResponse<unknown>>(`/LCTracking/ProformaInvoices/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: lcKeys.piList() })
    },
  })
}

/** POST /LCTracking/EscalatePIActivityStatus/{piId}/{status} */
export function useEscalatePi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ piId, status }: { piId: number; status: number }) =>
      apiClient.post<ApiResponse<unknown>>(
        `/LCTracking/EscalatePIActivityStatus/${piId}/${status}`,
        {},
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: lcKeys.piList() })
      void qc.invalidateQueries({ queryKey: lcKeys.all })
    },
  })
}

// ─────────────────── LC Document Mutations ───────────────────

/** POST /LCTracking/CratreLCDocAndPayments  (NOTE: "Cratre" is a backend typo) */
export function useCreateLc() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateLcPayload) =>
      apiClient.post<ApiResponse<unknown>>('/LCTracking/CratreLCDocAndPayments', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: lcKeys.piByStatus(1) })
      void qc.invalidateQueries({ queryKey: lcKeys.piList() })
    },
  })
}

/** PUT /LCTracking/UpdateLCDocAndPayments */
export function useUpdateLcDoc() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateLcDocPayload) =>
      apiClient.put<ApiResponse<unknown>>('/LCTracking/UpdateLCDocAndPayments', data),
    onSuccess: (_r, vars) => {
      void qc.invalidateQueries({ queryKey: lcKeys.lcDetail(vars.lcDocId) })
      void qc.invalidateQueries({ queryKey: lcKeys.piByStatus(2) })
    },
  })
}

/** PUT via UpdateLCDocAndPayments for limited fields only */
export function useLcLimitedUpdate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: LcLimitedUpdatePayload) =>
      apiClient.put<ApiResponse<unknown>>('/LCTracking/UpdateLCDocAndPayments', data),
    onSuccess: (_r, vars) => {
      void qc.invalidateQueries({ queryKey: lcKeys.lcDetail(vars.lcDocId) })
      void qc.invalidateQueries({ queryKey: lcKeys.all })
    },
  })
}

// ─────────────────── LC Payment Mutations ───────────────────

/** POST /CustomerPayment/AddPaymentInfo */
export function useCreateLcPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: LcPaymentEntryPayload) =>
      apiClient.post<ApiResponse<unknown>>('/CustomerPayment/AddPaymentInfo', data),
    onSuccess: (_r, vars) => {
      void qc.invalidateQueries({ queryKey: lcKeys.paymentSummary(vars.lcDocId) })
      void qc.invalidateQueries({ queryKey: lcKeys.paymentHistory(vars.lcDocId) })
      void qc.invalidateQueries({ queryKey: lcKeys.piByStatus(3) })
    },
  })
}

/** PUT /CustomerPayment/UpdatePaymentInfo */
export function useUpdateLcPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateLcPaymentPayload) =>
      apiClient.put<ApiResponse<unknown>>('/CustomerPayment/UpdatePaymentInfo', data),
    onSuccess: (_r, vars) => {
      void qc.invalidateQueries({ queryKey: lcKeys.paymentSummary(vars.lcDocId) })
      void qc.invalidateQueries({ queryKey: lcKeys.paymentHistory(vars.lcDocId) })
      void qc.invalidateQueries({ queryKey: lcKeys.paymentDetail(vars.paymentSystemId) })
    },
  })
}
