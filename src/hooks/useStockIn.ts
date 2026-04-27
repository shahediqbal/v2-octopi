// ============================================================
// Stock-In Module — TanStack Query Hooks
// ============================================================
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { PAGINATED_LIST_ENDPOINTS } from '@/config/pagination'
import type {
  StockInListMode,
  StockInListFilters,
  StockInListRow,
  StockInOrderDetail,
  StockInApiResponse,
  CreateStockInPayload,
  UpdateStockInPayload,
  QuantityConfirmationItem,
  RevertItem,
  StockAdjustmentPayload,
  StockInInvoiceListRow,
  StockInInvoiceFilters,
  StockInChallan,
  StockInBillData,
  StockInChallanItem,
  StockInGeneralData,
  StockInLookupOption,
} from '@/types/stockIn'
import { LIST_MODE_CONFIG } from '@/features/stock-in/modes'

// ── Lookup mapper ────────────────────────────────────────────
function mapLookup(
  items: Array<{ key: number; value: string }> | null | undefined,
): StockInLookupOption[] {
  return (items ?? []).map((item) => ({ id: Number(item.key), label: String(item.value ?? '') }))
}

function getErrorStatus(error: unknown): number | null {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: unknown }).status
    return typeof status === 'number' ? status : null
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toNullableString(value: unknown): string | null {
  if (value == null || value === '') return null
  return typeof value === 'string' ? value : String(value)
}

function toStringValue(value: unknown): string {
  return toNullableString(value) ?? ''
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toNumberValue(value: unknown): number {
  return toNullableNumber(value) ?? 0
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (value == null || value === '') return undefined
  if (value === 1 || value === '1' || value === 'true') return true
  if (value === 0 || value === '0' || value === 'false') return false
  return undefined
}

function normalizeStockInBillData(source: Record<string, unknown>): StockInBillData {
  return {
    sibCalculatedAmount: toNumberValue(source.sibCalculatedAmount),
    sibDiscountAmouunt: toNumberValue(source.sibDiscountAmouunt),
    sibAdjustedAmount: toNumberValue(source.sibAdjustedAmount),
    sibFinalAmount: toNumberValue(source.sibFinalAmount),
    sibCurrencyName: toStringValue(source.sibCurrencyName),
  }
}

function normalizeStockInGeneralData(source: Record<string, unknown>): StockInGeneralData {
  return {
    siSystemId: toNumberValue(source.siSystemId),
    siSystemNo: toStringValue(source.siSystemNo),
    siInvoiceNo: toStringValue(source.siInvoiceNo),
    siInvoiceDate: toStringValue(source.siInvoiceDate),
    siInvoiceDateInText: toNullableString(source.siInvoiceDateInText) ?? undefined,
    siJobTypeId: toNumberValue(source.siJobTypeId),
    jobTypeName: toStringValue(source.jobTypeName ?? source.jobType),
    siRemarks: toNullableString(source.siRemarks),
    siSourceChannelId: toNumberValue(source.siSourceChannelId),
    siSourceChannelName: toNullableString(source.siSourceChannelName),
    siDestinationChannelId: toNumberValue(source.siDestinationChannelId),
    siDestinationChannelName: toNullableString(source.siDestinationChannelName),
    siSupplierId: toNullableNumber(source.siSupplierId),
    supplierName: toNullableString(source.supplierName),
    supplierAddress: toNullableString(source.supplierAddress),
    siCustomerId: toNullableNumber(source.siCustomerId),
    customerName: toNullableString(source.customerName),
    customerAddress: toNullableString(source.customerAddress),
    siInvoiceReceiveStatus: toOptionalBoolean(source.siInvoiceReceiveStatus),
    siInvoiceReceiveDate: toNullableString(source.siInvoiceReceiveDate),
    siCurrentStatus: toNullableNumber(source.siCurrentStatus) ?? undefined,
  }
}

function normalizeStockInChallan(data: unknown): StockInChallan | undefined {
  if (!isRecord(data)) return undefined

  const generalSource = isRecord(data.stockInGeneralData)
    ? { ...data, ...data.stockInGeneralData }
    : data

  const billSource = isRecord(data.stockInBillData)
    ? { ...data, ...data.stockInBillData }
    : data

  return {
    stockInGeneralData: normalizeStockInGeneralData(generalSource),
    stockInItemsData: Array.isArray(data.stockInItemsData)
      ? (data.stockInItemsData as StockInChallanItem[])
      : [],
    stockInBillData: normalizeStockInBillData(billSource),
  }
}

/**
 * Fetches the full channel list from /Channel/GetChannels.
 * This is the same endpoint used by the legacy app and includes ALL channels
 * (e.g. "Supplier Channel", "Customer Channel", warehouse channels, etc.)
 * which may not all appear in the unified /KeyValue/GetDropdown?type=channel endpoint.
 */
export function useStockInChannels() {
  return useQuery({
    queryKey: [...stockInKeys.all, 'channels-full'] as const,
    queryFn: () =>
      apiClient
        .get<StockInApiResponse<Array<{ channelId: number; channelName: string }>>>(
          '/Channel/GetChannels',
        )
        .then((res) =>
          (res.dataObj ?? []).map((c) => ({ id: c.channelId, label: c.channelName })),
        ),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

// ── URL Builder ───────────────────────────────────────────────
function buildStockInListUrl(mode: StockInListMode): string {
  const statusCode = LIST_MODE_CONFIG[mode].statusCode
  return `/StockIn/StockInOrderGridData/${statusCode}`
}

// ── Query Key Factory ─────────────────────────────────────────
export const stockInKeys = {
  all: ['stockIn'] as const,
  lists: () => [...stockInKeys.all, 'list'] as const,
  list: (mode: StockInListMode, filters: StockInListFilters) =>
    [...stockInKeys.all, 'list', mode, filters] as const,
  details: () => [...stockInKeys.all, 'detail'] as const,
  detail: (id: number) => [...stockInKeys.all, 'detail', id] as const,
  invoices: () => [...stockInKeys.all, 'invoices'] as const,
  invoiceList: (filters: StockInInvoiceFilters) =>
    [...stockInKeys.invoices(), filters] as const,
  challan: (id: number) => [...stockInKeys.all, 'challan', id] as const,
  lookups: () => [...stockInKeys.all, 'lookups'] as const,
  currentStock: (productId: number, channelId: number) =>
    [...stockInKeys.all, 'current-stock', productId, channelId] as const,
  batchAndMappedItems: (productId: number) =>
    [...stockInKeys.all, 'batch-mapped', productId] as const,
}

// ── Query Hooks ───────────────────────────────────────────────

export function useStockInList(mode: StockInListMode, filters: StockInListFilters = {}, enabled = true) {
  return useQuery({
    queryKey: stockInKeys.list(mode, filters),
    queryFn: () =>
      apiClient
        .get<StockInApiResponse<StockInListRow[]>>(buildStockInListUrl(mode))
        .then((response) => response.dataObj ?? []),
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useStockInListLazy(searchTerm = '', enabled = true) {
  return usePaginatedList<StockInListRow>({
    queryKey: [...stockInKeys.all, 'list-lazy', searchTerm] as const,
    endpointConfig: PAGINATED_LIST_ENDPOINTS.stockInOrderLazy,
    searchTerm,
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useStockInDetail(id: number | undefined) {
  return useQuery({
    queryKey: stockInKeys.detail(id ?? 0),
    queryFn: () =>
      apiClient
        .get<StockInApiResponse<StockInOrderDetail>>(`/StockIn/GetStockInOrderDetails/${id}`)
        .then((response) => response.dataObj),
    enabled: !!id,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useStockInInvoiceList(filters: StockInInvoiceFilters, enabled = false) {
  const { supplierId = 0, customerId = 0 } = filters
  return useQuery({
    queryKey: stockInKeys.invoiceList(filters),
    queryFn: () =>
      apiClient
        .get<StockInApiResponse<StockInInvoiceListRow[]>>(
          `/StockIn/GetStockInInvoiceList/${supplierId}/${customerId}`,
        )
        .then((response) => response.dataObj ?? []),
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useStockInChallan(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: stockInKeys.challan(id ?? 0),
    queryFn: () =>
      apiClient
        .get<StockInApiResponse<unknown>>(`/StockIn/GetStockInChallan/${id}`)
        .then((response) => normalizeStockInChallan(response.dataObj)),
    enabled: enabled && !!id,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Lookups: order types (job types) for stock-in from backend
 * Falls back gracefully if endpoint does not exist.
 */
export function useStockInLookups() {
  return useQuery({
    queryKey: stockInKeys.lookups(),
    queryFn: async () => {
      const [orderTypesResult, channelsResult] = await Promise.allSettled([
        apiClient.get<StockInApiResponse<Array<{ key: number; value: string }>>>(
          '/KeyValue/GetJobTypeInKeyValue/Stock%20In',
        ),
        apiClient.get<StockInApiResponse<Array<{ key: number; value: string }>>>(
          '/KeyValue/GetDropdown?type=channel',
        ),
      ])

      return {
        orderTypes:
          orderTypesResult.status === 'fulfilled'
            ? mapLookup(orderTypesResult.value.dataObj)
            : [],
        channels:
          channelsResult.status === 'fulfilled'
            ? mapLookup(channelsResult.value.dataObj)
            : [],
      }
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

/**
 * Batch and mapped items for a given product (used in Loan_Receive flow)
 */
export function useStockInBatchAndMappedItems(productId: number | undefined) {
  return useQuery({
    queryKey: stockInKeys.batchAndMappedItems(productId ?? 0),
    queryFn: async () => {
      try {
        const response = await apiClient.get<
          StockInApiResponse<{
            data: {
              batchList: Array<{ key: number; value: string }>
              mappedItems: Array<{ key: number; value: string }>
            }
          }>
        >(`/StockOut/GetMappedItemsAndBatchesByProduct/${productId}`)

        return {
          batchList: mapLookup(response.dataObj?.data?.batchList),
          mappedItems: mapLookup(response.dataObj?.data?.mappedItems),
        }
      } catch (error) {
        if (getErrorStatus(error) !== 404) {
          throw error
        }

        const fallbackResponse = await apiClient.get<
          StockInApiResponse<Array<{ key: number; value: string }>>
        >(`/Product/GetProductMappedProducts/${productId}`)

        return {
          batchList: [],
          mappedItems: mapLookup(fallbackResponse.dataObj),
        }
      }
    },
    enabled: !!productId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Current stock for a product at a channel (used in stock adjustment)
 */
export function useStockInCurrentStock(
  productId: number | undefined,
  channelId: number | undefined,
) {
  return useQuery({
    queryKey: stockInKeys.currentStock(productId ?? 0, channelId ?? 0),
    queryFn: () =>
      apiClient
        .get<
          StockInApiResponse<
            Array<{
              productId?: number | null
              currentQty?: number | null
              currentStock?: number | null
              quantity?: number | null
            }>
          >
        >(
          `/Stock/GetCurrentStock/${productId}/${channelId}`,
        )
        .then((response) => response.dataObj ?? []),
    enabled: !!productId && !!channelId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

// ── Mutation Hooks ────────────────────────────────────────────

export function useCreateStockIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateStockInPayload) =>
      apiClient.post<StockInApiResponse<{ siSystemId: number }>>('/StockIn/CreateStockInOrder', payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: stockInKeys.lists() })
    },
    retry: false,
  })
}

export function useUpdateStockIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateStockInPayload) =>
      apiClient.put<StockInApiResponse<unknown>>('/StockIn/UpdateStockInOrder', payload),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: stockInKeys.lists() })
      void qc.invalidateQueries({
        queryKey: stockInKeys.detail(variables.stockInGeneralData.siSystemId),
      })
    },
    retry: false,
  })
}

export function useEscalateStockIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) =>
      apiClient.put<StockInApiResponse<unknown>>('/StockIn/SubmitForStockConfirmation', ids),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: stockInKeys.lists() })
    },
    retry: false,
  })
}

export function useConfirmStockInQty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, items }: { id: number; items: QuantityConfirmationItem[] }) =>
      apiClient.put<StockInApiResponse<unknown>>(
        `/StockIn/ConfirmReceivedStock/${id}`,
        items,
      ),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: stockInKeys.lists() })
      void qc.invalidateQueries({ queryKey: stockInKeys.detail(variables.id) })
    },
    retry: false,
  })
}

export function useRevertStockIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ siSystemId, items }: { siSystemId: number; items: RevertItem[] }) =>
      apiClient.put<StockInApiResponse<unknown>>(
        `/StockIn/RevertReceivedStock/${siSystemId}`,
        items,
      ),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: stockInKeys.lists() })
      void qc.invalidateQueries({ queryKey: stockInKeys.detail(variables.siSystemId) })
    },
    retry: false,
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: StockAdjustmentPayload) =>
      apiClient.post<StockInApiResponse<unknown>>('/StockIn/AdjustStock', payload),
    onSuccess: () => {
      // Adjustment doesn't affect stock-in lists directly, but invalidate for safety
      void qc.invalidateQueries({ queryKey: stockInKeys.lists() })
    },
    retry: false,
  })
}
