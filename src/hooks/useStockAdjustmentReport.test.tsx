import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api'
import { useStockAdjustmentReport } from '@/hooks/useStockAdjustmentReport'

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
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useStockAdjustmentReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls the all-records endpoint when productId is 0', async () => {
    mockedApiClient.get.mockResolvedValue({ dataObj: [] })
    const queryClient = createQueryClient()

    const { result } = renderHook(() => useStockAdjustmentReport(0, true), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient.get).toHaveBeenCalledWith('/StockIn/GetStockAdjustmentDetails/0')
    expect(result.current.data).toEqual([])
  })

  it('calls the product-filtered endpoint when a product is selected', async () => {
    mockedApiClient.get.mockResolvedValue({ dataObj: [] })
    const queryClient = createQueryClient()

    renderHook(() => useStockAdjustmentReport(55, true), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith('/StockIn/GetStockAdjustmentDetails/55')
    })
  })
})