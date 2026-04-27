import { useRef } from 'react'
import { PrintDialog } from '@/pages/sales-orders/PrintDialog'
import { formatPrintDate, triggerPrintWindow } from '@/pages/sales-orders/printUtils'
import type { StockOutOrderDetail, StockOutPackagingDetail, StockOutPackagingInfoItem } from '@/types/stockOut'

const chalaanStyles = `
  .ch * { box-sizing: border-box; }
  .ch { font-family: Arial, Helvetica, sans-serif; color: #111827; background: #fff; }
  /* Header: full-width bg-light matching legacy py-4 px-2 bg-light */
  .ch-header {
    display: flex; flex-direction: row; justify-content: space-between; align-items: center;
    background: #f8f9fa; width: 100%; padding: 24px 8px;
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
  .ch-body { padding: 24px; }
  .ch-title { text-align: center; font-weight: bolder; font-size: 15px; padding: 5px; margin-bottom: 16px; }
  .ch-info { display: flex; gap: 0; margin-bottom: 48px; min-height: 100px; }
  .ch-info-left { flex: 7; padding-right: 16px; }
  .ch-info-right { flex: 5; }
  .ch-info div { margin-bottom: 4px; font-size: 14px; }
  /* Table: border #e3e3e3, th bg #f2f2f2 matching View.css / legacy inline style */
  .ch-table { width: 100%; border-collapse: collapse; border: 1px solid #e3e3e3; margin-bottom: 0; }
  .ch-table th { border: 1px solid #e3e3e3; padding: 8px; font-size: 13px; text-align: left; background: #f2f2f2; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .ch-table td { border: 1px solid #e3e3e3; padding: 8px; font-size: 13px; text-align: left; }
  .ch-total { width: 100%; border-collapse: collapse; border: 1px solid #e3e3e3; margin-top: 32px; }
  .ch-total td { padding: 8px; font-size: 13px; border: 1px solid #e3e3e3; }
  .tr { text-align: right; }
  .ch-fw { font-weight: bold; }
  .ch-received { margin-top: 16px; }
  .ch-received-title { font-weight: bold; font-size: 14px; height: 140px; }
  .ch-received-line { padding: 4px 0; font-size: 13px; font-weight: normal; }
  /* Note bg: bg-light py-3 px-4 rounded matching legacy */
  .ch-note { background: #f8f9fa; padding: 12px 16px; border-radius: 4px; margin-top: 8px; font-size: 13px; font-style: italic; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .ch-footer { text-align: center; font-size: 12px; color: #555; padding: 8px 0; border-top: 1px solid #e3e3e3; margin-top: 8px; }
  @page { margin: 0; size: auto; }
  @media print { html, body { margin: 0 !important; padding: 0 !important; } .ch-table { overflow-x: visible; } }
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
  const general = orderDetail?.stockOutGeneralData

  return (
    <PrintDialog
      isOpen={isOpen}
      title="Chalaan"
      subtitle={packagingDetail?.soSystemNo ?? 'Packaging dispatch document'}
      isLoading={isLoading}
      errorMessage={errorMessage}
      printDisabled={!packagingDetail}
      onClose={onClose}
      onPrint={() => triggerPrintWindow(packagingDetail?.soSystemNo ?? 'chalaan', printRef.current)}
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
              <br />

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
                    <th>Product Name</th>
                    <th>Order Quantity(KG)</th>
                    <th style={{ textAlign: 'center' }}>Pack Size(KG)</th>
                    <th style={{ textAlign: 'center' }}>Pack Type</th>
                    <th style={{ textAlign: 'center' }}>No of Pack</th>
                    <th style={{ textAlign: 'center' }}>Product Quantity(KG)</th>
                  </tr>
                </thead>
                <tbody>
                  {packagingDetail.stockOutPackagingItems.length > 0 ? (
                    packagingDetail.stockOutPackagingItems.map((item, index) => (
                      <tr key={`${item.sopProductId}-${index}`} style={{ height: '20px' }}>
                        <td><var>{item.productName ?? 'N/A'}</var></td>
                        <td style={{ width: '70px' }}>{item.sodConfirmedQty ?? '0'}</td>
                        <td style={{ textAlign: 'center', width: '100px' }}>{item.sopPackSize ?? '0'}</td>
                        <td style={{ textAlign: 'center', width: '100px' }}>{item.packTypeName ?? 'N/A'}</td>
                        <td style={{ textAlign: 'center', width: '100px' }}>{item.sopNoPack ?? '0'}</td>
                        <td style={{ textAlign: 'center', width: '100px' }}>{item.sopProductQty ?? '0'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#6b7280' }}>No items available</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total quantity */}
              <table className="ch-total">
                <tbody>
                  <tr>
                    <td></td>
                    <td className="ch-fw tr">Total Quantity (KG)</td>
                    <td className="ch-fw tr" style={{ width: '100px' }}>{getTotalQty(packagingDetail.stockOutPackagingItems)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Received by */}
              <div className="ch-received">
                <div className="ch-received-title">
                  Received By:
                  <div style={{ marginTop: '16px' }}>
                    <div className="ch-received-line">Signature:</div>
                    <div className="ch-received-line">Name:</div>
                    <div className="ch-received-line">Mobile Number:</div>
                  </div>
                </div>
              </div>

              {/* 72-hour note: bg-light matching legacy */}
              <div className="ch-note">
                Note: Please report any product quality or quantity issues within 72 hours; otherwise, it will be treated as your acceptance in this regard.
              </div>

              {/* Footer */}
              <footer className="ch-footer">
                This is a computer-generated document. No signature is required.
              </footer>

            </div>{/* end ch-body */}
          </div>
        </div>
      )}
    </PrintDialog>
  )
}