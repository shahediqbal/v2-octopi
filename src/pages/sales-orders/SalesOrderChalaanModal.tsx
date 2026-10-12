import { useRef,useState  } from 'react'
import { PrintDialog } from '@/pages/sales-orders/PrintDialog'
import { downloadPreviewAsPdf, formatPrintDate, triggerPrintWindow } from '@/pages/sales-orders/printUtils'
import { numberToWords } from '@/utils/numberToWords'
import type { StockOutOrderDetail, StockOutPackagingDetail, StockOutPackagingInfoItem } from '@/types/stockOut'

const chalaanStyles = `
  .ch * { box-sizing: border-box; }
  .ch { font-family: Arial, Helvetica, sans-serif; color: #111827; background: #fff; }
  /* Header: full-width bg-light matching legacy py-4 px-2 bg-light */
  .ch-header {
    display: flex; flex-direction: row; justify-content: space-between; align-items: center;
    background: #f8f9fa; width: 100%; padding: 16px 8px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .ch-header-logo { padding: 0 20px; display: flex; align-items: center; justify-content: center; }
  .ch-header-center { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
  .ch-header h4 { font-weight: bold; margin: 8px 0; font-size: 18px; }
  .ch-header-addr { font-size: 13px; color: #6c757d; font-weight: bold; margin: 2px 0; }
  .ch-header-contact { font-size: 13px; color: #6c757d; font-weight: bold; margin: 4px 0 0; display: flex; gap: 24px; }
  .ch-logo { width: 80px; height: 50px; object-fit: contain; }
  .ch-logo-right { width: 120px; height: 50px; object-fit: contain; }
  /* Body: 24px padding matching legacy p-4 */
  .ch-body { padding: 20px 24px 24px; }
  .ch-title { text-align: center; font-weight: bolder; font-size: 15px; padding: 5px; margin-bottom: 12px; }
  .ch-info { display: flex; gap: 0; margin-bottom: 32px; min-height: 100px; }
  .ch-info-left { flex: 7; padding-right: 16px; }
  .ch-info-right { flex: 5; }
  .ch-info div { margin-bottom: 4px; font-size: 14px; }
  .ch-table { width: 100%; border-collapse: collapse; border: none; margin-bottom: 0; table-layout: fixed; }
  .ch-table th { border: none; padding: 8px 6px; font-size: 13px; text-align: center; vertical-align: middle; white-space: normal; line-height: 1.25; word-break: break-word; overflow-wrap: anywhere; background: #f2f2f2; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .ch-table td { border: none; padding: 8px 6px; font-size: 13px; text-align: left; vertical-align: top; }
  .ch-cell-sl { width: 5%; white-space: nowrap; }
  .ch-cell-product { width: 33%; overflow-wrap: anywhere; word-break: break-word; }
  .ch-cell-order-qty { width: 14%; }
  .ch-cell-pack-size { width: 10%; }
  .ch-cell-pack-type { width: 14%; }
  .ch-cell-no-pack { width: 10%; }
  .ch-cell-product-qty { width: 14%; }
  .ch-total { width: 100%; border-collapse: collapse; border: none; margin-top: 32px; }
  .ch-total td { padding: 8px; font-size: 13px; border: none; }
  .ch-align-left { text-align: left !important; }
  .ch-align-center { text-align: center !important; }
  .tr { text-align: right; }
  .ch-fw { font-weight: bold; }
  .ch-received { margin-top: 16px; }
  .ch-received-title { font-weight: bold; font-size: 14px; height: 140px; }
  .ch-received-line { padding: 4px 0; font-size: 13px; font-weight: normal; }
  .ch-received-line--spaced { padding: 4px 0 16px; }
  /* Note bg: bg-light py-3 px-4 rounded matching legacy */
  .ch-note { background: #f8f9fa; padding: 12px 16px; border-radius: 4px; margin-top: 0; font-size: 13px; font-style: italic; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .ch-words { font-size: 13px; padding: 6px 0; margin-top: 6px; }
  .ch-footer { text-align: center; font-size: 12px; color: #555; padding: 8px 0; border-top: none; margin-top: 0; }
  .ch-print-bottom { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
  @page { size: A4 portrait; margin: 12mm 10mm 14mm; }
  @media print {
    html, body { margin: 0 !important; padding: 0 !important; }
    .ch-table { overflow-x: visible; }
    .ch { min-height: 271mm; display: flex; flex-direction: column; }
    .ch-header { padding: 12px 8px; }
    .ch-body { padding: 16px 18px 18px; display: flex; flex: 1; flex-direction: column; }
    .ch-info { margin-bottom: 20px; min-height: 0; }
    .ch-total { margin-top: 20px; }
    .ch-received-title { height: auto; min-height: 88px; }
    .ch-print-bottom {
      position: static;
      margin-top: auto;
      padding-top: 16px;
      background: transparent;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }
`

function getTotalQty(items: StockOutPackagingInfoItem[]): string {
  const sum = items.reduce((s, item) => s + (item.sopProductQty ?? 0), 0)
  return sum.toFixed(2)
}

interface SalesOrderChalaanModalProps {
  isOpen: boolean
  packagingDetail: StockOutPackagingDetail | null | undefined
  orderDetail?: StockOutOrderDetail | null | undefined
  isLoading?: boolean
  errorMessage?: string
  onClose: () => void
}

export function SalesOrderChalaanModal({
  isOpen,
  packagingDetail,
  orderDetail,
  isLoading = false,
  errorMessage,
  onClose,
}: SalesOrderChalaanModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const general = orderDetail?.stockOutGeneralData
const documentTitle =
  packagingDetail?.soSystemNo ?? 'chalaan'

async function handleDownloadPdf() {
  if (!packagingDetail || isGeneratingPdf) return

  setIsGeneratingPdf(true)

  try {
    await downloadPreviewAsPdf(
      `${documentTitle}_Challan`,
      printRef.current,
    )
  } finally {
    setIsGeneratingPdf(false)
  }
}
  return (
   <PrintDialog
  isOpen={isOpen}
  title="Chalaan"
  subtitle={
    packagingDetail?.soSystemNo ??
    'Packaging dispatch document'
  }
  isLoading={isLoading}
  errorMessage={errorMessage}
  printDisabled={!packagingDetail}
  printLabel="Print"
  secondaryActionLabel={
    isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'
  }
  secondaryActionDisabled={
    !packagingDetail || isGeneratingPdf
  }
  onClose={onClose}
  onSecondaryAction={() => {
    void handleDownloadPdf()
  }}
  onPrint={() =>
    triggerPrintWindow(documentTitle, printRef.current)
  }
>
      {packagingDetail && (
        <div ref={printRef} className="-mx-6 -my-6">
          <div className="ch">
            <style>{chalaanStyles}</style>

            {/* Header: full-width bg-light, matching legacy d-flex bg-light py-4 px-2 */}
            <div className="ch-header">
              <div className="ch-header-logo">
                <img src="/images/trade.png" alt="Trade Zentrum" className="ch-logo" />
              </div>
              <div className="ch-header-center">
                <h4>TRADE ZENTRUM</h4>
                <div className="ch-header-addr">Reg. Office: House #21, Road #01, Block-C, Banasree, Rampura, Dhaka</div>
               <div className="ch-header-addr">
  Warehouse: Kunia, Targas, Gazipur.
</div>
                <div className="ch-header-contact">
                  <span>&#9990;&nbsp;+8801792 527261</span>
                  <span>&#128233;&nbsp;tradezentrumbd@gmail.com</span>
                </div>
              </div>
              <div className="ch-header-logo">
                <img src="/images/assutext-logo.jpeg" alt="Assutext" className="ch-logo-right" />
              </div>
            </div>

            {/* Body: 24px padding matching legacy p-4 */}
            <div className="ch-body">

              {/* Challan title */}
              <div className="ch-title">CHALLAN</div>

              {/* Info row */}
              <div className="ch-info">
                <div className="ch-info-left">
                  {packagingDetail.supplierName ? (
                    <div>Supplier Name&nbsp;: {packagingDetail.supplierName}</div>
                  ) : (
                    <div>Customer Name&nbsp;: {general?.customerName ?? packagingDetail.customerName ?? 'Not Available'}</div>
                  )}
                  {general?.supplierAddress ? (
                    <div>Supplier Address&nbsp;: {general.supplierAddress}</div>
                  ) : (
                    <div>Customer Address&nbsp;: {general?.customerAddress ?? 'Not Available'}</div>
                  )}
                </div>
                <div className="ch-info-right">
                  <div>Challan&nbsp;Number&nbsp;: {packagingDetail.soSystemNo ?? ''}</div>
                  <div>Date Of Issue&nbsp;: {formatPrintDate(general?.invoiceDate ?? packagingDetail.invoiceDate)}</div>
                  <div>Ref&nbsp;: {general?.marketingPersonnel ?? ''}</div>
                  {general?.soCustomerReferance && (
                    <div>Customer Reference&nbsp;: {general.soCustomerReferance}</div>
                  )}
                  {packagingDetail.jobType !== 'Cash_Sales' && packagingDetail.jobType !== 'Credit_Sales' && packagingDetail.jobType && (
                    <div>Order Type&nbsp;: {packagingDetail.jobType}</div>
                  )}
                </div>
              </div>

              {/* Products table */}
              <table className="ch-table">
                <thead>
                  <tr>
                    <th className="ch-cell-sl ch-align-center">SL</th>
                    <th className="ch-cell-product ch-align-left">Product Name</th>
                    <th className="ch-cell-order-qty ch-align-center">Order Quantity(KG)</th>
                    <th className="ch-cell-pack-size ch-align-center">Pack Size(KG)</th>
                    <th className="ch-cell-pack-type ch-align-center">Pack Type</th>
                    <th className="ch-cell-no-pack ch-align-center">No of Pack</th>
                    <th className="ch-cell-product-qty ch-align-center">Product Quantity(KG)</th>
                  </tr>
                </thead>
                <tbody>
                  {packagingDetail.stockOutPackagingItems.length > 0 ? (
                    packagingDetail.stockOutPackagingItems.map((item, index) => {
                      const sodBatches = Array.isArray(item.sodBatches) ? item.sodBatches : []
                      return (
                      <tr key={`${item.sopProductId}-${index}`} style={{ height: '20px' }}>
                        <td className="ch-cell-sl ch-align-center">{index + 1}</td>
                        <td className="ch-cell-product ch-align-left">
                          <var>
                            {item.productName ?? 'N/A'}
                            {item.lotNo != null && item.lotNo !== '' && (
                              <sub> [Lot: {item.lotNo}]</sub>
                            )}
                            {packagingDetail.customerFlag === 1 && sodBatches.map((batch, bi) => (
                              batch.batchNo != null && batch.batchNo !== ''
                                ? <sub key={batch.batchId ?? bi}> ({batch.batchNo})</sub>
                                : null
                            ))}
                          </var>
                        </td>
                        <td className="ch-cell-order-qty ch-align-center">{item.sodConfirmedQty ?? '0'}</td>
                        <td className="ch-cell-pack-size ch-align-center">{item.sopPackSize ?? '0'}</td>
                        <td className="ch-cell-pack-type ch-align-center">{item.packTypeName ?? 'N/A'}</td>
                        <td className="ch-cell-no-pack ch-align-center">{item.sopNoPack ?? '0'}</td>
                        <td className="ch-cell-product-qty ch-align-center">{item.sopProductQty ?? '0'}</td>
                      </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#6b7280' }}>No items available</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total quantity */}
              <table className="ch-total">
                <tbody>
                  <tr>
                    <td className="ch-fw tr">Total Quantity (KG)</td>
                    <td className="ch-fw tr" style={{ width: '100px' }}>{getTotalQty(packagingDetail.stockOutPackagingItems)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Total quantity in words */}
              <div className="ch-words">
                In Words: <strong>{numberToWords(getTotalQty(packagingDetail.stockOutPackagingItems))} Kilogram{Number(getTotalQty(packagingDetail.stockOutPackagingItems)) === 1 ? '' : 's'} Only.</strong>
              </div>

              {/* Received by */}
              <div className="ch-received">
                <div className="ch-received-title">
                  Received By:
                  <div style={{ marginTop: '16px' }}>
                    <div className="ch-received-line ch-received-line--spaced">Signature:</div>
                    <div className="ch-received-line ch-received-line--spaced">Name:</div>
                    <div className="ch-received-line">Mobile Number:</div>
                  </div>
                </div>
              </div>

              <div className="ch-print-bottom">
                <div className="ch-note">
                  Note: Please report any product quality or quantity issues within 72 hours; otherwise, it will be treated as your acceptance in this regard.
                </div>

                <footer className="ch-footer">
                  This is a computer-generated document. No signature is required.
                </footer>
              </div>

            </div>{/* end ch-body */}
          </div>
        </div>
      )}
    </PrintDialog>
  )
}