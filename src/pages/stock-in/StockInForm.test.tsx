import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StockInForm } from '@/pages/stock-in/StockInForm'
import type { StockInFormData } from '@/schemas/stockInSchema'

vi.mock('@/hooks/useStockIn', () => ({
  useStockInLookups: () => ({
    data: {
      orderTypes: [{ id: 1, label: 'Regular_Purchase' }],
      channels: [{ id: 1, label: 'Main Channel' }],
    },
  }),
  useStockInChannels: () => ({
    data: [
      { id: 1, label: 'Main Channel' },
      { id: 2, label: 'Secondary Channel' },
    ],
    isLoading: false,
  }),
}))

vi.mock('@/components/dropdowns', () => ({
  PaginatedCombobox: ({ placeholder = 'combobox' }: { placeholder?: string }) => (
    <button type="button">{placeholder}</button>
  ),
}))

vi.mock('@/pages/stock-in/StockInItemTable', () => ({
  StockInItemTable: () => <div>StockInItemTable</div>,
}))

function getNumberInput(label: string) {
  const field = screen.getByText(label).parentElement as HTMLElement
  return within(field).getByRole('spinbutton') as HTMLInputElement
}

describe('StockInForm bill summary', () => {
  it('updates final total when discount and adjustment change', async () => {
    const onSubmit = vi.fn()
    const defaultValues: Partial<StockInFormData> = {
      siInvoiceNo: 'INV-001',
      siInvoiceDate: '2026-04-23',
      siJobTypeId: 1,
      jobTypeName: 'Regular_Purchase',
      siSourceChannelId: 1,
      siSourceChannelName: 'Main Channel',
      siDestinationChannelId: 2,
      siDestinationChannelName: 'Secondary Channel',
      sibDiscountAmouunt: 0,
      sibAdjustedAmount: 0,
      items: [
        {
          sidProductId: 101,
          productName: 'Item 101',
          sidDeclaredQty: 2,
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

    await waitFor(() => {
      expect(getNumberInput('Subtotal').value).toBe('20')
      expect(getNumberInput('Final Total').value).toBe('20')
    })

    fireEvent.change(getNumberInput('Discount'), { target: { value: '3' } })

    await waitFor(() => {
      expect(getNumberInput('Final Total').value).toBe('17')
    })

    fireEvent.change(getNumberInput('Adjustment'), { target: { value: '5' } })

    await waitFor(() => {
      expect(getNumberInput('Final Total').value).toBe('22')
    })
  })
})