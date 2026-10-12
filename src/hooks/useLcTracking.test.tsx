import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api'
import { lcKeys, useCreateLc } from '@/hooks/useLcTracking'
import type { CreateLcPayload } from '@/types/lcTracking'

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

describe('useLcTracking create mutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('posts issuer bank and branch location IDs using the backend DTO field names', async () => {
    mockedApiClient.post.mockResolvedValue({})

    const payload: CreateLcPayload = {
      piSystemId: 168,
      lcNumber: 'LC-168',
      lcAmount: 5000.25,
      lcDate: '2026-05-14',
      lcIssuerBankId: 17,
      lcIssuerBranchLocationId: 9,
    }

    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateLc(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(payload)
    })

    expect(mockedApiClient.post).toHaveBeenCalledTimes(1)
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/LCTracking/CratreLCDocAndPayments',
      payload,
    )

    const postedPayload = mockedApiClient.post.mock.calls[0]?.[1] as Record<string, unknown>
    expect(postedPayload).not.toHaveProperty('chequeBankId')
    expect(postedPayload).not.toHaveProperty('locationId')

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: lcKeys.piByStatus(1) })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: lcKeys.piList() })
    })
  })
})