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
  useStockInLast3Price: (
    filters: { productId: number; supplierId: number | null; customerId: number | null },
    enabled: boolean,
  ) => ({
    data:
      enabled && filters.productId === 13 && filters.supplierId === 9 && filters.customerId == null
        ? [
            {
              siSupplierId: 9,
              siCustomerId: null,
              customerName: null,
              supplierName: 'Asuchem',
              productId: 13,
              productName: 'ASUDEL OLIVE GWL',
              sidConfirmedUnitPrice: 1800,
              siInvoiceDate: '2025-11-09T11:38:46.553',
              siInvoiceNo: 'CH-152030',
              lastSiSystemId: 801,
            },
            {
              siSupplierId: 9,
              siCustomerId: null,
              customerName: null,
              supplierName: 'Asuchem',
              productId: 13,
              productName: 'ASUDEL OLIVE GWL',
              sidConfirmedUnitPrice: 1610,
              siInvoiceDate: '2023-10-29T18:00:00',
              siInvoiceNo: '033169',
              lastSiSystemId: 619,
            },
            {
              siSupplierId: 9,
              siCustomerId: null,
              customerName: null,
              supplierName: 'Asuchem',
              productId: 13,
              productName: 'ASUDEL OLIVE GWL',
              sidConfirmedUnitPrice: 1610,
              siInvoiceDate: '2023-10-24T18:00:00',
              siInvoiceNo: '033087',
              lastSiSystemId: 527,
            },
          ]
        : [],
    isLoading: false,
    isError: false,
  }),
}))

vi.mock('@/components/dropdowns', () => ({
  PaginatedCombobox: ({
    type,
    placeholder = 'combobox',
    selectedLabel,
    onValueChange,
    onLabelChange,
  }: {
    type?: string
    placeholder?: string
    selectedLabel?: string | null
    onValueChange?: (value: number | null) => void
    onLabelChange?: (label: string | null) => void
  }) => (
    <button
      type="button"
      onClick={() => {
        if (type === 'product') {
          onValueChange?.(13)
          onLabelChange?.('ASUDEL OLIVE GWL')
        }
      }}
    >
      {selectedLabel ?? placeholder}
    </button>
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

  it('shows the last 3 purchase prices for the selected product', async () => {
    const onSubmit = vi.fn()
    const defaultValues: Partial<StockInFormData> = {
      siInvoiceNo: 'INV-002',
      siInvoiceDate: '2026-04-23',
      siJobTypeId: 1,
      jobTypeName: 'Regular_Purchase',
      siSourceChannelId: 1,
      siSourceChannelName: 'Main Channel',
      siDestinationChannelId: 2,
      siDestinationChannelName: 'Secondary Channel',
      siSupplierId: 9,
      supplierName: 'Asuchem',
      items: [],
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

    fireEvent.click(screen.getByRole('button', { name: 'Search product to add...' }))
    fireEvent.change(getNumberInput('Unit Price'), { target: { value: '1700' } })

    await waitFor(() => {
      expect(screen.getByText('Purchase price signal')).toBeTruthy()
      expect(screen.getByText('Supplier: Asuchem')).toBeTruthy()
      expect(screen.getByText('1,673.33')).toBeTruthy()
      expect(screen.getByText('Stock-In #801')).toBeTruthy()
      expect(screen.getByText('Stock-In #619')).toBeTruthy()
      expect(screen.getByText('Stock-In #527')).toBeTruthy()
      expect(screen.getAllByText('-5.56% vs latest').length).toBe(2)
    })
  })
})