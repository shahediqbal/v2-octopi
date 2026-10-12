import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hookState = vi.hoisted(() => ({
  useStickerPackingDetail: vi.fn(),
  usePackTypes: vi.fn(),
  useUpdateStickerPacking: vi.fn(),
  useEmployeeOptions: vi.fn(),
  showToast: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => hookState.navigate,
  }
})

vi.mock('@/hooks/useStickerPacking', () => ({
  useStickerPackingDetail: hookState.useStickerPackingDetail,
  usePackTypes: hookState.usePackTypes,
  useUpdateStickerPacking: hookState.useUpdateStickerPacking,
}))

vi.mock('@/hooks/useEmployees', () => ({
  useEmployeeOptions: hookState.useEmployeeOptions,
}))

vi.mock('@/stores/toastStore', () => ({
  useToastStore: (selector: (state: { showToast: typeof hookState.showToast }) => unknown) =>
    selector({ showToast: hookState.showToast }),
}))

vi.mock('@/components/dropdowns', () => ({
  SearchableSelect: ({
    options,
    value,
    onValueChange,
    placeholder,
    ariaLabel,
  }: {
    options: Array<{ key: number; value: string }>
    value?: number | null | string
    onValueChange: (value: number | null) => void
    placeholder?: string
    ariaLabel: string
  }) => (
    <select
      aria-label={ariaLabel}
      value={value ?? ''}
      onChange={(event) => onValueChange(event.target.value === '' ? null : Number(event.target.value))}
    >
      <option value="">{placeholder ?? 'Select an option'}</option>
      {options.map((option) => (
        <option key={option.key} value={option.key}>{option.value}</option>
      ))}
    </select>
  ),
}))

import { EditPackingPage } from '@/pages/sticker-packing/EditPackingPage'

function renderPage(initialPath = '/sticker-packing/32980/edit') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/sticker-packing/:id/edit" element={<EditPackingPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EditPackingPage', () => {
  beforeEach(() => {
    hookState.useStickerPackingDetail.mockReturnValue({
      data: {
        soSystemId: 32980,
        soSystemNo: 'SO-32980',
        invoiceDate: '2026-03-20',
        customerName: 'Acme Traders',
        jobType: 'Retail',
        stockOutPackagingItems: [
          {
            sopProductId: 1,
            productName: 'Widget A',
            sopPackSize: 0,
            sopNoPack: 0,
            sopProductQty: 0,
            sopPackId: null,
            packTypeName: null,
            packedBy: null,
            sodConfirmedQty: 55,
          },
        ],
      },
      isLoading: false,
      isError: false,
    })

    hookState.usePackTypes.mockReturnValue({ data: [], isLoading: false })
    hookState.useEmployeeOptions.mockReturnValue({ data: [] })
    hookState.useUpdateStickerPacking.mockReturnValue({
      mutate: vi.fn((payload, options) => {
        options?.onSuccess?.()
      }),
      isPending: false,
    })
    hookState.showToast.mockReset()
    hookState.navigate.mockReset()
  })

  it('adds a remainder row when edited pack quantity is below the order quantity', async () => {
    renderPage()

    const firstDataRow = screen.getAllByRole('row')[1]
    const [packSizeInput, packNoInput] = within(firstDataRow).getAllByRole('spinbutton')

    fireEvent.change(packSizeInput, { target: { value: '50' } })
    fireEvent.change(packNoInput, { target: { value: '1' } })

    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3))
    expect(screen.getAllByText('Widget A')).toHaveLength(2)

    const secondDataRow = screen.getAllByRole('row')[2]
    const [secondPackSizeInput, secondPackNoInput] = within(secondDataRow).getAllByRole('spinbutton')
    fireEvent.change(secondPackSizeInput, { target: { value: '5' } })
    fireEvent.change(secondPackNoInput, { target: { value: '1' } })

    fireEvent.click(screen.getByRole('button', { name: 'Update Packing' }))

    const updateMutation = hookState.useUpdateStickerPacking.mock.results[0]?.value
    await waitFor(() => expect(updateMutation.mutate).toHaveBeenCalledTimes(1))
    expect(updateMutation.mutate.mock.calls[0][0]).toEqual([
      {
        soSystemId: 32980,
        sopProductId: 1,
        sopPackSize: 50,
        sopNoPack: 1,
        sopProductQty: 50,
        sopPackId: null,
        packedBy: null,
      },
      {
        soSystemId: 32980,
        sopProductId: 1,
        sopPackSize: 5,
        sopNoPack: 1,
        sopProductQty: 5,
        sopPackId: null,
        packedBy: null,
      },
    ])
  })
})