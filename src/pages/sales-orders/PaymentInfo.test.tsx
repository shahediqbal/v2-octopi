import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PaymentInfo } from '@/pages/sales-orders/PaymentInfo'

const hookState = vi.hoisted(() => ({
  useCurrentStock: vi.fn(),
  useCustomerCredit: vi.fn(),
  useCustomerLastPayment: vi.fn(),
  useCustomerPriceSummary: vi.fn(),
}))

vi.mock('@/hooks/useStockOut', () => ({
  useCurrentStock: hookState.useCurrentStock,
  useCustomerCredit: hookState.useCustomerCredit,
  useCustomerLastPayment: hookState.useCustomerLastPayment,
  useCustomerPriceSummary: hookState.useCustomerPriceSummary,
}))

describe('PaymentInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hookState.useCurrentStock.mockReturnValue({ data: undefined, isLoading: false, isError: false })
    hookState.useCustomerCredit.mockReturnValue({ data: undefined, isLoading: false, isError: false })
    hookState.useCustomerLastPayment.mockReturnValue({ data: undefined, isLoading: false, isError: false })
    hookState.useCustomerPriceSummary.mockReturnValue({ data: [], isLoading: false, isError: false })
  })

  it('shows selection prompts when customer and product are not selected yet', () => {
    render(<PaymentInfo customerId={null} productId={null} channelId={2} />)

    expect(screen.getByText('Select a product to view price history')).toBeTruthy()
    expect(screen.getByText('Select product')).toBeTruthy()
    expect(screen.getAllByText('Select customer')).toHaveLength(2)
  })

  it('shows no-history and no-payment states when selected data has no prior records', () => {
    render(<PaymentInfo customerId={11} productId={101} channelId={2} />)

    expect(screen.getByText('No price history available')).toBeTruthy()
    expect(screen.getByText('No previous orders found for this product')).toBeTruthy()
    expect(screen.getByText('No payments')).toBeTruthy()
  })

  it('shows history rows, credit, stock, and last payment amount when data exists', () => {
    hookState.useCurrentStock.mockReturnValue({
      data: [{ currentQty: 25, productName: 'Widget' }],
      isLoading: false,
      isError: false,
    })
    hookState.useCustomerCredit.mockReturnValue({
      data: { totalDue: 12345 },
      isLoading: false,
      isError: false,
    })
    hookState.useCustomerLastPayment.mockReturnValue({
      data: { paymentDate: '2026-04-20T00:00:00.000Z', paymentAmount: 9876 },
      isLoading: false,
      isError: false,
    })
    hookState.useCustomerPriceSummary.mockReturnValue({
      data: [
        { invoiceDate: '2026-04-18T00:00:00.000Z', sodConfirmedUnitPrice: 110 },
        { invoiceDate: '2026-04-17T00:00:00.000Z', sodConfirmedUnitPrice: 105 },
      ],
      isLoading: false,
      isError: false,
    })

    render(<PaymentInfo customerId={11} productId={101} channelId={2} />)

    expect(screen.getByText('Widget')).toBeTruthy()
    expect(screen.getByText('12,345')).toBeTruthy()
    expect(screen.getByText('25')).toBeTruthy()
    expect(screen.getByText('Amount: 9,876')).toBeTruthy()
    expect(screen.getByText('18 Apr 2026')).toBeTruthy()
    expect(screen.getByText('110')).toBeTruthy()
  })

  it('shows payment amount when the API returns an amount without a payment date', () => {
    hookState.useCustomerLastPayment.mockReturnValue({
      data: { paymentAmount: 800725, paymentDate: null },
      isLoading: false,
      isError: false,
    })

    render(<PaymentInfo customerId={706} productId={101} channelId={2} />)

    expect(screen.getByText('Date unavailable')).toBeTruthy()
    expect(screen.getByText('Amount: 800,725')).toBeTruthy()
    expect(screen.queryByText('No payments')).toBeNull()
  })
})