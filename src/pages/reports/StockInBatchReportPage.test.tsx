import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StockInBatchReportPage } from '@/pages/reports/StockInBatchReportPage'

const { mockUseStockInBatch } = vi.hoisted(() => ({
  mockUseStockInBatch: vi.fn(),
}))

vi.mock('@/hooks/useStockInBatch', () => ({
  useStockInBatch: (...args: unknown[]) => mockUseStockInBatch(...args),
}))

vi.mock('@/components/dropdowns', () => ({
  PaginatedCombobox: ({
    type,
    placeholder = 'combobox',
    selectedLabel,
    onValueChange,
    onLabelChange,
  }: {
    type: string
    placeholder?: string
    selectedLabel?: string | null
    onValueChange?: (value: number | null) => void
    onLabelChange?: (label: string | null) => void
  }) => (
    <button
      type="button"
      onClick={() => {
        if (type === 'supplier') {
          onValueChange?.(9)
          onLabelChange?.('Acme Supplier')
        }
        if (type === 'customer') {
          onValueChange?.(11)
          onLabelChange?.('Blue Ocean Pharma')
        }
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

vi.mock('@/utils/lazyExportExcel', () => ({
  exportExcelOnDemand: vi.fn(),
}))

describe('StockInBatchReportPage', () => {
  beforeEach(() => {
    mockUseStockInBatch.mockReset()
    mockUseStockInBatch.mockReturnValue({
      data: [
        {
          supplierId: 9,
          supplierName: 'Acme Supplier',
          siCustomerId: 11,
          customerName: 'Blue Ocean Pharma',
          customerAddress: 'Dhaka, Bangladesh',
          siInvoiceNo: 'INV-100',
          siSystemNo: 'SI-100',
          siInvoiceDate: '2026-05-10T10:00:00',
          productId: 13,
          productName: 'ASUDEL OLIVE GWL',
          batchNo: 'B-77',
          batchProductionDate: '2026-04-01T00:00:00',
          batchExpiryDate: '2028-04-01T00:00:00',
          receiveQuantity: 25.5,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  it('renders the customer details column and forwards supplier, customer, and product filters to the hook', async () => {
    render(<StockInBatchReportPage />)

    fireEvent.click(screen.getByRole('button', { name: 'All Suppliers' }))
    fireEvent.click(screen.getByRole('button', { name: 'All Customers' }))
    fireEvent.click(screen.getByRole('button', { name: 'All Products' }))

    await waitFor(() => {
      const lastCall = mockUseStockInBatch.mock.calls.at(-1)
      expect(lastCall?.[0]).toEqual(
        expect.objectContaining({
          supplierId: 9,
          customerId: 11,
          productId: 13,
        }),
      )
      expect(lastCall?.[1]).toBe(false)
    })

    expect(screen.getAllByText('Customer').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('ID: 11')).toBeTruthy()
    expect(screen.getByText('Dhaka, Bangladesh')).toBeTruthy()
    expect(screen.getAllByText('Blue Ocean Pharma').length).toBeGreaterThanOrEqual(1)
  })
})