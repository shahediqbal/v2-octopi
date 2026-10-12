import { useRef } from 'react'
import { PrintDialog } from '@/pages/sales-orders/PrintDialog'
import { triggerPrintWindow } from '@/pages/sales-orders/printUtils'
import type { StockOutOrderDetail } from '@/types/stockOut'

const miniStyles = `
  * { box-sizing: border-box; }
  body {
    width: 58mm;
    margin: 0 auto;
    padding: 10px;
    font-family: "Arial Black", "Arial Bold", Gadget, sans-serif;
    font-size: 14px;
    font-weight: 900;
    color: #000;
  }
  .mi-title { text-align: center; font-size: 20px; font-weight: 900; margin-bottom: 8px; }
  .mi-details { font-size: 14px; margin-bottom: 12px; line-height: 1.4; }
  .mi-details div { margin-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  th, td { font-size: 14px; font-weight: 900; padding: 5px 4px; border: 1px solid #000; vertical-align: top; }
  .col-name { width: 70%; word-break: break-word; }
  .col-qty  { width: 30%; text-align: center; }
  .mapped   { font-size: 12px; font-style: italic; display: block; margin-top: 2px; }
  .barcode-wrap { text-align: center; margin: 14px 0; }
  @media print {
    @page { size: 58mm auto; margin: 0; }
    body { width: 58mm !important; margin: 0 !important; padding: 10px !important; }
  }
`

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface MiniInvoiceModalProps {
  isOpen: boolean
  detail: StockOutOrderDetail | null | undefined
  isLoading?: boolean
  errorMessage?: string
  onClose: () => void
}

export function MiniInvoiceModal({ isOpen, detail, isLoading = false, errorMessage, onClose }: MiniInvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const general = detail?.stockOutGeneralData
  const barcodeValue = general ? `${general.soCustomerId}-${general.soSystemId}` : ''
  const partnerName = general?.supplierName ?? general?.customerName ?? ''
  const partnerAddress = general?.supplierAddress ?? general?.customerAddress ?? ''
  const isSupplier = !!general?.supplierName

  return (
    <PrintDialog
      isOpen={isOpen}
      title="Mini Invoice / Packing List"
      subtitle={general?.soSystemNo ?? 'Receipt'}
      isLoading={isLoading}
      errorMessage={errorMessage}
      printDisabled={!detail}
      printLabel="Print Receipt"
      onClose={onClose}
      onPrint={() => triggerPrintWindow(general?.soSystemNo ?? 'mini-invoice', printRef.current)}
    >
      {detail && (
        <div className="flex justify-center">
          <div ref={printRef} style={{ width: '220px', fontFamily: '"Arial Black", Arial, sans-serif', fontSize: '14px', fontWeight: 900 }}>
            <style>{miniStyles}</style>
            <div className="mi-title">TRADE ZENTRUM</div>
            <div className="mi-details">
              <div><strong>ORDER TYPE:</strong> {general?.jobTypeName ?? '—'}</div>
              <div><strong>INV NO:</strong> {general?.soSystemNo ?? '—'}</div>
              <div><strong>DATE:</strong> {formatDate(general?.invoiceDate)}</div>
              <div>
                <strong>{isSupplier ? 'S_NAME:' : 'C_NAME:'}</strong> {partnerName || 'N/A'}
              </div>
              <div>
                <strong>{isSupplier ? 'S_ADDRESS:' : 'C_ADDRESS:'}</strong> {partnerAddress || 'N/A'}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th className="col-name">PRODUCT NAME</th>
                  <th className="col-qty">QTY</th>
                </tr>
              </thead>
              <tbody>
                {detail.stockOutItemsData.map((item, i) => (
                  <tr key={i}>
                    <td className="col-name">
                      {item.productName}
                      {item.mappedProductName && (
                        <span className="mapped">({item.mappedProductName})</span>
                      )}
                    </td>
                    <td className="col-qty">{item.sodQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {barcodeValue && (
              <div className="barcode-wrap" style={{ fontSize: '10px' }}>
                <div style={{ fontWeight: 700, letterSpacing: '2px', fontSize: '11px' }}>{barcodeValue}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </PrintDialog>
  )
}
