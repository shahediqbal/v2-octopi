import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api'
import {
  fetchCurrentStockByProductAndChannel,
  stockOutKeys,
  useAdminSubmitPackaging,
  useAdminUpdateStockOut,
  useCompletePackaging,
  useCreateStockOut,
  useCurrentStock,
  useCustomerLastPayment,
  useEscalateStockOut,
  useRestoreInventoryForReturn,
  useSubmitPackaging,
  useLatestStockOutBatchMap,
  usePackagingDetail,
  useStockOutBatches,
  useStockOutDetail,
  useStockOutList,
  useStockOutLookups,
  useStockOutPendingGrid,
  useStockOutPendingPopup,
  useStockOutPendingStatuses,
  useStockOutStatusList,
  useStockOutJobSearch,
  useUpdatePackaging,
  useUpdateStockOut,
  useUpdateStockOutStatus,
} from '@/hooks/useStockOut'
import type { ListMode, StockOutMutationPayload, StockOutPackagingPayloadItem } from '@/types/stockOut'

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedApiClient = vi.mocked(apiClient)

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const mutationPayload: StockOutMutationPayload = {
  stockOutGeneralData: {
    soSystemId: 77,
    soJobTypeId: 3,
    soOrderFromId: 4,
    soCurrentStatus: 1,
    soCustomerId: 10,
    soSupplierId: 20,
    soDestinationChannelId: 2,
    soCompanyId: 2,
    soPriceReview: 0,
    soRemarks: 'Test',
    soCustomerReferance: 'REF-1',
    soRelatedLcId: 'LC-1',
    invoiceDate: '2026-03-20',
    dateOfIssue: '2026-03-20',
  },
  stockOutItemsData: [],
  stockOutBillData: {
    calculatedBill: 0,
    billDiscountType: 'F',
    billDiscountRate: 0,
    billDiscountAmount: 0,
    billVatPercantage: 0,
    billAitPercantage: 0,
    billAdjustmentAmount: 0,
    finalBill: 0,
    sobCurrencyName: 'BDT',
    sobCurrencyConversionRate: 1,
    sobFinalConvertedBill: 0,
  },
}

const packagingPayload: StockOutPackagingPayloadItem[] = [
  {
    soSystemId: 77,
    sopProductId: 101,
    sopPackId: 31,
    packInfo: 'Carton',
    sopProductQty: 2,
    sopPackSize: 1,
    sopNoPack: 2,
  },
]

async function expectMutationFailure({
  hook,
  variables,
  mockRequest,
  expectedCall,
}: {
  hook: () => any
  variables: unknown
  mockRequest: ReturnType<typeof vi.fn>
  expectedCall: unknown[]
}) {
  const queryClient = createQueryClient()
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  const failure = new Error('API 500: Simulated failure')

  mockRequest.mockRejectedValueOnce(failure)

  const { result } = renderHook(() => hook(), {
    wrapper: createWrapper(queryClient),
  })

  await act(async () => {
    await expect(result.current.mutateAsync(variables)).rejects.toBe(failure)
  })

  await waitFor(() => expect(result.current.isError).toBe(true))

  expect(result.current.error).toBe(failure)
  expect(mockRequest).toHaveBeenCalledWith(...expectedCall)
  expect(invalidateSpy).not.toHaveBeenCalled()
}

describe('useStockOut hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the default stock-out grid endpoint for standard list mode without filters', async () => {
    mockedApiClient.get.mockResolvedValue({ dataObj: [] })
    const queryClient = createQueryClient()

    const { result } = renderHook(
      () => useStockOutList('standard', { status: '0' }),
      { wrapper: createWrapper(queryClient) },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient.get).toHaveBeenCalledWith('/StockOut/StockOutOrderGridData/0')
    expect(result.current.data).toEqual([])
  })

  it('switches to the filtered report endpoint when standard list filters are present', async () => {
    mockedApiClient.get.mockResolvedValue({ dataObj: [] })
    const queryClient = createQueryClient()

    renderHook(
      () =>
        useStockOutList('standard', {
          status: '2',
          startDate: '2026-03-01',
          endDate: '2026-03-10',
          customerId: 55,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/StockOut/StockOutPrintReportGridData?currentStatus=2&startDate=2026-03-01&endDate=2026-03-10&customerId=55',
      )
    })
  })

  it('uses admin-specific list endpoints by mode', async () => {
    mockedApiClient.get.mockResolvedValue({ dataObj: [] })
    const queryClient = createQueryClient()

    const { rerender } = renderHook(
      ({ mode }: { mode: ListMode }) =>
        useStockOutList(mode, { status: '3', startDate: '2026-03-01', endDate: '2026-03-10', customerId: 90 }),
      {
        initialProps: { mode: 'admin-general' as ListMode },
        wrapper: createWrapper(queryClient),
      },
    )

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/StockOut/StockOutAdminEidtGridData?startDate=2026-03-01&endDate=2026-03-10&customerId=90',
      )
    })

    rerender({ mode: 'admin-pending-price' as ListMode })

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith('/StockOut/GetSoPendingPriceGrid')
    })
  })

  it('serializes empty customer filters as zero for backend filtered endpoints', async () => {
    mockedApiClient.get.mockResolvedValue({ dataObj: [] })
    const queryClient = createQueryClient()

    renderHook(
      () =>
        useStockOutList('package-done', {
          status: '3',
          startDate: '2026-03-01',
          endDate: '2026-03-10',
          customerId: null,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/StockOut/StockOutPrintReportGridData?currentStatus=3&startDate=2026-03-01&endDate=2026-03-10&customerId=0',
      )
    })

    mockedApiClient.get.mockClear()

    renderHook(
      () =>
        useStockOutPendingGrid({
          status: '0',
          startDate: '2026-03-01',
          endDate: '2026-03-10',
          customerId: null,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/StockOut/SoAllPendingGrid?startDate=2026-03-01&endDate=2026-03-10&customerId=0',
      )
    })
  })

  it('loads pending grids and status grids from their dedicated endpoints', async () => {
    mockedApiClient.get.mockResolvedValue({ dataObj: [] })
    const queryClient = createQueryClient()

    renderHook(
      () =>
        useStockOutPendingGrid({
          status: '0',
          startDate: '2026-03-01',
          endDate: '2026-03-10',
          customerId: 90,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/StockOut/SoAllPendingGrid?startDate=2026-03-01&endDate=2026-03-10&customerId=90',
      )
    })

    renderHook(() => useStockOutStatusList({ status: '2' }), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith('/StockOut/SoStatusDataGrid?currentStatus=2')
    })
  })

  it('loads detail and packaging detail only when an id is provided', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ dataObj: { stockOutGeneralData: { soSystemId: 77 } } })
    mockedApiClient.get.mockResolvedValueOnce({ dataObj: { soSystemId: 77, stockOutPackagingItems: [] } })
    const queryClient = createQueryClient()

    const { result: detailResult } = renderHook(() => useStockOutDetail(77), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(detailResult.current.isSuccess).toBe(true))
    expect(mockedApiClient.get).toHaveBeenCalledWith('/StockOut/GetStockOutOrderDetails/77')

    const { result: packagingResult } = renderHook(() => usePackagingDetail(77), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(packagingResult.current.isSuccess).toBe(true))
    expect(mockedApiClient.get).toHaveBeenCalledWith('/StockOut/GetPackagingInfo/77')

    mockedApiClient.get.mockClear()

    renderHook(() => useStockOutDetail(undefined), {
      wrapper: createWrapper(createQueryClient()),
    })
    renderHook(() => usePackagingDetail(undefined), {
      wrapper: createWrapper(createQueryClient()),
    })

    expect(mockedApiClient.get).not.toHaveBeenCalled()
  })

  it('loads pending popup, lookup data, pending statuses, and batches with mapped dropdown shapes', async () => {
    mockedApiClient.get
      .mockResolvedValueOnce({ dataObj: [{ soSystemId: 77, soSystemPending: 'Pending Review' }] })
      .mockResolvedValueOnce({ dataObj: [{ key: 1, value: 'Sales' }] })
      .mockResolvedValueOnce({ dataObj: [{ key: 2, value: 'Online' }] })
      .mockResolvedValueOnce({ dataObj: [{ packId: 3, packTypeName: 'Carton' }] })
      .mockResolvedValueOnce({ dataObj: [{ key: 4, value: 'Approved' }] })
      .mockResolvedValueOnce({
        dataObj: {
          data: {
            batchList: [{ batchId: 10, batchNo: 'B-10', batchExpiryRemainInDays: 5 }],
            mappedItems: [{ key: 20, value: 'Mapped Product' }],
          },
        },
      })

    const queryClient = createQueryClient()

    const { result: popupResult } = renderHook(() => useStockOutPendingPopup(77), {
      wrapper: createWrapper(queryClient),
    })
    await waitFor(() => expect(popupResult.current.isSuccess).toBe(true))
    expect(popupResult.current.data).toMatchObject({ soSystemId: 77, soSystemPending: 'Pending Review' })

    const { result: lookupResult } = renderHook(() => useStockOutLookups(), {
      wrapper: createWrapper(queryClient),
    })
    await waitFor(() => expect(lookupResult.current.isSuccess).toBe(true))
    expect(lookupResult.current.data).toEqual({
      orderTypes: [{ id: 1, label: 'Sales' }],
      orderSources: [{ id: 2, label: 'Online' }],
      packTypes: [{ id: 3, label: 'Carton' }],
    })

    const { result: statusesResult } = renderHook(() => useStockOutPendingStatuses(2), {
      wrapper: createWrapper(queryClient),
    })
    await waitFor(() => expect(statusesResult.current.isSuccess).toBe(true))
    expect(statusesResult.current.data).toEqual([{ id: 4, label: 'Approved' }])

    const { result: batchesResult } = renderHook(() => useStockOutBatches(101), {
      wrapper: createWrapper(queryClient),
    })
    await waitFor(() => expect(batchesResult.current.isSuccess).toBe(true))
    expect(batchesResult.current.data).toEqual({
      finalBatch: [{ id: 10, label: 'B-10-5d' }],
      finalMappedItem: [{ id: 20, label: 'Mapped Product' }],
    })
  })

  it('loads latest batch map, job search, and current stock only when required inputs exist', async () => {
    mockedApiClient.get
      .mockResolvedValueOnce({
        dataObj: {
          lastBatch: { batchNo: 'B-200', maxInvoiceDate: '2026-03-14T00:00:00Z' },
          lastMapProduct: { mapProduct: 'Mapped Product', invoiceDate: '2026-03-15T00:00:00Z' },
        },
      })
      .mockResolvedValueOnce({ dataObj: [{ soSystemId: 88, soSystemNo: 'SO-88' }] })
      .mockResolvedValueOnce({ dataObj: [{ currentQty: 44 }] })
      .mockResolvedValueOnce({ dataObj: [{ currentQty: 45 }] })

    const queryClient = createQueryClient()

    const { result: latestBatchResult } = renderHook(() => useLatestStockOutBatchMap(10, 101), {
      wrapper: createWrapper(queryClient),
    })
    await waitFor(() => expect(latestBatchResult.current.isSuccess).toBe(true))
    expect(mockedApiClient.get).toHaveBeenCalledWith('/StockOut/GetLastMappAndBatchByCustomerAndProduct/10/101')
    expect(latestBatchResult.current.data).toEqual({
      lastBatch: { batchNo: 'B-200', maxInvoiceDate: '2026-03-14T00:00:00Z' },
      lastMapProduct: { mapProduct: 'Mapped Product', invoiceDate: '2026-03-15T00:00:00Z' },
      batchNo: 'B-200',
      mappedProductName: 'Mapped Product',
      maxInvoiceDate: '2026-03-14T00:00:00Z',
      invoiceDate: '2026-03-15T00:00:00Z',
    })

    const { result: jobSearchResult } = renderHook(() => useStockOutJobSearch('SO-88'), {
      wrapper: createWrapper(queryClient),
    })
    await waitFor(() => expect(jobSearchResult.current.isSuccess).toBe(true))
    expect(mockedApiClient.get).toHaveBeenCalledWith('/StockOut/GetJobBySearch/SO-88')
    expect(jobSearchResult.current.data).toEqual([{ soSystemId: 88, soSystemNo: 'SO-88' }])

    const { result: currentStockResult } = renderHook(() => useCurrentStock(101, 2), {
      wrapper: createWrapper(queryClient),
    })
    await waitFor(() => expect(currentStockResult.current.isSuccess).toBe(true))
    expect(mockedApiClient.get).toHaveBeenCalledWith('/Stock/GetCurrentStock/101/2')
    expect(currentStockResult.current.data).toEqual([{ currentQty: 44 }])

    const fetchedCurrentStock = await fetchCurrentStockByProductAndChannel(202, 3)
    expect(mockedApiClient.get).toHaveBeenCalledWith('/Stock/GetCurrentStock/202/3')
    expect(fetchedCurrentStock).toEqual([{ currentQty: 45 }])

    mockedApiClient.get.mockClear()

    renderHook(() => useLatestStockOutBatchMap(undefined, 101), {
      wrapper: createWrapper(createQueryClient()),
    })
    renderHook(() => useStockOutJobSearch('   '), {
      wrapper: createWrapper(createQueryClient()),
    })
    renderHook(() => useCurrentStock(undefined, 2), {
      wrapper: createWrapper(createQueryClient()),
    })

    expect(mockedApiClient.get).not.toHaveBeenCalled()
  })

  it('normalizes the customer last-payment endpoint when the backend returns an array', async () => {
    mockedApiClient.get.mockResolvedValue({
      dataObj: [
        {
          paymentSystemId: 14398,
          paymentCustomerId: null,
          customerName: 'Radission Washing Plant',
          customerAddress: null,
          paymentAmount: 800725,
          paymentDate: null,
        },
      ],
    })

    const queryClient = createQueryClient()

    const { result } = renderHook(() => useCustomerLastPayment(706), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient.get).toHaveBeenCalledWith('/CustomerPayment/GetCustomerLastPayment/706')
    expect(result.current.data).toMatchObject({
      paymentSystemId: 14398,
      paymentAmount: 800725,
      customerName: 'Radission Washing Plant',
    })
  })

  it('invalidates list and detail keys after updating a stock-out order', async () => {
    mockedApiClient.put.mockResolvedValue({ dataObj: null })
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateStockOut(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(mutationPayload)
    })

    expect(mockedApiClient.put).toHaveBeenCalledWith('/StockOut/UpdateStockOutOrder', mutationPayload)
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: stockOutKeys.lists() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: stockOutKeys.detail(77) })
  })

  it('invalidates list keys after creating a stock-out order', async () => {
    mockedApiClient.post.mockResolvedValue({ dataObj: null })
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateStockOut(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(mutationPayload)
    })

    expect(mockedApiClient.post).toHaveBeenCalledWith('/StockOut/CreateStockOutOrder', mutationPayload)
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: stockOutKeys.lists() })
  })

  it('invalidates list and detail keys after escalation and packaging submit flows', async () => {
    mockedApiClient.post.mockResolvedValue({ dataObj: null })
    mockedApiClient.put.mockResolvedValue({ dataObj: null })
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result: escalateResult } = renderHook(() => useEscalateStockOut(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await escalateResult.current.mutateAsync(mutationPayload)
    })

    expect(mockedApiClient.post).toHaveBeenCalledWith('/StockOut/SubmitForMapItemAndBatch', mutationPayload)
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: stockOutKeys.lists() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: stockOutKeys.detail(77) })

    invalidateSpy.mockClear()

    const { result: packagingResult } = renderHook(() => useSubmitPackaging(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await packagingResult.current.mutateAsync(mutationPayload)
    })

    expect(mockedApiClient.put).toHaveBeenCalledWith('/StockOut/SubmitForPackaging', mutationPayload)
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: stockOutKeys.lists() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: stockOutKeys.detail(77) })
  })

  it('uses the admin mutation endpoints and invalidates standard caches too', async () => {
    mockedApiClient.put.mockResolvedValue({ dataObj: null })
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result: adminUpdateResult } = renderHook(() => useAdminUpdateStockOut(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await adminUpdateResult.current.mutateAsync(mutationPayload)
    })

    expect(mockedApiClient.put).toHaveBeenCalledWith('/StockOut/AdminUpdateStockOutOrder', mutationPayload)
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: stockOutKeys.lists() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: stockOutKeys.detail(77) })

    invalidateSpy.mockClear()

    const { result: adminPackagingResult } = renderHook(() => useAdminSubmitPackaging(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await adminPackagingResult.current.mutateAsync(mutationPayload)
    })

    expect(mockedApiClient.put).toHaveBeenCalledWith('/StockOut/AdminSubmitForPackaging', mutationPayload)
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: stockOutKeys.lists() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: stockOutKeys.detail(77) })
  })

  it('invalidates list, detail, and packaging keys after completing packaging', async () => {
    mockedApiClient.post.mockResolvedValue({ dataObj: null })
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCompletePackaging(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(packagingPayload)
    })

    expect(mockedApiClient.post).toHaveBeenCalledWith('/StockOut/SubmitPackaging', packagingPayload)
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: stockOutKeys.lists() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: stockOutKeys.detail(77) })
    expect(invalidateSpy).toHaveBeenNthCalledWith(3, { queryKey: stockOutKeys.packaging(77) })
  })

  it('encodes remarks and invalidates all operational keys after status updates', async () => {
    mockedApiClient.put.mockResolvedValue({ dataObj: null })
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateStockOutStatus(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({
        soSystemId: 77,
        associateCurrenStatus: 5,
        remarks: 'Need QA / hold',
      })
    })

    expect(mockedApiClient.put).toHaveBeenCalledWith(
      '/StockOut/UpdateStockOutAssociateCurrentStatus/77/5?soAssociateStatusRemarks=Need%20QA%20%2F%20hold',
      '',
    )
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: stockOutKeys.lists() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: stockOutKeys.detail(77) })
    expect(invalidateSpy).toHaveBeenNthCalledWith(3, { queryKey: stockOutKeys.statuses() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(4, { queryKey: stockOutKeys.pendingGrids() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(5, { queryKey: stockOutKeys.pendingPopups() })
  })

  it('updates packaging and only invalidates list plus packaging detail keys', async () => {
    mockedApiClient.put.mockResolvedValue({ dataObj: null })
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdatePackaging(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(packagingPayload)
    })

    expect(mockedApiClient.put).toHaveBeenCalledWith('/StockOut/UpdatePackaging', packagingPayload)
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: stockOutKeys.lists() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: stockOutKeys.packaging(77) })
  })

  it('restores return inventory and invalidates list, detail, packaging, and operational query groups', async () => {
    mockedApiClient.post.mockResolvedValue({ dataObj: null })
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useRestoreInventoryForReturn(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(77)
    })

    expect(mockedApiClient.post).toHaveBeenCalledWith('/StockOut/RestoreInventoryForReturn/77', {})
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: stockOutKeys.lists() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: stockOutKeys.detail(77) })
    expect(invalidateSpy).toHaveBeenNthCalledWith(3, { queryKey: stockOutKeys.packaging(77) })
    expect(invalidateSpy).toHaveBeenNthCalledWith(4, { queryKey: stockOutKeys.statuses() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(5, { queryKey: stockOutKeys.pendingGrids() })
    expect(invalidateSpy).toHaveBeenNthCalledWith(6, { queryKey: stockOutKeys.pendingPopups() })
  })

  it.each([
    {
      name: 'create stock-out',
      hook: useCreateStockOut,
      variables: mutationPayload,
      mockRequest: mockedApiClient.post,
      expectedCall: ['/StockOut/CreateStockOutOrder', mutationPayload],
    },
    {
      name: 'update stock-out',
      hook: useUpdateStockOut,
      variables: mutationPayload,
      mockRequest: mockedApiClient.put,
      expectedCall: ['/StockOut/UpdateStockOutOrder', mutationPayload],
    },
    {
      name: 'escalate stock-out',
      hook: useEscalateStockOut,
      variables: mutationPayload,
      mockRequest: mockedApiClient.post,
      expectedCall: ['/StockOut/SubmitForMapItemAndBatch', mutationPayload],
    },
    {
      name: 'submit packaging',
      hook: useSubmitPackaging,
      variables: mutationPayload,
      mockRequest: mockedApiClient.put,
      expectedCall: ['/StockOut/SubmitForPackaging', mutationPayload],
    },
    {
      name: 'admin submit packaging',
      hook: useAdminSubmitPackaging,
      variables: mutationPayload,
      mockRequest: mockedApiClient.put,
      expectedCall: ['/StockOut/AdminSubmitForPackaging', mutationPayload],
    },
    {
      name: 'complete packaging',
      hook: useCompletePackaging,
      variables: packagingPayload,
      mockRequest: mockedApiClient.post,
      expectedCall: ['/StockOut/SubmitPackaging', packagingPayload],
    },
    {
      name: 'admin update stock-out',
      hook: useAdminUpdateStockOut,
      variables: mutationPayload,
      mockRequest: mockedApiClient.put,
      expectedCall: ['/StockOut/AdminUpdateStockOutOrder', mutationPayload],
    },
    {
      name: 'update packaging',
      hook: useUpdatePackaging,
      variables: packagingPayload,
      mockRequest: mockedApiClient.put,
      expectedCall: ['/StockOut/UpdatePackaging', packagingPayload],
    },
    {
      name: 'update stock-out status',
      hook: useUpdateStockOutStatus,
      variables: {
        soSystemId: 77,
        associateCurrenStatus: 5,
        remarks: 'Need QA / hold',
      },
      mockRequest: mockedApiClient.put,
      expectedCall: [
        '/StockOut/UpdateStockOutAssociateCurrentStatus/77/5?soAssociateStatusRemarks=Need%20QA%20%2F%20hold',
        '',
      ],
    },
    {
      name: 'restore inventory for return',
      hook: useRestoreInventoryForReturn,
      variables: 77,
      mockRequest: mockedApiClient.post,
      expectedCall: ['/StockOut/RestoreInventoryForReturn/77', {}],
    },
  ])('does not invalidate cached data when $name fails', async ({ hook, variables, mockRequest, expectedCall }) => {
    await expectMutationFailure({
      hook,
      variables,
      mockRequest,
      expectedCall,
    })
  })
})