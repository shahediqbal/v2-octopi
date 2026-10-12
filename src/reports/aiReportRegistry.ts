import { apiClient } from '@/lib/api'
import type { AiReportAction } from '@/types/aiChat'
import type { SalesReportApiResponse, SalesReportItem } from '@/types/salesReport'
import { exportSalesReportDocx } from '@/utils/exportSalesReportDocx'
import { exportSalesReportExcel } from '@/utils/exportSalesReportExcel'
import { exportSalesReportPdf } from '@/utils/exportSalesReportPdf'

export interface SalesChartItem { label: string; amount: number }
export interface AiReportResult { chart?: SalesChartItem[] }

async function getSalesRows(report: AiReportAction) {
  const { startDate, endDate, partnerId = 0 } = report.filters
  const response = await apiClient.get<SalesReportApiResponse<SalesReportItem[]>>(
    `/Report/GetSalesInfoReport?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&parterId=${partnerId}`,
  )
  const rows = response.dataObj ?? []

  if (rows.length === 0) throw new Error('No sales records were found for this report period.')
  return rows
}

function buildMonthlyChart(rows: SalesReportItem[]): SalesChartItem[] {
  const totals = new Map<string, number>()
  for (const row of rows) {
    if (!row.invoiceDate) continue
    const date = new Date(row.invoiceDate)
    if (isNaN(date.getTime())) continue
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    totals.set(key, (totals.get(key) ?? 0) + Number(row.sobFinalBill ?? 0))
  }
  return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, amount]) => ({ label, amount }))
}

export async function runAiReport(report: AiReportAction): Promise<AiReportResult> {
  if (report.reportKey !== 'sales') throw new Error('This report is not registered yet.')
  const rows = await getSalesRows(report)
  const options = { rows, startDate: report.filters.startDate, endDate: report.filters.endDate }

  if (report.format === 'chart') return { chart: buildMonthlyChart(rows) }
  if (report.format === 'excel') await exportSalesReportExcel(options)
  else if (report.format === 'pdf') await exportSalesReportPdf(options)
  else if (report.format === 'docx') await exportSalesReportDocx(options)
  else throw new Error('This report format is not supported yet.')
  return {}
}
