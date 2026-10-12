import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hookState = vi.hoisted(() => ({
  useMonthlyCreditReport: vi.fn(),
}))

const exportState = vi.hoisted(() => ({
  exportExcelOnDemand: vi.fn(),
  exportMonthlyCreditReportExcel: vi.fn(),
}))

vi.mock('@/hooks/useMonthlyCreditReport', () => ({
  useMonthlyCreditReport: hookState.useMonthlyCreditReport,
}))

vi.mock('@/components/dropdowns', () => ({
  PaginatedCombobox: ({ onValueChange }: { onValueChange: (value: number | null, label?: string | null) => void }) => (
    <button type="button" onClick={() => onValueChange(9, 'Jane Marketing')}>
      Pick Employee
    </button>
  ),
}))

vi.mock('@/utils/lazyExportExcel', () => ({
  exportExcelOnDemand: exportState.exportExcelOnDemand,
}))

vi.mock('@/utils/exportMonthlyCreditReportExcel', () => ({
  exportMonthlyCreditReportExcel: exportState.exportMonthlyCreditReportExcel,
}))

import { MonthlyCreditReportPage } from '@/pages/reports/MonthlyCreditReportPage'

describe('MonthlyCreditReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the legacy monthly credit exporter when the API returns the legacy monthlyValues shape', async () => {
    hookState.useMonthlyCreditReport.mockReturnValue({
      data: [
        {
          employeeId: 9,
          employeeName: null,
          monthName: null,
          monthYear: null,
          creditAmount: null,
          customerCount: null,
          invoiceCount: null,
          customerName: 'Acme Textiles',
          marketingName: 'Jane Marketing',
          monthlyValues: {
            'January Opening Balance': 1200,
            'January Sales (Gross)': 450,
          },
          lastTransactions: {
            lastSaleAmount: 450,
            lastSaleDate: '2026-05-10',
            lastPaymentAmount: 400,
            lastPaymentDate: '2026-05-13',
            daysSinceLastPayment: 7,
            daysSinceLastSale: 10,
            paymentStatus: 'Regular',
          },
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<MonthlyCreditReportPage />)

  expect(screen.getByText('January Opening Balance')).toBeTruthy()
  expect(screen.getByText('1,200.00')).toBeTruthy()
  expect(screen.getByText('Last Sale Amount')).toBeTruthy()
  expect(screen.getByText('Regular')).toBeTruthy()
  expect(screen.queryByText('[object Object]')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Excel' }))

    await waitFor(() => {
      expect(exportState.exportMonthlyCreditReportExcel).toHaveBeenCalledTimes(1)
    })

    expect(exportState.exportMonthlyCreditReportExcel).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          customerName: 'Acme Textiles',
          marketingName: 'Jane Marketing',
        }),
      ]),
      expect.any(String),
      expect.any(String),
      0,
    )
    expect(exportState.exportExcelOnDemand).not.toHaveBeenCalled()
  })

  it('falls back to the generic export when the response is flat', async () => {
    hookState.useMonthlyCreditReport.mockReturnValue({
      data: [
        {
          employeeId: 12,
          employeeName: 'John Doe',
          monthName: 'May',
          monthYear: '2026',
          creditAmount: 1500,
          customerCount: 4,
          invoiceCount: 7,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<MonthlyCreditReportPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Excel' }))

    await waitFor(() => {
      expect(exportState.exportExcelOnDemand).toHaveBeenCalledTimes(1)
    })

    expect(exportState.exportMonthlyCreditReportExcel).not.toHaveBeenCalled()
  })
})