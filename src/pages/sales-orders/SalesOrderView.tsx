import type { StockOutOrderDetail } from '@/types/stockOut'
import { formatPrintDate } from '@/pages/sales-orders/printUtils'
import { numberToWords } from '@/utils/numberToWords'

const salesOrderViewStyles = `
  .inv * { box-sizing: border-box; }
  .inv { font-family: Arial, Helvetica, sans-serif; color: #111827; background: #fff; }
  /* Header: full-width, bg-light (#f8f9fa) matching Bootstrap bg-light used in legacy */
  .inv-header {
    display: flex; flex-direction: row; justify-content: space-between; align-items: center;
    background: #f8f9fa;
    width: 100%; padding: 24px 8px;
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
  .inv-body { padding: 24px; }
  .inv-title { text-align: center; margin-bottom: 16px; }
  .inv-title span { font-weight: bolder; border: 1px solid #e4e4e4; padding: 5px; font-size: 15px; }
  .inv-info-row { display: flex; gap: 0; margin-bottom: 32px; min-height: 100px; }
  .inv-info-left { flex: 7; padding-right: 16px; }
  .inv-info-right { flex: 5; }
  .inv-info-row div { margin-bottom: 4px; font-size: 14px; }
  /* Table: border #000 and th bg #f2f2f2 matching View.css exactly */
  .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 0; overflow-x: auto; }
  .inv-table th { border: 1px solid #000; padding: 8px; font-size: 13px; vertical-align: top; text-align: left; background: #f2f2f2; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .inv-table td { border: 1px solid #000; padding: 8px; font-size: 13px; vertical-align: top; text-align: left; }
  .inv-summary { width: 100%; border-collapse: collapse; margin-top: 2px; }
  .inv-summary td { padding: 6px 8px; font-size: 13px; border: 1px solid #dee2e6; }
  .te { text-align: right !important; }
  .fw { font-weight: bold; }
  /* In-words: bg-light matching legacy bg-light py-3 px-4 rounded */
  .inv-words { background: #f8f9fa; padding: 12px 16px; border-radius: 4px; margin-top: 8px; font-size: 13px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .inv-received { margin-top: 16px; }
  .inv-received-box { height: 140px; font-weight: bold; font-size: 14px; }
  .inv-received-line { padding: 4px 0; font-size: 13px; font-weight: normal; }
  .inv-footer { text-align: center; font-size: 12px; color: #555; padding: 8px 0; border-top: 1px solid #dee2e6; margin-top: 8px; }
  @page { margin: 0; size: auto; }
  @media print { html, body { margin: 0 !important; padding: 0 !important; } .inv-table { overflow-x: visible; } }
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

function getVatAmount(calculatedBill: number, vatPercantage: number): string {
  return (calculatedBill * (vatPercantage / 100)).toFixed(2)
}

function getAitAmount(calculatedBill: number, aitPercantage: number): string {
  return (calculatedBill * (aitPercantage / 100)).toFixed(2)
}

interface SalesOrderViewProps {
  detail: StockOutOrderDetail
}

export function SalesOrderView({ detail }: SalesOrderViewProps) {
  const general = detail.stockOutGeneralData
  const bill = detail.stockOutBillData
  const items = detail.stockOutItemsData
  const currency = bill.sobCurrencyName ?? 'BDT'
  const calculatedBill = Number(bill.calculatedBill ?? 0)
  const vatPercantage = Number(bill.billVatPercantage ?? 0)
  const aitPercantage = Number(bill.billAitPercantage ?? 0)
  const discountAmount = Number(bill.billDiscountAmount ?? 0)
  const adjustmentAmount = Number(bill.billAdjustmentAmount ?? 0)
  const finalBill = Number(bill.finalBill ?? 0)

  return (
    <div className="inv">
      <style>{salesOrderViewStyles}</style>

      {/* Company header: full-width, bg-light, matching legacy */}
      <div className="inv-header">
        <div className="inv-header-logo">
          <img src="/images/trade.png" alt="Trade" className="inv-logo" />
        </div>
        <div className="inv-header-center">
          <h4>TRADE ZENTRUM</h4>
          <div className="inv-header-addr">Reg. Office: House #21, Road #01, Block-C, Banasree, Rampura, Dhaka</div>
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
        <br /><br />
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
          <div>Ref : {general.soCustomerReferance ?? ''}</div>
          {general.jobTypeName !== 'Cash_Sales' && general.jobTypeName !== 'Credit_Sales' && (
            <div>Order Type : {general.jobTypeName ?? ''}</div>
          )}
          {general.soCustomerReferance && (
            <div>Customer Reference : {general.soCustomerReferance}</div>
          )}
        </div>
      </div>

      {/* Product table */}
      <table className="inv-table">
          <thead>
            <tr>
              <th>PRODUCT NAME</th>
              <th>QTY(KG)</th>
              <th className="te">PRICE/KG</th>
              <th className="te">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${item.sodProductId}-${index}`} style={{ height: '20px' }}>
                <td>{item.productName}</td>
                <td style={{ width: '70px' }}>{item.sodQty}</td>
                <td className="te" style={{ width: '100px' }}>{currency} {item.sodUnitPrice}</td>
                <td className="te" style={{ width: '100px' }}>{currency} {fmtAmt(Number(item.sodUnitPrice) * Number(item.sodQty))}</td>
              </tr>
            ))}
          </tbody>
        </table>

      {/* Summary table */}
      <table className="inv-summary">
          <tbody>
            <tr>
              <td><span className="fw">Item(s) :</span> {items.length}</td>
              <td><span className="fw">Total Quantity :</span> {getTotalQuantity(items)} KG</td>
              <td className="te"><span className="fw">Subtotal :</span> {currency} {fmtComma(calculatedBill)}</td>
            </tr>
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
            {vatPercantage !== 0 && (
              <tr>
                <td colSpan={2}></td>
                <td className="te fw">VAT : {vatPercantage}% ~ {currency} {getVatAmount(calculatedBill, vatPercantage)}</td>
              </tr>
            )}
            {aitPercantage !== 0 && (
              <tr>
                <td colSpan={2}></td>
                <td className="te fw">AIT : {aitPercantage}% ~ {currency} {getAitAmount(calculatedBill, aitPercantage)}</td>
              </tr>
            )}
            <tr>
              <td colSpan={2}></td>
              <td className="te fw" style={{ fontSize: '1.1rem' }}>
                Total Payable Amount : {fmtComma(finalBill)} {currency}
              </td>
            </tr>
          </tbody>
        </table>

      {/* In Words */}
      <div className="inv-words">
        In Word: {numberToWords(finalBill)} Taka only.
      </div>

      {/* Received By */}
      <div className="inv-received">
        <div className="inv-received-box">
          Received By:
          <div style={{ marginTop: '16px' }}>
            <div className="inv-received-line">Signature:</div>
            <div className="inv-received-line">Name:</div>
            <div className="inv-received-line">Mobile Number:</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="inv-footer">
        This is a computer-generated document. No signature is required.
      </footer>

      </div>{/* end inv-body */}
    </div>
  )
}