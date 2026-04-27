import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStockInBatchAndMappedItems } from '@/hooks/useStockIn'
import { apiClient } from '@/lib/api'

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

describe('useStockInBatchAndMappedItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('falls back to the product mapped-products endpoint when the stock-out endpoint returns 404', async () => {
    const queryClient = createQueryClient()
    mockedApiClient.get
      .mockRejectedValueOnce({ status: 404, body: { errMsg: 'Not Found' } })
      .mockResolvedValueOnce({
        dataObj: [{ key: 88, value: 'Mapped Product 88' }],
      })

    const { result } = renderHook(() => useStockInBatchAndMappedItems(123), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient.get).toHaveBeenNthCalledWith(
      1,
      '/StockOut/GetMappedItemsAndBatchesByProduct/123',
    )
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(
      2,
      '/Product/GetProductMappedProducts/123',
    )
    expect(result.current.data).toEqual({
      batchList: [],
      mappedItems: [{ id: 88, label: 'Mapped Product 88' }],
    })
  })
})