import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QuotationListPage } from '@/pages/quotations/QuotationListPage'

const mockUseQuotations = vi.fn()

vi.mock('@/hooks/useQuotation', () => ({
  useQuotations: (...args: unknown[]) => mockUseQuotations(...args),
}))

vi.mock('@/utils/lazyExportExcel', () => ({
  exportExcelOnDemand: vi.fn(),
}))

vi.mock('@/pages/quotations/QuotationViewModal', () => ({
  QuotationViewModal: () => null,
}))

describe('QuotationListPage search', () => {
  beforeEach(() => {
    mockUseQuotations.mockReset()
    mockUseQuotations.mockReturnValue({
      data: [
        {
          pqSystemId: 101,
          pqSystemNo: 'QT-00101',
          pqOrderDate: '2026-05-01T00:00:00',
          customerName: 'Acme Pharma',
          customerAddress: 'Dhaka',
        },
        {
          pqSystemId: 202,
          pqSystemNo: 'QT-00202',
          pqOrderDate: '2026-05-02T00:00:00',
          customerName: 'Beacon Labs',
          customerAddress: 'Chattogram',
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    })
  })

  it('filters quotations with the top global search across visible and hidden row fields', () => {
    render(
      <MemoryRouter>
        <QuotationListPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('QT-00101')).toBeTruthy()
    expect(screen.getByText('QT-00202')).toBeTruthy()
    expect(screen.getByText('2 quotations')).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText('Search anything in quotations...'), {
      target: { value: 'Chattogram' },
    })

    expect(screen.getByText('QT-00202')).toBeTruthy()
    expect(screen.queryByText('QT-00101')).toBeNull()
    expect(screen.getByText('1 of 2 quotations')).toBeTruthy()
  })
})