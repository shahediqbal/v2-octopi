import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SalesOrderStickerModal } from '@/pages/sales-orders/SalesOrderStickerModal'

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

const orderDetail = {
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
  stockOutItemsData: [],
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

describe('SalesOrderStickerModal', () => {
  it('renders print CSS that locks stickers to a single 4x2 label page', () => {
    const { container } = render(
      <SalesOrderStickerModal
        isOpen
        packagingDetail={packagingDetail}
        orderDetail={orderDetail}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('Product Stickers')).toBeTruthy()

    const styleNode = container.querySelector('.so-stickers style')
    expect(styleNode?.textContent).toContain('@page { margin: 0; size: 4in 2in; }')
    expect(styleNode?.textContent).toContain('padding: 0 !important;')
    expect(styleNode?.textContent).toContain('page-break-after: always;')
    expect(styleNode?.textContent).toContain('border: 0;')
  })

  it('falls back to packaging detail partner name when order detail names are blank', () => {
    render(
      <SalesOrderStickerModal
        isOpen
        packagingDetail={packagingDetail}
        orderDetail={{
          ...orderDetail,
          stockOutGeneralData: {
            ...orderDetail.stockOutGeneralData,
            customerName: '',
            supplierName: '',
          },
        }}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('Acme Traders')).toBeTruthy()
    expect(screen.getAllByText(/SO-101/).length).toBeGreaterThan(0)
  })
})