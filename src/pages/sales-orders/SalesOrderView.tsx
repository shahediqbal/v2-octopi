import type { StockOutItemData, StockOutOrderDetail } from '@/types/stockOut'
import { formatPrintDate } from '@/pages/sales-orders/printUtils'
import { numberToWords } from '@/utils/numberToWords'

const salesOrderViewStyles = `
  .inv * { box-sizing: border-box; }
  .inv { font-family: Arial, Helvetica, sans-serif; color: #111827; background: #fff; }
  /* Header: full-width, bg-light (#f8f9fa) matching Bootstrap bg-light used in legacy */
  .inv-header {
    display: flex; flex-direction: row; justify-content: space-between; align-items: center;
    background: #f8f9fa;
    width: 100%; padding: 16px 8px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .inv-header-center { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
  .inv-header h4 { font-weight: bold; margin: 8px 0; font-size: 18px; }
  .inv-header-addr { font-size: 13px; color: #6c757d; font-weight: bold; margin: 2px 0; }
  .inv-header-contact { font-size: 13px; color: #6c757d; font-weight: bold; margin: 4px 0 0; display: flex; gap: 24px; }
  .inv-header-logo { padding: 0 20px; display: flex; align-items: center; justify-content: center; }
  .inv-logo { width: 80px; height: 50px; object-fit: contain; }
  .inv-logo-right { width: 120px; height: 50px; object-fit: contain; }
  /* Body: 24px padding matching legacy p-4 div */
  .inv-body { padding: 20px 24px 24px; }
  .inv-title { text-align: center; margin-bottom: 12px; }
  .inv-title span { font-weight: bolder; border: none; padding: 5px; font-size: 15px; }
  .inv-info-row { display: flex; gap: 0; margin-bottom: 24px; min-height: 100px; }
  .inv-info-left { flex: 7; padding-right: 16px; }
  .inv-info-right { flex: 5; }
  .inv-info-row div { margin-bottom: 4px; font-size: 14px; }
  .inv-table { width: 100%; border-collapse: collapse; border: none; margin-bottom: 0; overflow-x: auto; }
  .inv-table th { border: none; padding: 8px; font-size: 13px; vertical-align: top; text-align: center; background: #f2f2f2; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .inv-table td { border: none; padding: 8px; font-size: 13px; vertical-align: top; text-align: left; }
  .inv-align-left { text-align: left !important; }
  .inv-align-center { text-align: center !important; }
  .inv-align-right { text-align: right !important; }
  .inv-popup-only-cell { white-space: normal; }
  .inv-table--packing { table-layout: fixed; }
  .inv-table--packing .inv-cell-sl { width: 8%; }
  .inv-table--packing .inv-cell-product { width: 34%; }
  .inv-table--packing .inv-cell-price { width: 20%; }
  .inv-table--packing .inv-cell-qty { width: 10%; }
  .inv-table--packing .inv-cell-amount { width: 28%; }
  .inv-table--packing th.inv-cell-sl,
  .inv-table--packing td.inv-cell-sl { text-align: center !important; white-space: nowrap; }
  .inv-table--packing th.inv-cell-product,
  .inv-table--packing td.inv-cell-product { text-align: left !important; }
  .inv-table--packing th.inv-cell-price,
  .inv-table--packing th.inv-cell-qty,
  .inv-table--packing td.inv-cell-price,
  .inv-table--packing td.inv-cell-qty { text-align: center !important; }
  .inv-table--packing th.inv-cell-amount,
  .inv-table--packing td.inv-cell-amount { text-align: right !important; }
  .inv-table--packing td.inv-cell-product { overflow-wrap: anywhere; word-break: break-word; }
  .inv-table--packing td.inv-cell-price,
  .inv-table--packing td.inv-cell-qty,
  .inv-table--packing td.inv-cell-amount { white-space: nowrap; font-size: 12px; }
  .inv-summary { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .inv-summary td { padding: 6px 8px; font-size: 13px; border: none; }
  .te { text-align: right !important; }
  .fw { font-weight: bold; }
  /* In-words: bg-light matching legacy bg-light py-3 px-4 rounded */
  .inv-words { background: #f8f9fa; padding: 12px 16px; border-radius: 4px; margin-top: 8px; font-size: 13px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .inv-received { margin-top: 16px; }
  .inv-received-box { height: 140px; font-weight: bold; font-size: 14px; }
  .inv-received-line { padding: 4px 0; font-size: 13px; font-weight: normal; }
  .inv-received-line--spaced { padding: 4px 0 16px; }
  .inv-print-bottom { margin-top: 8px; }
  .inv-footer { text-align: center; font-size: 12px; color: #555; padding: 8px 0; border-top: none; margin-top: 8px; }
  .inv--packing-print .inv-body { padding-bottom: 24px; }
  @page { size: A4 portrait; margin: 12mm 10mm 14mm; }
  @media print {
    html, body { margin: 0 !important; padding: 0 !important; }
    .inv-table { overflow-x: visible; }
    .inv-popup-only-cell { display: none !important; }
    .inv--packing-print { min-height: 271mm; display: flex; flex-direction: column; }
    .inv--packing-print .inv-header { padding: 12px 8px; }
    .inv--packing-print .inv-body { padding: 16px 18px 18px; display: flex; flex: 1; flex-direction: column; }
    .inv--packing-print .inv-info-row { margin-bottom: 16px; min-height: 0; }
    .inv--packing-print .inv-received-box { height: auto; min-height: 88px; }
    .inv--packing-print .inv-print-bottom {
      margin-top: auto;
      padding-top: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .inv--packing-print .inv-footer {
      position: static;
      margin-top: 0;
      background: transparent;
    }
  }
`

function fmtAmt(value: number | string | null | undefined, digits = 2): string {
  const n = Number(value ?? 0)
  if (Number.isNaN(n)) return '0.00'
  return n.toFixed(digits)
}

function fmtComma(value: number | string | null | undefined, digits = 2): string {
  const n = Number(value ?? 0)
  if (Number.isNaN(n)) return '0.00'
  return n.toLocaleString('en-BD', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function getTotalQuantity(items: StockOutOrderDetail['stockOutItemsData']): string {
  const sum = items.reduce((acc, item) => acc + (item.sodQty || 0), 0)
  return sum.toFixed(2)
}

function getBatchSummary(item: StockOutItemData): string {
  if (Array.isArray(item.sodBatches)) {
    const values = item.sodBatches
      .map((batch) => batch.batchNo ?? null)
      .filter((value): value is string => Boolean(value?.trim()))

    if (values.length > 0) {
      return values.join(', ')
    }
  } else if (typeof item.sodBatches === 'string' && item.sodBatches.trim()) {
    return item.sodBatches.trim()
  }

  if (typeof item.sodRealatedBatchNo === 'string' && item.sodRealatedBatchNo.trim()) {
    return item.sodRealatedBatchNo.trim()
  }

  return '—'
}

/** PRICE(OLD): replicates legacy getOldPrice(sodUnitPrice, sodBaseUnitPrice, sodUnitVatPercantage, sodUnitAitPercantage) */
function getOldPrice(item: StockOutItemData): string {
  const price = Number(item.sodUnitPrice ?? 0)
  const vat = Number(item.sodBaseUnitPrice ?? 0)
  const ait = Number(item.sodUnitVatPercantage ?? 0)
  const discount = Number(item.sodUnitAitPercantage ?? 0)
  const final = price - (price * (vat / 100)) - (price * (ait / 100)) - discount
  return fmtAmt(final)
}

/** Per-item AMOUNT: prefer sodFinalCalculatedUnitPrice, fallback to sodUnitPrice * sodQty */
function getItemAmount(item: StockOutItemData): string {
  if (item.sodFinalCalculatedUnitPrice != null && !Number.isNaN(Number(item.sodFinalCalculatedUnitPrice))) {
    return fmtAmt(item.sodFinalCalculatedUnitPrice)
  }
  return fmtAmt(Number(item.sodUnitPrice ?? 0) * Number(item.sodQty ?? 0))
}

/** Subtotal: sum of sodFinalCalculatedUnitPrice (or sodUnitPrice * sodQty), matching legacy */
function getSubtotal(items: StockOutOrderDetail['stockOutItemsData']): number {
  return items.reduce((sum, item) => {
    if (item.sodFinalCalculatedUnitPrice != null && !Number.isNaN(Number(item.sodFinalCalculatedUnitPrice))) {
      return sum + Number(item.sodFinalCalculatedUnitPrice)
    }
    return sum + Number(item.sodUnitPrice ?? 0) * Number(item.sodQty ?? 0)
  }, 0)
}

function getVatAmount(calculatedBill: number, vatPercantage: number): number {
  return calculatedBill * (vatPercantage / 100)
}

function getAitAmount(calculatedBill: number, aitPercantage: number): number {
  return calculatedBill * (aitPercantage / 100)
}

interface SalesOrderViewProps {
  detail: StockOutOrderDetail
  variant?: 'default' | 'packing-print'
  showItemMetadata?: boolean
}

export function SalesOrderView({ detail, variant = 'default', showItemMetadata = false }: SalesOrderViewProps) {
  const general = detail.stockOutGeneralData
  const bill = detail.stockOutBillData
  const items = detail.stockOutItemsData
  const currency = bill.sobCurrencyName ?? 'BDT'
  const vatPercantage = Number(bill.billVatPercantage ?? 0)
  const aitPercantage = Number(bill.billAitPercantage ?? 0)
  const adjustmentAmount = Number(bill.billAdjustmentAmount ?? 0)
  const discountAmount = Number(bill.billDiscountAmount ?? 0)

  // const isSimpleView =
  //   general.jobTypeName === 'Sample_Issue' || general.jobTypeName === 'Warehouse_Transfer'
  // const isPackingPrintVariant = variant === 'packing-print'
  // const showPopupMetadataColumns = showItemMetadata && !isPackingPrintVariant && !isSimpleView
const normalizedJobType = String(general.jobTypeName ?? '').toLowerCase()

const isSimpleView =
  normalizedJobType === 'sample_issue' ||
  normalizedJobType === 'warehouse_transfer' ||
  normalizedJobType === 'loan_issue'

const isPackingPrintVariant = variant === 'packing-print'
const showPopupMetadataColumns = showItemMetadata && !isPackingPrintVariant
  // Conditional per-item VAT/AIT columns — shown when there is no bill-level VAT/AIT (matching legacy)
  const showVatCol = vatPercantage === 0
  const showAitCol = aitPercantage === 0

  const subtotal = getSubtotal(items)
  const vatAmount = getVatAmount(subtotal, vatPercantage)
  const aitAmount = getAitAmount(subtotal, aitPercantage)
  const finalBill = subtotal + vatAmount + aitAmount - discountAmount + adjustmentAmount

  return (
    <div className={`inv${isPackingPrintVariant ? ' inv--packing-print' : ''}`}>
      <style>{salesOrderViewStyles}</style>

      {/* Company header: full-width, bg-light, matching legacy */}
      <div className="inv-header">
        <div className="inv-header-logo">
          <img src="/images/trade.png" alt="Trade" className="inv-logo" />
        </div>
        <div className="inv-header-center">
          <h4>TRADE ZENTRUM</h4>
          <div className="inv-header-addr">Reg. Office: House #21, Road #01, Block-C, Banasree, Rampura, Dhaka</div>
          <div className="inv-header-addr">
  Warehouse: Kunia, Targas, Gazipur.
</div>
          <div className="inv-header-contact">
            <span>&#9990;&nbsp;+8801792 527261</span>
            <span>&#128233;&nbsp;tradezentrumbd@gmail.com</span>
          </div>
        </div>
        <div className="inv-header-logo">
          <img src="/images/assutext-logo.jpeg" alt="Assutext" className="inv-logo-right" />
        </div>
      </div>

      {/* Body content: 24px padding matching legacy p-4 */}
      <div className="inv-body">

      {/* INVOICE title */}
      <div className="inv-title">
        <span>INVOICE</span>
      </div>

      {/* Info row: customer/supplier on left, invoice details on right */}
      <div className="inv-info-row">
        <div className="inv-info-left">
          {general.supplierName ? (
            <div>Supplier Name : {general.supplierName}</div>
          ) : (
            <div>Customer Name : {general.customerName ?? 'Not Available'}</div>
          )}
          {general.supplierAddress ? (
            <div>Supplier Address : {general.supplierAddress}</div>
          ) : (
            <div>Customer Address : {general.customerAddress ?? 'Not Available'}</div>
          )}
        </div>
        <div className="inv-info-right">
          <div>Invoice Number : {general.soSystemNo ?? String(general.soSystemId)}</div>
          <div>Date Of Issue : {formatPrintDate(general.invoiceDate)}</div>
          <div>Ref : {general.marketingPersonnel ?? ''}</div>
          {general.jobTypeName !== 'Cash_Sales' && general.jobTypeName !== 'Credit_Sales' && (
            <div>Order Type : {general.jobTypeName ?? ''}</div>
          )}
          {general.soCustomerReferance && (
            <div>Customer Reference : {general.soCustomerReferance}</div>
          )}
        </div>
      </div>

      {/* Product table */}
      <table className={`inv-table${isPackingPrintVariant ? ' inv-table--packing' : ''}`}>
          <thead>
  {isSimpleView ? (
  <tr>
    <th className="inv-cell-sl inv-align-center">SL</th>
    <th className="inv-cell-product inv-align-left">Product Name</th>
    {showPopupMetadataColumns && (
      <th className="inv-popup-only-cell inv-align-left">Mapped Product</th>
    )}
    {showPopupMetadataColumns && (
      <th className="inv-popup-only-cell inv-align-left">Batch</th>
    )}
    <th className="te inv-cell-qty">QTY</th>
  </tr>
) : (
              <tr>
                <th className="inv-cell-sl inv-align-center">SL</th>
                <th className="inv-cell-product inv-align-left">Product Name</th>
                {showPopupMetadataColumns && <th className="inv-popup-only-cell inv-align-left">Mapped Product</th>}
                {showPopupMetadataColumns && <th className="inv-popup-only-cell inv-align-left">Batch</th>}
                {!isPackingPrintVariant && <th className="te">PRICE(OLD)</th>}
                {!isPackingPrintVariant && showVatCol && <th className="te">VAT(%)</th>}
                {!isPackingPrintVariant && showAitCol && <th className="te">AIT(%)</th>}
                {!isPackingPrintVariant && <th className="te">DISCOUNT(TK)</th>}
                <th className={isPackingPrintVariant ? 'inv-cell-price inv-align-center' : 'te inv-cell-price'}>{isPackingPrintVariant ? 'PRICE' : 'PRICE(NEW)'}</th>
                <th className={isPackingPrintVariant ? 'inv-cell-qty inv-align-center' : 'te inv-cell-qty'}>QTY</th>
                <th className={isPackingPrintVariant ? 'inv-cell-amount inv-align-right' : 'te inv-cell-amount'}>AMOUNT</th>
              </tr>
            )}
          </thead>
          <tbody>
            {items.map((item, index) =>
    isSimpleView ? (
  <tr key={`${item.sodProductId}-${index}`} style={{ height: '20px' }}>
    <td className="inv-cell-sl inv-align-center">{index + 1}</td>

    <td className="inv-cell-product inv-align-left">
      {item.productName}
    </td>

    {showPopupMetadataColumns && (
      <td className="inv-popup-only-cell inv-align-left">
        {item.mappedProductName ?? '—'}
      </td>
    )}

    {showPopupMetadataColumns && (
      <td className="inv-popup-only-cell inv-align-left">
        {getBatchSummary(item)}
      </td>
    )}

    <td className="te inv-cell-qty" style={{ width: '70px' }}>
      {item.sodQty}
    </td>
  </tr>
) : (
                <tr key={`${item.sodProductId}-${index}`} style={{ height: '20px' }}>
                  <td className="inv-cell-sl inv-align-center">{index + 1}</td>
                  <td className="inv-cell-product inv-align-left">{item.productName}</td>
                  {showPopupMetadataColumns && <td className="inv-popup-only-cell inv-align-left">{item.mappedProductName ?? '—'}</td>}
                  {showPopupMetadataColumns && <td className="inv-popup-only-cell inv-align-left">{getBatchSummary(item)}</td>}
                  {!isPackingPrintVariant && <td className="te" style={{ width: '100px' }}>{currency} {getOldPrice(item)}</td>}
                  {!isPackingPrintVariant && showVatCol && (
                    <td className="te" style={{ width: '80px' }}>
                      {fmtAmt(item.sodUnitVatPercantage)}
                    </td>
                  )}
                  {!isPackingPrintVariant && showAitCol && (
                    <td className="te" style={{ width: '80px' }}>
                      {fmtAmt(item.sodUnitAitPercantage)}
                    </td>
                  )}
                  {!isPackingPrintVariant && <td className="te" style={{ width: '100px' }}>{currency} {fmtAmt(item.sodUnitDiscountAmount)}</td>}
                  <td className={isPackingPrintVariant ? 'inv-cell-price inv-align-center' : 'te inv-cell-price'} style={isPackingPrintVariant ? undefined : { width: '100px' }}>{currency} {fmtAmt(item.sodUnitPrice)}</td>
                  <td className={isPackingPrintVariant ? 'inv-cell-qty inv-align-center' : 'te inv-cell-qty'} style={isPackingPrintVariant ? undefined : { width: '70px' }}>{item.sodQty}</td>
                  <td className={isPackingPrintVariant ? 'inv-cell-amount inv-align-right' : 'te inv-cell-amount'} style={isPackingPrintVariant ? undefined : { width: '100px' }}>{currency} {getItemAmount(item)}</td>
                </tr>
              )
            )}
          </tbody>
        </table>

      {/* Summary table */}
      <table className="inv-summary">
          <tbody>
            {isSimpleView ? (
              <tr>
                <td></td>
                <td><span className="fw">Total Quantity :</span> {getTotalQuantity(items)} KG</td>
              </tr>
            ) : (
              <>
                <tr>
                  <td><span className="fw">Item(s) :</span> {items.length}</td>
                  <td><span className="fw">Total Quantity :</span> {getTotalQuantity(items)} KG</td>
                  <td className="te"><span className="fw">SUBTOTAL :</span> {currency} {fmtComma(subtotal)}</td>
                </tr>
                {vatPercantage !== 0 && (
                  <tr>
                    <td colSpan={2}></td>
                    <td className="te fw">VAT : {vatPercantage}% ~ {currency} {fmtAmt(vatAmount)}</td>
                  </tr>
                )}
                {aitPercantage !== 0 && (
                  <tr>
                    <td colSpan={2}></td>
                    <td className="te fw">AIT : {aitPercantage}% ~ {currency} {fmtAmt(aitAmount)}</td>
                  </tr>
                )}
                {discountAmount !== 0 && (
                  <tr>
                    <td colSpan={2}></td>
                    <td className="te fw">Discount : {currency} {fmtAmt(discountAmount)}</td>
                  </tr>
                )}
                {adjustmentAmount !== 0 && (
                  <tr>
                    <td colSpan={2}></td>
                    <td className="te fw">Adjustment : {currency} {fmtAmt(adjustmentAmount)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={2}></td>
                  <td className="te fw" style={{ fontSize: '1.1rem' }}>
                    TOTAL : {currency} {fmtComma(finalBill)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>

      {/* In Words — only for regular orders */}
      {!isSimpleView && (
        <div className="inv-words">
          In Word: {numberToWords(finalBill)} Taka only.
        </div>
      )}

      {/* Received By */}
      <div className="inv-received">
        <div className="inv-received-box">
          Received By:
          <div style={{ marginTop: '16px' }}>
            <div className="inv-received-line inv-received-line--spaced">Signature:</div>
            <div className="inv-received-line inv-received-line--spaced">Name:</div>
            <div className="inv-received-line">Mobile Number:</div>
          </div>
        </div>
      </div>

      <div className="inv-print-bottom">
        {/* Footer */}
        <footer className="inv-footer">
          This is a computer-generated document. No signature is required.
        </footer>
      </div>

      </div>{/* end inv-body */}
    </div>
  )
}