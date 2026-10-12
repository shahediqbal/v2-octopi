import { useMemo, useRef, useState } from 'react'
import { PrintDialog } from '@/pages/sales-orders/PrintDialog'
import { formatPrintAmount, triggerPrintWindow } from '@/pages/sales-orders/printUtils'
import type { DeliveryConveyanceItem } from '@/types/deliveryConveyance'
import { numberToWords } from '@/utils/numberToWords'

interface DeliveryConveyancePrintModalProps {
  isOpen: boolean
  rows: DeliveryConveyanceItem[]
  startDate: string
  endDate: string
  employeeLabel?: string | null
  onClose: () => void
}

const conveyancePrintStyles = `
  * { box-sizing: border-box; }
  .dc-preview-page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 12mm 10mm 14mm;
    background: #ffffff;
    color: #111827;
    font-family: Arial, Helvetica, sans-serif;
    box-shadow: 0 12px 36px rgba(15, 23, 42, 0.08);
  }
  .dc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .dc-logo-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }
  .dc-logo-slot--trade {
    width: 92px;
    height: 54px;
  }
  .dc-logo-slot--assu {
    width: 140px;
    height: 48px;
  }
  .dc-logo-slot img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    object-position: center;
    display: block;
  }
  .dc-company {
    flex: 1 1 auto;
    text-align: center;
  }
  .dc-company h1 {
    margin: 0;
    font-size: 19px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .dc-company p {
    margin: 6px 0 0;
    color: #6b7280;
    font-size: 13px;
    font-weight: 700;
  }
  .dc-bill-title {
    width: fit-content;
    margin: 20px auto 18px;
    border: 1px solid #e4e4e4;
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 700;
  }
  .dc-meta {
    margin-bottom: 24px;
  }
  .dc-meta-date {
    font-size: 12px;
    margin-bottom: 8px;
  }
  .dc-meta-billby {
    font-size: 18px;
    font-weight: 700;
  }
  .dc-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #e3e3e3;
    font-size: 11px;
  }
  .dc-table th,
  .dc-table td {
    border: 1px solid #e3e3e3;
    padding: 6px 7px;
    text-align: left;
    vertical-align: top;
    word-break: break-word;
  }
  .dc-table th {
    font-size: 12px;
    font-weight: 700;
    background: #ffffff;
  }
  .dc-table td:last-child,
  .dc-table th:last-child {
    text-align: right;
    white-space: nowrap;
  }
  .dc-total-table {
    width: 100%;
    margin-top: 24px;
    border-collapse: collapse;
    border: 1px solid #e3e3e3;
    font-size: 12px;
  }
  .dc-total-table td {
    border: 1px solid #e3e3e3;
    padding: 8px 10px;
  }
  .dc-total-table td:first-child {
    width: 58%;
  }
  .dc-total-table td:nth-child(2) {
    width: 27%;
    font-weight: 700;
  }
  .dc-total-table td:last-child {
    width: 15%;
    text-align: right;
  }
  .dc-words {
    margin-top: 16px;
    padding: 12px 14px;
    border-radius: 10px;
    background: #f8fafc;
    font-size: 12px;
  }
  @media screen {
    .dc-preview-page {
      max-width: 100%;
    }
  }
  @media print {
    @page { size: A4 portrait; margin: 12mm 10mm 14mm; }
    .dc-preview-page {
      width: auto;
      min-height: auto;
      margin: 0;
      padding: 0;
      box-shadow: none;
    }
  }
`

function resolveInvoiceNo(item: DeliveryConveyanceItem | undefined) {
  if (!item) return 'delivery-conveyance'
  return item.soSystemNo ?? item.invoiceNo ?? 'delivery-conveyance'
}

function resolveDescription(item: DeliveryConveyanceItem) {
  return item.taskDescription ?? item.description ?? '-'
}

function resolveFactory(item: DeliveryConveyanceItem) {
  return item.taskDestination ?? item.taskDestinationAddress ?? '-'
}

function resolveStart(item: DeliveryConveyanceItem) {
  return item.taskTransportationStartLocation ?? item.startLocation ?? '-'
}

function resolveEnd(item: DeliveryConveyanceItem) {
  return item.taskTransportationEndLocation ?? item.endLocation ?? '-'
}

function resolveBillBy(rows: DeliveryConveyanceItem[], employeeLabel?: string | null) {
  return rows[0]?.billBy ?? employeeLabel ?? rows[0]?.employeeName ?? 'All Employees'
}

function formatBillDate(startDate: string, endDate: string) {
  if (startDate === endDate) return startDate
  return `${startDate} to ${endDate}`
}

export function DeliveryConveyancePrintModal({
  isOpen,
  rows,
  startDate,
  endDate,
  employeeLabel,
  onClose,
}: DeliveryConveyancePrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const totalAmount = useMemo(
    () => rows.reduce((sum, item) => sum + Number(item.taskTransportationCost ?? 0), 0),
    [rows],
  )

  const handleDownload = async () => {
    if (rows.length === 0) return
    setIsDownloading(true)
    try {
      const { exportDeliveryConveyancePdf } = await import('@/utils/exportDeliveryConveyancePdf')
      await exportDeliveryConveyancePdf(rows, { startDate, endDate, employeeLabel })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <PrintDialog
      isOpen={isOpen}
      title="Delivery Conveyance"
      subtitle={`Conveyance Bill${employeeLabel ? ` • ${employeeLabel}` : ''}`}
      printDisabled={rows.length === 0}
      printLabel="Print This Out"
      secondaryActionLabel={isDownloading ? 'Generating PDF…' : 'Download PDF'}
      secondaryActionDisabled={rows.length === 0 || isDownloading}
      onClose={onClose}
      onSecondaryAction={handleDownload}
      onPrint={() => triggerPrintWindow(resolveInvoiceNo(rows[0]), printRef.current)}
    >
      <div className="flex justify-center">
        <div ref={printRef} className="dc-preview-page">
          <style>{conveyancePrintStyles}</style>

          <div className="dc-header">
            <div className="dc-logo-slot dc-logo-slot--trade">
              <img src={`${import.meta.env.BASE_URL}images/trade.png`} alt="Trade Zentrum" />
            </div>
            <div className="dc-company">
              <h1>TRADE ZENTRUM</h1>
              <p>Kunia Targas, Gazipur</p>
            </div>
            <div className="dc-logo-slot dc-logo-slot--assu">
              <img src={`${import.meta.env.BASE_URL}images/assutext-logo.jpeg`} alt="Assutext" />
            </div>
          </div>

          <div className="dc-bill-title">Conveyance Bill</div>

          <div className="dc-meta">
            <div className="dc-meta-date">Bill Date : {formatBillDate(startDate, endDate)}</div>
            <div className="dc-meta-billby">Bill By: {resolveBillBy(rows, employeeLabel)}</div>
          </div>

          <table className="dc-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Invoice Id</th>
                <th>Factory Name</th>
                <th>Description</th>
                <th>From</th>
                <th>To</th>
                <th>Transport</th>
                <th>Fair</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr key={`${resolveInvoiceNo(item)}-${index}`}>
                  <td>{item.taskName ?? '-'}</td>
                  <td>{resolveInvoiceNo(item)}</td>
                  <td>{resolveFactory(item)}</td>
                  <td>{resolveDescription(item)}</td>
                  <td>{resolveStart(item)}</td>
                  <td>{resolveEnd(item)}</td>
                  <td>{item.vehicleName ?? '-'}</td>
                  <td>{formatPrintAmount(item.taskTransportationCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table className="dc-total-table">
            <tbody>
              <tr>
                <td />
                <td>Total Conveyance Amount</td>
                <td>{formatPrintAmount(totalAmount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="dc-words">In Word: {numberToWords(totalAmount)} Taka only.</div>
        </div>
      </div>
    </PrintDialog>
  )
}