import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  ListMode,
  StockOutApiResponse,
  StockOutBatchLookup,
  StockOutCategoryOption,
  StockOutCurrentStockItem,
  StockOutCustomerCredit,
  StockOutCustomerLastPayment,
  StockOutJobSearchResult,
  StockOutLatestBatchMap,
  StockOutListFilters,
  StockOutListRow,
  StockOutLookupOption,
  StockOutMutationPayload,
  StockOutOrderDetail,
  StockOutPendingPopupItem,
  StockOutPackagingDetail,
  StockOutPackagingPayloadItem,
  StockOutSampleProduct,
  StockOutStatusUpdatePayload,
  StockOutPriceSummaryItem,
} from '@/types/stockOut'

function mapLookup(items: Array<{ key: number; value: string }> | null | undefined): StockOutLookupOption[] {
  return (items ?? [])
    .map((item) => {
      const lookupItem = item as {
        id?: number | null
        label?: string | null
        key?: number | null
        value?: string | null
      }

      return {
        id: Number(lookupItem.key ?? lookupItem.id),
        label: String(lookupItem.value ?? lookupItem.label ?? ''),
      }
    })
    .filter((item) => Number.isFinite(item.id) && item.label.length > 0)
}

function mapBatchLookup(
  items:
    | Array<{
        batchId?: number | null
        batchNo?: string | null
        batchExpiryRemainInDays?: number | null
        id?: number | null
        label?: string | null
        key?: number | null
        value?: string | null
      }>
    | null
    | undefined,
): StockOutLookupOption[] {
  return (items ?? [])
    .map((item) => {
      const id = Number(item.batchId ?? item.key ?? item.id)
      const batchNo = String(item.batchNo ?? item.value ?? item.label ?? '')
      const remainingDays = item.batchExpiryRemainInDays
      const label =
        batchNo.length > 0 && remainingDays != null
          ? `${batchNo}-${remainingDays}d`
          : batchNo

      return { id, label }
    })
    .filter((item) => Number.isFinite(item.id) && item.label.length > 0)
}

function normalizeLatestBatchMap(
  data: StockOutLatestBatchMap | null | undefined,
): StockOutLatestBatchMap | null {
  if (!data) return null

  const lastBatch =
    data.lastBatch ??
    (data.batchNo != null || data.maxInvoiceDate != null
      ? {
          batchNo: data.batchNo ?? null,
          maxInvoiceDate: data.maxInvoiceDate ?? null,
        }
      : null)

  const lastMapProduct =
    data.lastMapProduct ??
    (data.mappedProductName != null || data.mapProduct != null || data.invoiceDate != null
      ? {
          mapProduct: data.mapProduct ?? data.mappedProductName ?? null,
          invoiceDate: data.invoiceDate ?? null,
        }
      : null)

  return {
    ...data,
    lastBatch,
    lastMapProduct,
    batchNo: lastBatch?.batchNo ?? data.batchNo ?? null,
    mappedProductName: lastMapProduct?.mapProduct ?? data.mappedProductName ?? data.mapProduct ?? null,
    maxInvoiceDate: lastBatch?.maxInvoiceDate ?? data.maxInvoiceDate ?? null,
    invoiceDate: lastMapProduct?.invoiceDate ?? data.invoiceDate ?? null,
  }
}

function mapPackTypeLookup(
  items: Array<{ packId?: number | null; packTypeName?: string | null; key?: number | null; value?: string | null }> | null | undefined,
): StockOutLookupOption[] {
  return (items ?? [])
    .map((item) => ({
      id: Number(item.packId ?? item.key),
      label: String(item.packTypeName ?? item.value ?? ''),
    }))
    .filter((item) => Number.isFinite(item.id) && item.label.length > 0)
}

function serializeCustomerId(customerId: number | null | undefined): string {
  return customerId == null ? '0' : String(customerId)
}

function buildStockOutListUrl(mode: ListMode, filters: StockOutListFilters): string {
  const startDate = filters.startDate ?? ''
  const endDate = filters.endDate ?? ''
  const customerId = serializeCustomerId(filters.customerId)
  const hasCustomerFilter = filters.customerId != null
  const status = filters.status ?? '0'

  switch (mode) {
    case 'admin-general':
    case 'admin-limited-edit':
      return `/StockOut/StockOutAdminEidtGridData?startDate=${startDate}&endDate=${endDate}&customerId=${customerId}`
    case 'admin-pending-price':
      return '/StockOut/GetSoPendingPriceGrid'
    case 'escalation':
    case 'packaging':
    case 'package-done':
    case 'standard': {
      if (startDate || endDate || hasCustomerFilter) {
        return `/StockOut/StockOutPrintReportGridData?currentStatus=${status}&startDate=${startDate}&endDate=${endDate}&customerId=${customerId}`
      }

      return `/StockOut/StockOutOrderGridData/${status}`
    }
    default:
      return `/StockOut/StockOutOrderGridData/${status}`
  }
}

export const stockOutKeys = {
  all: ['stockOut'] as const,
  lists: () => [...stockOutKeys.all, 'list'] as const,
  list: (mode: ListMode, filters: StockOutListFilters) => [...stockOutKeys.all, 'list', mode, filters] as const,
  pendingGrids: () => [...stockOutKeys.all, 'pending-grid'] as const,
  pendingGrid: (filters: StockOutListFilters) => [...stockOutKeys.all, 'pending-grid', filters] as const,
  details: () => [...stockOutKeys.all, 'detail'] as const,
  detail: (id: number) => [...stockOutKeys.all, 'detail', id] as const,
  packaging: (id: number) => [...stockOutKeys.all, 'packaging', id] as const,
  pendingPopups: () => [...stockOutKeys.all, 'pending-popup'] as const,
  pendingPopup: (id: number) => [...stockOutKeys.all, 'pending-popup', id] as const,
  lookups: () => [...stockOutKeys.all, 'lookups'] as const,
  pendingStatuses: (status: number | string) => [...stockOutKeys.all, 'pending-statuses', status] as const,
  batches: (productId: number) => [...stockOutKeys.all, 'batches', productId] as const,
  latestBatch: (customerId: number, productId: number) => [...stockOutKeys.all, 'latest-batch', customerId, productId] as const,
  jobSearch: (query: string) => [...stockOutKeys.all, 'job-search', query] as const,
  statuses: () => [...stockOutKeys.all, 'status'] as const,
  status: (filters: StockOutListFilters) => [...stockOutKeys.all, 'status', filters] as const,
  currentStocks: () => [...stockOutKeys.all, 'current-stock'] as const,
  currentStock: (productId: number, channelId: number) => [...stockOutKeys.all, 'current-stock', productId, channelId] as const,
  customerCredit: (customerId: number) => [...stockOutKeys.all, 'customer-credit', customerId] as const,
  customerLastPayment: (customerId: number) => [...stockOutKeys.all, 'customer-last-payment', customerId] as const,
  priceSummary: (customerId: number, productId: number) => [...stockOutKeys.all, 'price-summary', customerId, productId] as const,
  categories: () => [...stockOutKeys.all, 'categories'] as const,
  samplesByCategory: (categoryId: number) => [...stockOutKeys.all, 'samples-by-category', categoryId] as const,
}

export function useStockOutList(mode: ListMode, filters: StockOutListFilters) {
  return useQuery({
    queryKey: stockOutKeys.list(mode, filters),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<StockOutListRow[]>>(buildStockOutListUrl(mode, filters))
        .then((response) => response.dataObj ?? []),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useStockOutPendingGrid(filters: StockOutListFilters) {
  return useQuery({
    queryKey: stockOutKeys.pendingGrid(filters),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<StockOutListRow[]>>(
          `/StockOut/SoAllPendingGrid?startDate=${filters.startDate ?? ''}&endDate=${filters.endDate ?? ''}&customerId=${serializeCustomerId(filters.customerId)}`,
        )
        .then((response) => response.dataObj ?? []),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useStockOutDetail(id: number | undefined) {
  return useQuery({
    queryKey: stockOutKeys.detail(id ?? 0),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<StockOutOrderDetail>>(`/StockOut/GetStockOutOrderDetails/${id}`)
        .then((response) => response.dataObj),
    enabled: !!id,
  })
}

export function usePackagingDetail(id: number | undefined) {
  return useQuery({
    queryKey: stockOutKeys.packaging(id ?? 0),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<StockOutPackagingDetail>>(`/StockOut/GetPackagingInfo/${id}`)
        .then((response) => response.dataObj),
    enabled: !!id,
  })
}

export function useStockOutPendingPopup(id: number | undefined) {
  return useQuery({
    queryKey: stockOutKeys.pendingPopup(id ?? 0),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<StockOutPendingPopupItem[]>>(`/StockOut/GetSoPendingByInvoicePopUp?soSystemId=${id}`)
        .then((response) => response.dataObj?.[0] ?? null),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useStockOutLookups() {
  return useQuery({
    queryKey: stockOutKeys.lookups(),
    queryFn: async () => {
      const [orderTypesResult, orderSourcesResult, packTypesResult] = await Promise.allSettled([
        apiClient.get<StockOutApiResponse<Array<{ key: number; value: string }>>>('/KeyValue/GetJobTypeInKeyValue/Stock%20Out'),
        apiClient.get<StockOutApiResponse<Array<{ key: number; value: string }>>>('/KeyValue/GetOrderFromInKeyValue'),
        apiClient.get<StockOutApiResponse<Array<{ packId?: number; packTypeName?: string; key?: number; value?: string }>>>('/Product/GetPackType'),
      ])

      return {
        orderTypes: orderTypesResult.status === 'fulfilled' ? mapLookup(orderTypesResult.value.dataObj) : [],
        orderSources: orderSourcesResult.status === 'fulfilled' ? mapLookup(orderSourcesResult.value.dataObj) : [],
        packTypes: packTypesResult.status === 'fulfilled' ? mapPackTypeLookup(packTypesResult.value.dataObj) : [],
      }
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useStockOutPendingStatuses(status: number | string = 0) {
  return useQuery({
    queryKey: stockOutKeys.pendingStatuses(status),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<Array<{ key: number; value: string }>>>(`/KeyValue/GetLifecyclesInKeyValue/stock_out/${status}`)
        .then((response) => mapLookup(response.dataObj)),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useCurrentStock(productId: number | undefined, channelId: number | undefined) {
  return useQuery({
    queryKey: stockOutKeys.currentStock(productId ?? 0, channelId ?? 0),
    queryFn: () => fetchCurrentStockByProductAndChannel(productId ?? 0, channelId ?? 0),
    enabled: !!productId && !!channelId,
    staleTime: 30_000,
  })
}

export async function fetchCurrentStockByProductAndChannel(productId: number, channelId: number) {
  const response = await apiClient.get<StockOutApiResponse<StockOutCurrentStockItem[]>>(
    `/Stock/GetCurrentStock/${productId}/${channelId}`,
  )
  return response.dataObj ?? []
}

export function useStockOutBatches(productId: number | undefined) {
  return useQuery({
    queryKey: stockOutKeys.batches(productId ?? 0),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<{ data: { batchList: Array<{ key: number; value: string }>; mappedItems: Array<{ key: number; value: string }> } }>>(
          `/StockOut/GetMappedItemsAndBatchesByProduct/${productId}`,
        )
        .then((response) => ({
          finalBatch: mapBatchLookup(response.dataObj?.data?.batchList),
          finalMappedItem: mapLookup(response.dataObj?.data?.mappedItems),
        }) satisfies StockOutBatchLookup),
    enabled: !!productId,
    staleTime: 60_000,
  })
}

export function useLatestStockOutBatchMap(customerId: number | undefined, productId: number | undefined) {
  return useQuery({
    queryKey: stockOutKeys.latestBatch(customerId ?? 0, productId ?? 0),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<StockOutLatestBatchMap>>(`/StockOut/GetLastMappAndBatchByCustomerAndProduct/${customerId}/${productId}`)
        .then((response) => normalizeLatestBatchMap(response.dataObj)),
    enabled: !!customerId && !!productId,
    staleTime: 60_000,
  })
}

export function useStockOutJobSearch(searchQuery: string) {
  return useQuery({
    queryKey: stockOutKeys.jobSearch(searchQuery),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<StockOutJobSearchResult[]>>(`/StockOut/GetJobBySearch/${encodeURIComponent(searchQuery)}`)
        .then((response) => response.dataObj ?? []),
    enabled: searchQuery.trim().length > 0,
    staleTime: 30_000,
  })
}

export function useStockOutStatusList(filters: StockOutListFilters) {
  return useQuery({
    queryKey: stockOutKeys.status(filters),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<StockOutListRow[]>>(`/StockOut/SoStatusDataGrid?currentStatus=${filters.status ?? '0'}`)
        .then((response) => response.dataObj ?? []),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useCreateStockOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StockOutMutationPayload) =>
      apiClient.post<StockOutApiResponse<unknown>>('/StockOut/CreateStockOutOrder', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.lists() })
    },
  })
}

export function useUpdateStockOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StockOutMutationPayload) =>
      apiClient.put<StockOutApiResponse<unknown>>('/StockOut/UpdateStockOutOrder', payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stockOutKeys.detail(variables.stockOutGeneralData.soSystemId) })
    },
  })
}

export function useEscalateStockOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StockOutMutationPayload) =>
      apiClient.post<StockOutApiResponse<unknown>>('/StockOut/SubmitForMapItemAndBatch', payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stockOutKeys.detail(variables.stockOutGeneralData.soSystemId) })
    },
  })
}

export function useSubmitPackaging() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StockOutMutationPayload) =>
      apiClient.put<StockOutApiResponse<unknown>>('/StockOut/SubmitForPackaging', payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stockOutKeys.detail(variables.stockOutGeneralData.soSystemId) })
    },
  })
}

export function useAdminSubmitPackaging() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StockOutMutationPayload) =>
      apiClient.put<StockOutApiResponse<unknown>>('/StockOut/AdminSubmitForPackaging', payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stockOutKeys.detail(variables.stockOutGeneralData.soSystemId) })
    },
  })
}

export function useCompletePackaging() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StockOutPackagingPayloadItem[]) =>
      apiClient.post<StockOutApiResponse<unknown>>('/StockOut/SubmitPackaging', payload),
    onSuccess: (_response, variables) => {
      const firstId = variables[0]?.soSystemId
      queryClient.invalidateQueries({ queryKey: stockOutKeys.lists() })
      if (firstId) {
        queryClient.invalidateQueries({ queryKey: stockOutKeys.detail(firstId) })
        queryClient.invalidateQueries({ queryKey: stockOutKeys.packaging(firstId) })
      }
    },
  })
}

export function useRestoreInventoryForReturn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (soSystemId: number) =>
      apiClient.post<StockOutApiResponse<unknown>>(`/StockOut/RestoreInventoryForReturn/${soSystemId}`, {}),
    onSuccess: (_response, soSystemId) => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stockOutKeys.detail(soSystemId) })
      queryClient.invalidateQueries({ queryKey: stockOutKeys.packaging(soSystemId) })
      queryClient.invalidateQueries({ queryKey: stockOutKeys.statuses() })
      queryClient.invalidateQueries({ queryKey: stockOutKeys.pendingGrids() })
      queryClient.invalidateQueries({ queryKey: stockOutKeys.pendingPopups() })
    },
  })
}

export function useAdminUpdateStockOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StockOutMutationPayload) =>
      apiClient.put<StockOutApiResponse<unknown>>('/StockOut/AdminUpdateStockOutOrder', payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stockOutKeys.detail(variables.stockOutGeneralData.soSystemId) })
    },
  })
}

export function useUpdatePackaging() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StockOutPackagingPayloadItem[]) =>
      apiClient.put<StockOutApiResponse<unknown>>('/StockOut/UpdatePackaging', payload),
    onSuccess: (_response, variables) => {
      const firstId = variables[0]?.soSystemId
      queryClient.invalidateQueries({ queryKey: stockOutKeys.lists() })
      if (firstId) {
        queryClient.invalidateQueries({ queryKey: stockOutKeys.packaging(firstId) })
      }
    },
  })
}

export function useUpdateStockOutStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ soSystemId, associateCurrenStatus, remarks }: StockOutStatusUpdatePayload) =>
      apiClient.put<StockOutApiResponse<unknown>>(
        `/StockOut/UpdateStockOutAssociateCurrentStatus/${soSystemId}/${associateCurrenStatus}?soAssociateStatusRemarks=${encodeURIComponent(
          remarks ?? '',
        )}`,
        '',
      ),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stockOutKeys.detail(variables.soSystemId) })
      queryClient.invalidateQueries({ queryKey: stockOutKeys.statuses() })
      queryClient.invalidateQueries({ queryKey: stockOutKeys.pendingGrids() })
      queryClient.invalidateQueries({ queryKey: stockOutKeys.pendingPopups() })
    },
  })
}

export function useCustomerCredit(customerId: number | null | undefined) {
  const today = new Date().toISOString().slice(0, 10)
  return useQuery({
    queryKey: stockOutKeys.customerCredit(customerId ?? 0),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<StockOutCustomerCredit[]>>(
          `/Report/GetCustomerCreditSaleSummery?customerId=${customerId}&startDate=${today}&endDate=${today}`,
        )
        .then((response) => response.dataObj?.[0] ?? null),
    enabled: !!customerId,
    staleTime: 30_000,
  })
}

export function useCustomerLastPayment(customerId: number | null | undefined) {
  return useQuery({
    queryKey: stockOutKeys.customerLastPayment(customerId ?? 0),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<StockOutCustomerLastPayment[] | StockOutCustomerLastPayment | null>>(`/CustomerPayment/GetCustomerLastPayment/${customerId}`)
        .then((response) => {
          const data = response.dataObj
          if (Array.isArray(data)) return data[0] ?? null
          return data ?? null
        }),
    enabled: !!customerId,
    staleTime: 30_000,
  })
}

export function useCustomerPriceSummary(customerId: number | null | undefined, productId: number | null | undefined) {
  return useQuery({
    queryKey: stockOutKeys.priceSummary(customerId ?? 0, productId ?? 0),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<StockOutPriceSummaryItem[]>>(
          `/TallySales/GetPriceSummary?customerId=${customerId}&prodcutId=${productId}`,
        )
        .then((response) => response.dataObj ?? []),
    enabled: !!customerId && !!productId,
    staleTime: 60_000,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: stockOutKeys.categories(),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<Array<{ productCategoryId: number; productCategoryName: string }>>>('/Product/GetCategory')
        .then((response) =>
          (response.dataObj ?? []).map((item) => ({
            id: item.productCategoryId,
            label: item.productCategoryName,
          })) satisfies StockOutCategoryOption[],
        ),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useSamplesByCategory(categoryId: number | null | undefined) {
  return useQuery({
    queryKey: stockOutKeys.samplesByCategory(categoryId ?? 0),
    queryFn: () =>
      apiClient
        .get<StockOutApiResponse<StockOutSampleProduct[]>>(`/Product/GetSample/${categoryId}`)
        .then((response) => response.dataObj ?? []),
    enabled: !!categoryId,
    staleTime: 60_000,
  })
}

export function useBulkEscalate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderIds: number[]) =>
      apiClient.post<StockOutApiResponse<unknown>>('/StockOut/SubmitForMapItemAndBatch', orderIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stockOutKeys.lists() })
    },
  })
}