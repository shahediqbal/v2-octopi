import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { KarjadeshView } from '@/pages/sales-orders/KarjadeshView'
import { SalesOrderChalaanModal } from '@/pages/sales-orders/SalesOrderChalaanModal'
import { SalesOrderInternalModal } from '@/pages/sales-orders/SalesOrderInternalModal'
import { SalesOrderStickerModal } from '@/pages/sales-orders/SalesOrderStickerModal'

const triggerPrintWindow = vi.hoisted(() => vi.fn())

vi.mock('@/pages/sales-orders/SalesOrderView', () => ({
  SalesOrderView: () => <div>SalesOrderViewContent</div>,
}))

vi.mock('@/pages/sales-orders/printUtils', async () => {
  const actual = await vi.importActual<typeof import('@/pages/sales-orders/printUtils')>('@/pages/sales-orders/printUtils')
  return {
    ...actual,
    triggerPrintWindow,
  }
})

const detail = {
  stockOutGeneralData: {
    soSystemId: 101,
    soSystemNo: 'SO-101',
    soJobTypeId: 1,
    soOrderFromId: 1,
    soCurrentStatus: 3,
    soCustomerId: 77,
    customerName: 'Acme Traders',
    customerAddress: 'Dhaka',
    jobTypeName: 'Retail',
    invoiceDate: '2026-03-20',
    soCustomerReferance: 'REF-101',
    soRemarks: 'Handle with care',
  },
  stockOutItemsData: [
    {
      sodProductId: 1,
      sodQty: 12,
      sodConfirmedQty: 10,
      sodBaseUnitPrice: 100,
      sodUnitPrice: 100,
      sodUnitDiscountType: 'F' as const,
      sodUnitDiscountRate: 0,
      sodUnitDiscountAmount: 0,
      sodUnitVatPercantage: 0,
      sodUnitAitPercantage: 0,
      sodFinalCalculatedUnitPrice: 100,
      productName: 'Widget A',
      mappedProductName: 'Mapped Widget A',
    },
  ],
  stockOutBillData: {
    calculatedBill: 1000,
    billDiscountType: 'F' as const,
    billDiscountRate: 0,
    billDiscountAmount: 0,
    billVatPercantage: 0,
    billAitPercantage: 0,
    billAdjustmentAmount: 0,
    finalBill: 1000,
    sobCurrencyName: 'BDT' as const,
    sobCurrencyConversionRate: 1,
    sobFinalConvertedBill: 1000,
  },
}

const packagingDetail = {
  soSystemId: 101,
  soSystemNo: 'SO-101',
  invoiceDate: '2026-03-20',
  customerName: 'Acme Traders',
  jobType: 'Retail',
  stockOutPackagingItems: [
    {
      soSystemId: 101,
      sopProductId: 1,
      productName: 'Widget A',
      mappedProductName: 'Mapped Widget A',
      packTypeName: 'Box',
      sopProductQty: 10,
      sopPackSize: 5,
      sopNoPack: 2,
    },
  ],
}

describe('Print surface modals', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('disables invoice printing when detail is unavailable', () => {
    render(
      <SalesOrderInternalModal
        isOpen
        detail={null}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('Sales Order Detail')).toBeTruthy()
    expect(screen.getByText('Stock-out invoice preview')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Print / Save PDF' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('prints the invoice surface when detail is loaded', () => {
    render(
      <SalesOrderInternalModal
        isOpen
        detail={detail}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('SalesOrderViewContent')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Print / Save PDF' }))

    expect(triggerPrintWindow).toHaveBeenCalledTimes(1)
    expect(triggerPrintWindow).toHaveBeenCalledWith('SO-101', expect.any(HTMLDivElement))
  })

  it('renders Karjadesh loading and error states through the shared print dialog', () => {
    const { rerender } = render(
      <KarjadeshView
        isOpen
        detail={detail}
        isLoading
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('Loading printable data…')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Print / Save PDF' }) as HTMLButtonElement).disabled).toBe(true)

    rerender(
      <KarjadeshView
        isOpen
        detail={detail}
        errorMessage="API 401: Unauthorized"
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('API 401: Unauthorized')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Print / Save PDF' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('prints the Karjadesh packing list when detail is loaded', () => {
    render(
      <KarjadeshView
        isOpen
        detail={detail}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('TRADE ZENTRUM')).toBeTruthy()
    expect(screen.getByText('Widget A')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Print / Save PDF' }))

    expect(triggerPrintWindow).toHaveBeenCalledTimes(1)
    expect(triggerPrintWindow).toHaveBeenCalledWith('SO-101', expect.any(HTMLDivElement))
  })

  it('disables chalaan printing when packaging detail is unavailable', () => {
    render(
      <SalesOrderChalaanModal
        isOpen
        packagingDetail={null}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('Chalaan')).toBeTruthy()
    expect(screen.getByText('Packaging dispatch document')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Print / Save PDF' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('prints the chalaan surface when packaging detail is loaded', () => {
    render(
      <SalesOrderChalaanModal
        isOpen
        packagingDetail={packagingDetail}
        orderDetail={detail}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('TRADE ZENTRUM CHALAAN')).toBeTruthy()
    expect(screen.getByText('Mapped Widget A')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Print / Save PDF' }))

    expect(triggerPrintWindow).toHaveBeenCalledTimes(1)
    expect(triggerPrintWindow).toHaveBeenCalledWith('SO-101', expect.any(HTMLDivElement))
  })

  it('renders sticker loading and error states through the shared print dialog', () => {
    const { rerender } = render(
      <SalesOrderStickerModal
        isOpen
        packagingDetail={packagingDetail}
        orderDetail={detail}
        isLoading
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('Loading printable data…')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Print / Save PDF' }) as HTMLButtonElement).disabled).toBe(true)

    rerender(
      <SalesOrderStickerModal
        isOpen
        packagingDetail={packagingDetail}
        orderDetail={detail}
        errorMessage="API 401: Unauthorized"
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('API 401: Unauthorized')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Print / Save PDF' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('prints the sticker surface when packaging detail is loaded', () => {
    render(
      <SalesOrderStickerModal
        isOpen
        packagingDetail={packagingDetail}
        orderDetail={detail}
        onClose={() => {}}
      />,
    )

    expect(screen.getAllByText('TRADE ZENTRUM').length).toBeGreaterThan(0)
    expect(screen.getByText('Stock-Out Package Sticker')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Print / Save PDF' }))

    expect(triggerPrintWindow).toHaveBeenCalledTimes(1)
    expect(triggerPrintWindow).toHaveBeenCalledWith('SO-101', expect.any(HTMLDivElement))
  })
})