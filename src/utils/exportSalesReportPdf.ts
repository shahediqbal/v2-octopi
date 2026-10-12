import type { SalesReportItem } from '@/types/salesReport'
import { exportPdfOnDemand } from '@/utils/lazyExportPdf'

interface Options { rows: SalesReportItem[]; startDate: string; endDate: string }

export async function exportSalesReportPdf({ rows, startDate, endDate }: Options) {
  const total = rows.reduce((sum, row) => sum + Number(row.sobFinalBill ?? 0), 0)
  await exportPdfOnDemand({
    fileName: `Sales_Report_${startDate}_to_${endDate}`,
    title: 'Sales Report', subtitle: `${startDate} to ${endDate}`, orientation: 'landscape',
    columns: [
      { key: 'soSystemNo', header: 'Invoice No' },
      { key: 'invoiceDate', header: 'Invoice Date', format: 'date' },
      { key: 'entityName', header: 'Customer' },
      { key: 'sobFinalBill', header: 'Amount', format: 'number', align: 'right' },
      { key: 'jobType', header: 'Sales Type' },
      { key: 'lifecycleName', header: 'Status' },
      { key: 'deliveredBy', header: 'Delivered By' },
    ],
    data: rows as unknown as Record<string, unknown>[],
    filters: [['Date Range', `${startDate} – ${endDate}`]],
    summaryCards: [['Total Records', rows.length], ['Total Sales', total.toLocaleString('en-BD', { minimumFractionDigits: 2 })]],
  })
}
