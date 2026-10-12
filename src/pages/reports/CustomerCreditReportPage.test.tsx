import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hookState = vi.hoisted(() => ({
  useCustomerCreditHistory: vi.fn(),
  useCustomerCreditSummary: vi.fn(),
}))

vi.mock('@/hooks/useCustomerCreditReport', () => ({
  useCustomerCreditHistory: hookState.useCustomerCreditHistory,
  useCustomerCreditSummary: hookState.useCustomerCreditSummary,
}))

vi.mock('@/components/dropdowns', () => ({
  PaginatedCombobox: ({ onValueChange, onLabelChange }: { onValueChange: (value: number | null) => void; onLabelChange?: (label?: string | null) => void }) => (
    <button
      type="button"
      onClick={() => {
        onValueChange(9)
        onLabelChange?.('Beximco Ltd (Washing Unit)')
      }}
    >
      Pick Customer
    </button>
  ),
}))

vi.mock('@/utils/lazyExportExcel', () => ({
  exportExcelOnDemand: vi.fn(),
}))

import { CustomerCreditReportPage } from '@/pages/reports/CustomerCreditReportPage'

describe('CustomerCreditReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    hookState.useCustomerCreditHistory.mockReturnValue({
      data: {
        customerInfo: {
          customerId: 9,
          customerName: 'Beximco Ltd (Washing Unit)',
          customerAddress: 'Chakrabarti Kashimpur, Gazip',
        },
        transctionInfo: [
          {
            serial_no: 1,
            date: '2026-05-01T00:00:00Z',
            job_type: 'Opening Balance',
            transaction_number: 'OPEN-9',
            payable_amount: 0,
            paid_amount: 0,
            returned_amount: 0,
            linq_calculated_due_amount: 21165977,
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })

    hookState.useCustomerCreditSummary.mockReturnValue({
      data: [
        {
          customerId: 9,
          customerName: 'Beximco Ltd (Washing Unit)',
          customerAddress: 'Chakrabarti Kashimpur, Gazip',
          marketingName: 'Marketing A',
          openingCredit: 18452838,
          totalSale: 0,
          totalPaid: 0,
          totalAdjustment: 0,
          totalDue: 18452838,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  it('renders the legacy history header info and summary totals after load', () => {
    render(<CustomerCreditReportPage />)

    fireEvent.click(screen.getByText('Pick Customer'))
    fireEvent.click(screen.getByRole('button', { name: 'Load Data' }))

    expect(screen.getByText('Customer Info')).toBeTruthy()
    expect(screen.getByText('Customer ID')).toBeTruthy()
    expect(screen.getAllByText('Beximco Ltd (Washing Unit)').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Chakrabarti Kashimpur, Gazip').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Opening Balance').length).toBeGreaterThan(0)
    expect(screen.getAllByText('21,165,977.00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Total Payment').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Closing Balance').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Credit Summary' }))

    expect(screen.getByText('Total Opening Credit')).toBeTruthy()
    expect(screen.getAllByText('18,452,838.00').length).toBeGreaterThan(0)
    expect(screen.getByText('Total Sales')).toBeTruthy()
    expect(screen.getByText('Total Adjustment')).toBeTruthy()
    expect(screen.getByText('Total Closing Balance')).toBeTruthy()
  })
})