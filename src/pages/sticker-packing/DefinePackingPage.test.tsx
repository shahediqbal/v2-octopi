import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hookState = vi.hoisted(() => ({
  useSalesOrderInternalDetail: vi.fn(),
  usePackTypes: vi.fn(),
  useCreateStickerPacking: vi.fn(),
  useEmployeeOptions: vi.fn(),
  showToast: vi.fn(),
}))

vi.mock('@/hooks/useStickerPacking', () => ({
  useSalesOrderInternalDetail: hookState.useSalesOrderInternalDetail,
  usePackTypes: hookState.usePackTypes,
  useCreateStickerPacking: hookState.useCreateStickerPacking,
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
    disabled,
  }: {
    options: Array<{ key: number; value: string }>
    value?: number | null
    onValueChange: (value: number | null) => void
    placeholder?: string
    ariaLabel: string
    disabled?: boolean
  }) => (
    <select
      aria-label={ariaLabel}
      disabled={disabled}
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

import { DefinePackingPage } from '@/pages/sticker-packing/DefinePackingPage'

function renderPage(initialPath = '/sticker-packing/32967/define') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/sticker-packing/:id/define" element={<DefinePackingPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DefinePackingPage', () => {
  beforeEach(() => {
    hookState.useSalesOrderInternalDetail.mockReturnValue({
      data: {
        soSystemId: 32967,
        soSystemNo: 'SO-32967',
        invoiceDate: '2026-03-20',
        customerName: 'Acme Traders',
        jobType: 'Retail',
        stockOutItemsData: [
          { sodProductId: 1, productName: 'Widget A', sodConfirmedQty: 10 },
          { sodProductId: 2, productName: 'Widget B', sodConfirmedQty: 6 },
        ],
      },
      isLoading: false,
      isError: false,
    })

    hookState.usePackTypes.mockReturnValue({
      data: [
        { packId: 4, packTypeName: 'Box' },
        { packId: 9, packTypeName: 'Carton' },
      ],
      isLoading: false,
    })

    hookState.useEmployeeOptions.mockReturnValue({ data: [] })
    hookState.useCreateStickerPacking.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })
    hookState.showToast.mockReset()
  })

  it('applies the global pack type selection to every packaging row', () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Global pack type'), {
      target: { value: '9' },
    })

    expect((screen.getByLabelText('Widget A pack type') as HTMLSelectElement).value).toBe('9')
    expect((screen.getByLabelText('Widget B pack type') as HTMLSelectElement).value).toBe('9')
  })
})