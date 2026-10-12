import type { SalesReportItem } from '@/types/salesReport'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'

const SALES_EXCEL_COLUMNS = [
  { key: 'soSystemId', header: 'System Id' },
  { key: 'soSystemNo', header: 'Invoice No' },
  { key: 'invoiceDate', header: 'Invoice Date', format: 'date' as const },
  { key: 'entityName', header: 'Entity Name' },
  { key: 'entityAddress', header: 'Entity Address' },
  { key: 'sobFinalBill', header: 'Invoice Amount', format: 'number' as const },
  { key: 'jobType', header: 'Type Of Sales' },
  { key: 'lifecycleName', header: 'Current Status' },
  { key: 'soOrderFrom', header: 'Generated From' },
  { key: 'orderStatus', header: 'Order Status' },
  { key: 'atEscalation', header: 'Order Escalation At', format: 'datetime' as const },
  { key: 'atInvoicing', header: 'Invoicing At', format: 'datetime' as const },
  { key: 'atPacking', header: 'Packing At', format: 'datetime' as const },
  { key: 'atAssign', header: 'Assign At', format: 'datetime' as const },
  { key: 'atDelivery', header: 'Delivery Started At', format: 'datetime' as const },
  { key: 'delivered', header: 'Delivered At', format: 'datetime' as const },
  { key: 'deliveredBy', header: 'Delivered By' },
  { key: 'actionTakenRemarks', header: 'Remarks' },
  { key: 'soCustomerReferance', header: 'Customer Referance' },
] as const

function formatDate(value: string) {
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

interface ExportSalesReportExcelOptions {
  rows: SalesReportItem[]
  startDate: string
  endDate: string
  customerLabel?: string | null
}

export async function exportSalesReportExcel({
  rows,
  startDate,
  endDate,
  customerLabel,
}: ExportSalesReportExcelOptions) {
  const uniqueCustomers = new Set(rows.map((row) => row.entityName).filter(Boolean)).size
  const uniqueStatuses = new Set(rows.map((row) => row.lifecycleName).filter(Boolean)).size
  const data = rows.map((row) => ({
    ...row,
    soSystemId: row.soSystemId == null ? '' : String(row.soSystemId),
  }))

  await exportExcelOnDemand({
    fileName: `Sales_Report_${startDate}_to_${endDate}`,
    title: 'Sales Report',
    subtitle: `${formatDate(startDate)} to ${formatDate(endDate)}`,
    sheetName: 'Sales Report',
    columns: [...SALES_EXCEL_COLUMNS],
    data: data as unknown as Record<string, unknown>[],
    filters: [
      ['Date Range', `${formatDate(startDate)} – ${formatDate(endDate)}`],
      ['Customer', customerLabel || 'All'],
    ],
    summaryCards: [
      ['Total Records', rows.length],
      ['Unique Customers', uniqueCustomers],
      ['Unique Statuses', uniqueStatuses],
    ],
  })
}
