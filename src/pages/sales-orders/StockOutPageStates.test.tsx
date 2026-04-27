import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateSalesOrderPage } from '@/pages/sales-orders/CreateSalesOrderPage'
import { EditSalesOrderPage } from '@/pages/sales-orders/EditSalesOrderPage'
import { PackageSalesOrderPage } from '@/pages/sales-orders/PackageSalesOrderPage'

const hookState = vi.hoisted(() => ({
  useCreateStockOut: vi.fn(),
  useStockOutDetail: vi.fn(),
  usePackagingDetail: vi.fn(),
  useStockOutLookups: vi.fn(),
  useUpdateStockOut: vi.fn(),
  useAdminUpdateStockOut: vi.fn(),
  useAdminSubmitPackaging: vi.fn(),
  useUpdatePackaging: vi.fn(),
  useEscalateStockOut: vi.fn(),
  useCompletePackaging: vi.fn(),
}))

vi.mock('@/hooks/useStockOut', () => ({
  useCreateStockOut: hookState.useCreateStockOut,
  useStockOutDetail: hookState.useStockOutDetail,
  usePackagingDetail: hookState.usePackagingDetail,
  useStockOutLookups: hookState.useStockOutLookups,
  useUpdateStockOut: hookState.useUpdateStockOut,
  useAdminUpdateStockOut: hookState.useAdminUpdateStockOut,
  useAdminSubmitPackaging: hookState.useAdminSubmitPackaging,
  useUpdatePackaging: hookState.useUpdatePackaging,
  useEscalateStockOut: hookState.useEscalateStockOut,
  useCompletePackaging: hookState.useCompletePackaging,
  useStockOutBatches: vi.fn(() => ({ data: undefined, isLoading: false })),
  useLatestStockOutBatchMap: vi.fn(() => ({ data: undefined })),
}))

vi.mock('@/pages/sales-orders/SalesOrderForm', () => ({
  SalesOrderForm: ({ onSubmit, serverError }: { onSubmit: (values: unknown) => void; serverError?: string }) => (
    <div>
      <button type="button" onClick={() => onSubmit({})}>SubmitForm</button>
      {serverError ? <div>{serverError}</div> : null}
    </div>
  ),
}))

vi.mock('@/pages/sales-orders/PackagingItemTable', () => ({
  PackagingItemTable: ({ rows }: { rows: unknown[] }) => <div>{`PackagingRows:${rows.length}`}</div>,
}))

vi.mock('@/pages/sales-orders/stockOutMappers', () => ({
  extractApiErrorMessage: (error: unknown) => (error instanceof Error ? error.message : 'Unknown error'),
  extractApiResponseErrorMessage: (response: { errMsg?: string; title?: string; errors?: Record<string, string[] | undefined> | null }) => {
    if (response?.errMsg) return response.errMsg
    const validationMessage = Object.values(response?.errors ?? {}).flatMap((messages) => messages ?? [])[0]
    if (validationMessage) return validationMessage
    if (response?.title === 'One or more validation errors occurred.') return response.title
    return null
  },
  mapFormValuesToMutationPayload: vi.fn(() => ({ payload: 'mapped' })),
  mapDetailToFormValues: vi.fn(() => ({ customerId: 1 })),
  mapOrderDetailToPackagingRows: vi.fn(() => []),
  mapPackagingDetailToRows: vi.fn(() => []),
  mapPackagingRowsToPayload: vi.fn(() => []),
  mapDetailToEscalationDefaults: vi.fn(() => ({ items: [] })),
  mapEscalationValuesToPayload: vi.fn(() => ({ payload: 'escalation' })),
}))

vi.mock('@/pages/sales-orders/packagingUtils', () => ({
  applyAutoFill: vi.fn((rows) => rows),
  removePackagingRow: vi.fn((rows) => rows),
  updatePackagingRow: vi.fn((rows) => rows),
  validatePackagingRows: vi.fn(() => ({ isValid: true, message: '' })),
}))

const defaultMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
}

function renderAt(path: string, routePath: string, element: ReactNode) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={routePath} element={element} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Stock-out page error states', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    hookState.useCreateStockOut.mockReturnValue(defaultMutation)
    hookState.useStockOutDetail.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null })
    hookState.usePackagingDetail.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null })
    hookState.useStockOutLookups.mockReturnValue({ data: undefined })
    hookState.useUpdateStockOut.mockReturnValue(defaultMutation)
    hookState.useAdminUpdateStockOut.mockReturnValue(defaultMutation)
    hookState.useAdminSubmitPackaging.mockReturnValue(defaultMutation)
    hookState.useUpdatePackaging.mockReturnValue(defaultMutation)
    hookState.useEscalateStockOut.mockReturnValue(defaultMutation)
    hookState.useCompletePackaging.mockReturnValue(defaultMutation)
  })

  it('surfaces create-page submit failures as a server error banner', async () => {
    hookState.useCreateStockOut.mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(new Error('API 500: Create failed')),
      isPending: false,
    })

    renderAt('/sales-orders/create', '/sales-orders/create', <CreateSalesOrderPage />)

    fireEvent.click(screen.getByRole('button', { name: 'SubmitForm' }))

    expect(await screen.findByText('API 500: Create failed')).toBeTruthy()
  })

  it('renders the standard edit-page load error state when detail loading fails', () => {
    hookState.useStockOutDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('API 404: Missing order'),
    })

    renderAt('/sales-orders/77/edit', '/sales-orders/:id/edit', <EditSalesOrderPage />)

    expect(screen.getByText('Failed to load sales order')).toBeTruthy()
    expect(screen.getByText('API 404: Missing order')).toBeTruthy()
  })

  it('surfaces validation-style update failures on the edit page instead of navigating away', async () => {
    hookState.useStockOutDetail.mockReturnValue({
      data: {
        stockOutGeneralData: {
          soSystemNo: 'SO-77',
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    })
    hookState.useUpdateStockOut.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        title: 'One or more validation errors occurred.',
        errors: { stockOutItemsData: ['Add at least one product line'] },
      }),
      isPending: false,
    })

    renderAt('/sales-orders/77/edit', '/sales-orders/:id/edit', <EditSalesOrderPage />)

    fireEvent.click(screen.getByRole('button', { name: 'SubmitForm' }))

    expect(await screen.findByText('Add at least one product line')).toBeTruthy()
  })

  it('renders the packaging edit-page load error state when packaging detail loading fails', () => {
    hookState.usePackagingDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('API 404: Missing packaging detail'),
    })

    renderAt(
      '/sales-orders/packages/done/77/edit',
      '/sales-orders/packages/done/:id/edit',
      <EditSalesOrderPage mode="packing-edit" />,
    )

    expect(screen.getByText('Failed to load sales order')).toBeTruthy()
    expect(screen.getByText('API 404: Missing packaging detail')).toBeTruthy()
  })

  it('renders the packaging-page load error state when detail loading fails', () => {
    hookState.useStockOutDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('API 401: Packaging unavailable'),
    })

    renderAt('/sales-orders/77/package', '/sales-orders/:id/package', <PackageSalesOrderPage />)

    expect(screen.getByText('Failed to load packaging data')).toBeTruthy()
    expect(screen.getByText('API 401: Packaging unavailable')).toBeTruthy()
  })
})