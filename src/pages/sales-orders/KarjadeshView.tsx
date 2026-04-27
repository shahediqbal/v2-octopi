import { useRef } from 'react'
import Barcode from 'react-barcode'
import { PrintDialog } from '@/pages/sales-orders/PrintDialog'
import { formatPrintDate, triggerPrintWindow } from '@/pages/sales-orders/printUtils'
import type { StockOutOrderDetail } from '@/types/stockOut'

const karjadeshStyles = `
  .kj * { box-sizing: border-box; }
  .invoice-container {
    max-width: 58mm;
    margin: 0 auto;
    padding: 10px;
    font-family: "Arial Black", "Arial Bold", Gadget, sans-serif;
  }
  .invoice-header {
    text-align: center;
    margin-bottom: 10px;
  }
  .invoice-title {
    font-size: 20px;
    font-weight: 900;
    margin-bottom: 8px;
  }
  .invoice-details {
    font-size: 14px;
    margin-bottom: 12px;
    line-height: 1.3;
  }
  .invoice-details div {
    margin-bottom: 4px;
  }
  .invoice-table {
    width: 100%;
    table-layout: fixed;
    margin-bottom: 15px;
    border-collapse: collapse;
  }
  .invoice-table th,
  .invoice-table td {
    font-size: 14px;
    font-weight: 900;
    padding: 6px 4px;
    border: 1px solid #000;
    vertical-align: top;
  }
  .invoice-table th {
    background-color: #f3f3f3;
    text-align: left;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .product-name-col { width: 70%; white-space: normal; word-break: break-word; line-height: 1.3; }
  .product-qty-col { width: 30%; white-space: nowrap; text-align: center; }
  .mapped-name { font-size: 12px; font-style: italic; display: block; margin-top: 2px; }
  .barcode-container { width: 100%; text-align: center; margin: 15px 0; }
  .kj-notes {
    font-size: 13px;
    padding: 8px;
    background-color: #f3f3f3;
    border-radius: 4px;
    margin-top: 10px;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  @media print {
    @page { size: 58mm auto; margin: 0; }
    body {
      width: 58mm !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: "Arial Black", "Arial Bold", Gadget, sans-serif;
    }
    * { font-weight: 900 !important; }
  }
`

interface KarjadeshViewProps {
  isOpen: boolean
  detail: StockOutOrderDetail | null | undefined
  isLoading?: boolean
  errorMessage?: string
  onClose: () => void
}

export function KarjadeshView({ isOpen, detail, isLoading = false, errorMessage, onClose }: KarjadeshViewProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const general = detail?.stockOutGeneralData

  return (
    <PrintDialog
      isOpen={isOpen}
      title="Packing List"
      subtitle={general?.soSystemNo ?? 'Receipt-style packing list'}
      isLoading={isLoading}
      errorMessage={errorMessage}
      printDisabled={!detail}
      onClose={onClose}
      onPrint={() => triggerPrintWindow(general?.soSystemNo ?? 'packing-list', printRef.current)}
    >
      {detail && (
        <div ref={printRef} className="kj">
          <style>{karjadeshStyles}</style>
          <div className="invoice-container">
            <div className="invoice-header">
              <div className="invoice-title">TRADE ZENTRUM</div>
            </div>

            <div className="invoice-details">
              <div><strong>ORDER TYPE:</strong> {general?.jobTypeName ?? ''}</div>
              <div><strong>INV NO:</strong> {general?.soSystemNo ?? ''}</div>
              <div><strong>DATE:</strong> {formatPrintDate(general?.invoiceDate ?? '')}</div>
              <div>
                <strong>{general?.supplierName ? 'S_NAME:' : 'C_NAME:'}</strong>{' '}
                {general?.supplierName ?? general?.customerName ?? 'N/A'}
              </div>
              <div>
                <strong>{general?.supplierAddress ? 'S_ADDRESS:' : 'C_ADDRESS:'}</strong>{' '}
                {general?.supplierAddress ?? general?.customerAddress ?? 'N/A'}
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th className="product-name-col">PRODUCT NAME</th>
                  <th className="product-qty-col">QTY</th>
                </tr>
              </thead>
              <tbody>
                {detail.stockOutItemsData.map((item, i) => (
                  <tr key={i}>
                    <td className="product-name-col">
                      {item.productName}
                      {item.mappedProductName && (
                        <span className="mapped-name">({item.mappedProductName})</span>
                      )}
                    </td>
                    <td className="product-qty-col">{item.sodConfirmedQty ?? item.sodQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="barcode-container">
              <Barcode
                value={`${general?.soCustomerId}-${general?.soSystemId}`}
                width={1.2}
                height={50}
                fontSize={12}
                margin={0}
                lineColor="#000"
              />
            </div>

            {general?.soRemarks?.trim() && (
              <div className="kj-notes">
                <strong>NOTES:</strong> {general.soRemarks}
              </div>
            )}
          </div>
        </div>
      )}
    </PrintDialog>
  )
}