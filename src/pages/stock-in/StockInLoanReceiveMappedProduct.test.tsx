import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StockInForm } from '@/pages/stock-in/StockInForm'
import type { StockInFormData } from '@/schemas/stockInSchema'

vi.mock('@/hooks/useStockIn', () => ({
  useStockInLookups: () => ({
    data: {
      orderTypes: [{ id: 6, label: 'Loan_Receive' }],
      channels: [
        { id: 1, label: 'Main Channel' },
        { id: 2, label: 'Secondary Channel' },
      ],
    },
  }),
  useStockInChannels: () => ({
    data: [
      { id: 1, label: 'Main Channel' },
      { id: 2, label: 'Secondary Channel' },
    ],
    isLoading: false,
  }),
  useStockInBatchAndMappedItems: () => ({
    data: {
      batchList: [],
      mappedItems: [
        { id: 202, label: 'Mapped Product 202' },
        { id: 203, label: 'Mapped Product 203' },
      ],
    },
    isLoading: false,
  }),
}))

vi.mock('@/components/dropdowns', () => ({
  PaginatedCombobox: ({ placeholder = 'combobox' }: { placeholder?: string }) => (
    <button type="button">{placeholder}</button>
  ),
}))

vi.mock('@/pages/stock-in/BatchModal', () => ({
  BatchModal: () => null,
}))

vi.mock('@/pages/stock-in/PackModal', () => ({
  PackModal: () => null,
}))

function findMappedProductSelect() {
  return screen
    .getAllByRole('combobox')
    .find((element) => within(element).queryByRole('option', { name: 'Mapped Product 202' }))
}

describe('StockInForm loan receive mapped product', () => {
  it('keeps the mapped product selected after choosing an option', async () => {
    const onSubmit = vi.fn()
    const defaultValues: Partial<StockInFormData> = {
      siInvoiceNo: 'INV-LOAN-01',
      siInvoiceDate: '2026-04-24',
      siJobTypeId: 6,
      jobTypeName: 'Loan_Receive',
      siSourceChannelId: 1,
      siSourceChannelName: 'Main Channel',
      siDestinationChannelId: 2,
      siDestinationChannelName: 'Secondary Channel',
      siCustomerId: 300,
      customerName: 'Loan Customer',
      items: [
        {
          sidProductId: 101,
          productName: 'Loan Item 101',
          sidDeclaredQty: 1,
          sidConfirmedQty: null,
          sidDeclaredUnitPrice: 10,
          sidConfirmedUnitPrice: null,
          sidProductStrength: null,
          sidBatches: [],
          sidPacks: [],
          sidMappedProductId: null,
          sidMappedProductName: null,
        },
      ],
    }

    render(
      <StockInForm
        mode="standard"
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        isSubmitting={false}
        submitLabel="Create Stock-In Order"
      />,
    )

    const mappedSelect = findMappedProductSelect()

    expect(mappedSelect).toBeTruthy()

    fireEvent.change(mappedSelect as HTMLSelectElement, {
      target: { value: '202' },
    })

    await waitFor(() => {
      expect((findMappedProductSelect() as HTMLSelectElement).value).toBe('202')
    })
  })
})