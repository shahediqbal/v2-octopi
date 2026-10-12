import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStockInBatch } from '@/hooks/useStockInBatch'
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

describe('useStockInBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends zero values for all-data filters to the updated endpoint', async () => {
    mockedApiClient.get.mockResolvedValue({ dataObj: [] })
    const queryClient = createQueryClient()

    const { result } = renderHook(
      () =>
        useStockInBatch(
          {
            supplierId: 0,
            productId: 0,
            customerId: 0,
            startDate: '2026-05-01',
            endDate: '2026-05-16',
          },
          true,
        ),
      { wrapper: createWrapper(queryClient) },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/Report/GetAllStockInBatchReport?supplierId=0&productId=0&customerId=0&startDate=2026-05-01&endDate=2026-05-16',
    )
    expect(result.current.data).toEqual([])
  })

  it('supports mixed supplier, product, and customer filter combinations', async () => {
    mockedApiClient.get.mockResolvedValue({ dataObj: [] })
    const queryClient = createQueryClient()

    renderHook(
      () =>
        useStockInBatch(
          {
            supplierId: 9,
            productId: 13,
            customerId: 11,
            startDate: '2026-05-01',
            endDate: '2026-05-16',
          },
          true,
        ),
      { wrapper: createWrapper(queryClient) },
    )

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/Report/GetAllStockInBatchReport?supplierId=9&productId=13&customerId=11&startDate=2026-05-01&endDate=2026-05-16',
      )
    })
  })
})