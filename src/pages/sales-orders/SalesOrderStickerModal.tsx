import { useRef } from 'react'
import { PrintDialog } from '@/pages/sales-orders/PrintDialog'
import { triggerPrintWindow } from '@/pages/sales-orders/printUtils'
import type { StockOutOrderDetail, StockOutPackagingDetail } from '@/types/stockOut'

const stickerStyles = `
  .so-stickers * { box-sizing: border-box; }
  .so-stickers {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 10px;
  }
  .so-sticker {
    width: 402px;
    max-width: 402px;
    height: 218px;
    max-height: 218px;
    border: 1px solid #000;
    padding: 10px;
    display: flex;
    flex-direction: column;
    row-gap: 4px;
    page-break-inside: avoid;
    font-family: Arial, Helvetica, sans-serif;
  }
  .so-sticker__base {
    display: flex;
    flex-direction: column;
  }
  .so-sticker__top {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding-left: 20px;
    padding-top: 6px;
  }
  .so-sticker__address {
    padding-top: 4px;
    padding-left: 20px;
  }
  .so-sticker__address p {
    font-size: 8px;
    font-weight: bold;
    margin: 0;
  }
  .so-sticker__product {
    padding: 6px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }
  .so-sticker__info-row {
    display: flex;
    column-gap: 4px;
  }
  .so-sticker__info-label {
    font-size: 10px;
    font-weight: bold;
  }
  .so-sticker__info-value {
    font-size: 10px;
    font-weight: bold;
    letter-spacing: 2px;
  }
  .so-sticker__footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-left: 20px;
    padding-right: 20px;
    font-size: 8px;
    font-weight: bold;
    margin: 12px 0 0;
  }
  .so-sticker__partner {
    font-size: 10px;
  }
  .so-sticker__date {
    font-size: 6px;
  }
  @media print {
    @page { margin: 5mm; size: auto; }
  }
`

interface SalesOrderStickerModalProps {
  isOpen: boolean
  packagingDetail: StockOutPackagingDetail | null | undefined
  orderDetail?: StockOutOrderDetail | null | undefined
  isLoading?: boolean
  errorMessage?: string
  onClose: () => void
}

export function SalesOrderStickerModal({
  isOpen,
  packagingDetail,
  orderDetail,
  isLoading = false,
  errorMessage,
  onClose,
}: SalesOrderStickerModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const general = orderDetail?.stockOutGeneralData
  const jobType = general?.jobTypeName ?? packagingDetail?.jobType
  const isSampleIssue = jobType === 'Sample_Issue'
  const partnerName = general?.supplierName ?? general?.customerName ?? packagingDetail?.supplierName ?? packagingDetail?.customerName
  const invoiceNo = general?.soSystemNo ?? packagingDetail?.soSystemNo
  const today = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <PrintDialog
      isOpen={isOpen}
      title="Product Stickers"
      subtitle={invoiceNo ?? 'Printable package labels'}
      isLoading={isLoading}
      errorMessage={errorMessage}
      printDisabled={!packagingDetail}
      onClose={onClose}
      onPrint={() => triggerPrintWindow(invoiceNo ?? 'stickers', printRef.current)}
    >
      {packagingDetail && (
        <div ref={printRef} className="so-stickers">
          <style>{stickerStyles}</style>
          {packagingDetail.stockOutPackagingItems.map((item, index) => (
            <div key={`${item.sopProductId}-${index}`} className="so-sticker">
              <div className="so-sticker__base">
                <div className="so-sticker__top">
                  <img
                    src="/images/trade.png"
                    alt="Trade Zentrum"
                    width="50"
                    height="20"
                    style={{ alignSelf: 'flex-start' }}
                  />
                  <img
                    src="/images/assutext-logo.jpeg"
                    alt="Assutext"
                    width="80"
                    height="25"
                    style={{ alignSelf: 'flex-end', marginRight: '10px' }}
                  />
                </div>

                <div className="so-sticker__address">
                  <p>Kunia, Targas, Gazipur</p>
                  <p>01792 527261, tradezentrumbd@gmail.com</p>
                </div>
              </div>

              <div className="so-sticker__product">
                <div>
                  <div className="so-sticker__info-row">
                    <span className="so-sticker__info-label">Product Name :</span>
                    <span className="so-sticker__info-value">&nbsp;{item.productName}</span>
                  </div>
                  <div className="so-sticker__info-row">
                    <span className="so-sticker__info-label">Weight :</span>
                    <span className="so-sticker__info-label">&nbsp;{item.sopProductQty} KG</span>
                  </div>
                  {!isSampleIssue && (
                    <div className="so-sticker__info-row">
                      <span style={{ fontSize: '8px', fontWeight: 'bold' }}>Lot :</span>
                      <span></span>
                    </div>
                  )}
                  {!isSampleIssue && (
                    <div className="so-sticker__info-row">
                      <span style={{ fontSize: '8px', fontWeight: 'bold' }}>Date :</span>
                      <span></span>
                    </div>
                  )}
                </div>
              </div>

              <div className="so-sticker__footer">
                <div>
                  {partnerName && <strong className="so-sticker__partner">{partnerName}</strong>}
                  {invoiceNo && <span style={{ fontSize: '8px' }}> ({invoiceNo})</span>}
                </div>
                <div className="so-sticker__date">{today}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PrintDialog>
  )
}