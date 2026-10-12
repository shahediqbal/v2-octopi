import { fireEvent, render, screen, within } from '@testing-library/react'
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
    const { container } = render(
      <SalesOrderChalaanModal
        isOpen
        packagingDetail={packagingDetail}
        orderDetail={detail}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('TRADE ZENTRUM')).toBeTruthy()
    expect(screen.getByText('CHALLAN')).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'SL' })).toBeTruthy()
    expect(screen.getByText('Widget A')).toBeTruthy()
    const challanNote = screen.getByText('Note: Please report any product quality or quantity issues within 72 hours; otherwise, it will be treated as your acceptance in this regard.')
    const challanFooterText = screen.getByText('This is a computer-generated document. No signature is required.')
    const firstSerialCell = container.querySelector('tbody tr td.ch-cell-sl')

    expect(challanNote).toBeTruthy()
    expect(challanFooterText).toBeTruthy()
    expect(firstSerialCell?.textContent).toBe('1')
    expect(challanNote.closest('.ch-print-bottom')).toBe(challanFooterText.closest('.ch-print-bottom'))

    const styleNode = container.querySelector('.ch style')
    const printBottom = container.querySelector('.ch-print-bottom')

    expect(printBottom?.firstElementChild).toBe(challanNote.closest('.ch-note'))
    expect(printBottom?.lastElementChild).toBe(challanFooterText.closest('.ch-footer'))
    expect(styleNode?.textContent).toContain('padding: 16px 8px;')
    expect(styleNode?.textContent).toContain('.ch-table { width: 100%; border-collapse: collapse; border: none; margin-bottom: 0; table-layout: fixed; }')
    expect(styleNode?.textContent).toContain('.ch-table th { border: none; padding: 8px 6px; font-size: 13px; text-align: center; vertical-align: middle; white-space: normal;')
    expect(styleNode?.textContent).toContain('.ch-cell-sl { width: 5%; white-space: nowrap; }')
    expect(styleNode?.textContent).toContain('.ch-cell-product { width: 33%; overflow-wrap: anywhere; word-break: break-word; }')
    expect(styleNode?.textContent).toContain('.ch-cell-pack-size { width: 10%; }')
    expect(styleNode?.textContent).toContain('.ch-cell-no-pack { width: 10%; }')
    expect(styleNode?.textContent).toContain('.ch-total { width: 100%; border-collapse: collapse; border: none; margin-top: 32px; }')
    expect(styleNode?.textContent).toContain('.ch-footer { text-align: center; font-size: 12px; color: #555; padding: 8px 0; border-top: none; margin-top: 0; }')
    expect(styleNode?.textContent).toContain('.ch-received-line--spaced { padding: 4px 0 16px; }')
    expect(styleNode?.textContent).toContain('.ch-print-bottom { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }')
    expect(styleNode?.textContent).toContain('@page { size: A4 portrait; margin: 12mm 10mm 14mm; }')
    expect(styleNode?.textContent).toContain('.ch { min-height: 271mm; display: flex; flex-direction: column; }')
    expect(styleNode?.textContent).toContain('.ch-body { padding: 16px 18px 18px; display: flex; flex: 1; flex-direction: column; }')
    expect(styleNode?.textContent).toContain('.ch-received-title { height: auto; min-height: 88px; }')
    expect(styleNode?.textContent).toContain('position: static;')
    expect(styleNode?.textContent).toContain('margin-top: auto;')
    expect(styleNode?.textContent).toContain('page-break-inside: avoid;')

    const totalRow = screen.getByText('Total Quantity (KG)').closest('tr')
    expect(totalRow).toBeTruthy()
    expect(within(totalRow as HTMLTableRowElement).getAllByRole('cell')).toHaveLength(2)

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
    const { container } = render(
      <SalesOrderStickerModal
        isOpen
        packagingDetail={packagingDetail}
        orderDetail={detail}
        onClose={() => {}}
      />,
    )

    expect(screen.getByAltText('Trade Zentrum')).toBeTruthy()
    expect(screen.getByText('Product Stickers')).toBeTruthy()

  const styleNode = container.querySelector('.so-stickers style')
  expect(styleNode?.textContent).toContain('.so-sticker__info-row--lot {')
  expect(styleNode?.textContent).toContain('margin-bottom: 12px;')

    fireEvent.click(screen.getByRole('button', { name: 'Print / Save PDF' }))

    expect(triggerPrintWindow).toHaveBeenCalledTimes(1)
    expect(triggerPrintWindow).toHaveBeenCalledWith('SO-101', expect.any(HTMLDivElement))
  })
})