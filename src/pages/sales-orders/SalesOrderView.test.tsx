import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SalesOrderView } from '@/pages/sales-orders/SalesOrderView'

const detail = {
  stockOutGeneralData: {
    soSystemId: 32975,
    soSystemNo: 'SO-32975',
    soJobTypeId: 1,
    soOrderFromId: 1,
    soCurrentStatus: 3,
    soCustomerId: 77,
    customerName: 'Acme Traders',
    customerAddress: 'Dhaka',
    supplierName: null,
    supplierAddress: null,
    jobTypeName: 'Retail',
    invoiceDate: '2026-03-20',
    soCustomerReferance: 'REF-32975',
    soRemarks: 'Handle with care',
    marketingPersonnel: 'Sobuj',
  },
  stockOutItemsData: [
    {
      sodProductId: 1,
      sodQty: 12,
      sodConfirmedQty: 10,
      sodBaseUnitPrice: 100,
      sodUnitPrice: 120,
      sodUnitDiscountType: 'F' as const,
      sodUnitDiscountRate: 0,
      sodUnitDiscountAmount: 5,
      sodUnitVatPercantage: 7,
      sodUnitAitPercantage: 3,
      sodFinalCalculatedUnitPrice: 1440,
      sodBatches: [{ batchId: 10, batchNo: 'B-10' }],
      productName: 'Widget A',
      mappedProductName: 'Mapped Widget A',
    },
  ],
  stockOutBillData: {
    calculatedBill: 1440,
    billDiscountType: 'F' as const,
    billDiscountRate: 0,
    billDiscountAmount: 5,
    billVatPercantage: 0,
    billAitPercantage: 0,
    billAdjustmentAmount: 0,
    finalBill: 1435,
    sobCurrencyName: 'BDT' as const,
    sobCurrencyConversionRate: 1,
    sobFinalConvertedBill: 1435,
  },
}

describe('SalesOrderView', () => {
  it('shows mapped product and batch columns when package-done popup metadata is enabled', () => {
    render(<SalesOrderView detail={detail} showItemMetadata />)

    expect(screen.getByRole('columnheader', { name: 'Mapped Product' })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Batch' })).toBeTruthy()
    expect(screen.getByText('Mapped Widget A')).toBeTruthy()
    expect(screen.getByText('B-10')).toBeTruthy()
  })

  it('hides legacy price breakdown columns for the packing print invoice variant', () => {
    const { container } = render(<SalesOrderView detail={detail} variant="packing-print" />)

    expect(screen.queryByText('Mapped Product')).toBeNull()
    expect(screen.queryByText('Batch')).toBeNull()
    expect(screen.queryByText('PRICE(OLD)')).toBeNull()
    expect(screen.queryByText('VAT(%)')).toBeNull()
    expect(screen.queryByText('AIT(%)')).toBeNull()
    expect(screen.queryByText('DISCOUNT(TK)')).toBeNull()
    expect(screen.queryByText('PRICE(NEW)')).toBeNull()
    expect(screen.getByRole('columnheader', { name: 'SL' })).toBeTruthy()
    expect(screen.getByText('PRICE')).toBeTruthy()
    expect(screen.getByText('Product Name')).toBeTruthy()

    const slHeader = screen.getByRole('columnheader', { name: 'SL' })
    const productHeader = screen.getByRole('columnheader', { name: 'Product Name' })
    const priceHeader = screen.getByRole('columnheader', { name: 'PRICE' })
    const quantityHeader = screen.getByRole('columnheader', { name: 'QTY' })
    const amountHeader = screen.getByRole('columnheader', { name: 'AMOUNT' })
    const firstSerialCell = container.querySelector('tbody tr td.inv-cell-sl')
    const firstProductCell = container.querySelector('tbody tr td.inv-cell-product')
    const firstPriceCell = container.querySelector('tbody tr td.inv-cell-price')
    const signatureLine = screen.getByText('Signature:')
    const nameLine = screen.getByText('Name:')
    const footerText = screen.getByText('This is a computer-generated document. No signature is required.')

    expect(slHeader.className).toContain('inv-align-center')
    expect(productHeader.className).toContain('inv-align-left')
    expect(priceHeader.className).toContain('inv-align-center')
    expect(quantityHeader.className).toContain('inv-align-center')
    expect(amountHeader.className).toContain('inv-align-right')
    expect(firstSerialCell?.className).toContain('inv-align-center')
    expect(firstSerialCell?.textContent).toBe('1')
    expect(firstProductCell?.className).toContain('inv-align-left')
    expect(firstPriceCell?.className).toContain('inv-align-center')
    expect(signatureLine.className).toContain('inv-received-line--spaced')
    expect(nameLine.className).toContain('inv-received-line--spaced')
    expect(footerText.closest('.inv-print-bottom')).toBeTruthy()

    const styleNode = container.querySelector('.inv style')
    expect(styleNode?.textContent).toContain('.inv-header {')
    expect(styleNode?.textContent).toContain('padding: 16px 8px;')
    expect(styleNode?.textContent).toContain('.inv-title span { font-weight: bolder; border: none;')
    expect(styleNode?.textContent).toContain('.inv-table { width: 100%; border-collapse: collapse; border: none;')
    expect(styleNode?.textContent).toContain('.inv-table th { border: none; padding: 8px; font-size: 13px;')
    expect(styleNode?.textContent).toContain('.inv-summary td { padding: 6px 8px; font-size: 13px; border: none; }')
    expect(styleNode?.textContent).toContain('.inv-footer { text-align: center; font-size: 12px; color: #555; padding: 8px 0; border-top: none;')
    expect(styleNode?.textContent).toContain('.inv-table--packing { table-layout: fixed; }')
    expect(styleNode?.textContent).toContain('.inv-table--packing .inv-cell-sl { width: 8%; }')
    expect(styleNode?.textContent).toContain('.inv-table--packing th.inv-cell-product,')
    expect(styleNode?.textContent).toContain('.inv-table--packing .inv-cell-product { width: 34%; }')
    expect(styleNode?.textContent).toContain('.inv-table--packing .inv-cell-amount { width: 28%; }')
    expect(styleNode?.textContent).toContain('.inv-table--packing td.inv-cell-amount { text-align: right !important; }')
    expect(styleNode?.textContent).toContain('.inv-received-line--spaced { padding: 4px 0 16px; }')
    expect(styleNode?.textContent).toContain('.inv-print-bottom { margin-top: 8px; }')
    expect(styleNode?.textContent).toContain('.inv--packing-print .inv-body { padding-bottom: 24px; }')
    expect(styleNode?.textContent).toContain('@page { size: A4 portrait; margin: 12mm 10mm 14mm; }')
    expect(styleNode?.textContent).toContain('.inv--packing-print { min-height: 271mm; display: flex; flex-direction: column; }')
    expect(styleNode?.textContent).toContain('.inv--packing-print .inv-body { padding: 16px 18px 18px; display: flex; flex: 1; flex-direction: column; }')
    expect(styleNode?.textContent).toContain('.inv--packing-print .inv-print-bottom {')
    expect(styleNode?.textContent).toContain('margin-top: auto;')
    expect(styleNode?.textContent).toContain('position: static;')
    expect(styleNode?.textContent).toContain('page-break-inside: avoid;')
  })

  it('right-aligns the amount header and values in the packing-print invoice variant', () => {
    render(<SalesOrderView detail={detail} variant="packing-print" />)

    const amountHeader = screen.getByRole('columnheader', { name: 'AMOUNT' })
    const amountCell = screen.getByText('BDT 1440.00')

    expect(amountHeader.className).toContain('inv-align-right')
    expect(amountCell.className).toContain('inv-align-right')
  })
})