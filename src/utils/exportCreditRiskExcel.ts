import ExcelJS from 'exceljs'
import type { CreditRiskAnalysisRow } from './creditRiskAnalysis'

export async function exportCreditRiskExcel(rows: CreditRiskAnalysisRow[], startDate: string, endDate: string) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Customer Risk')
  sheet.addRow(['Customer Credit Risk Analysis'])
  sheet.addRow([`Behaviour period: ${startDate} to ${endDate}; recovery cycle: 60 days`])
  sheet.addRow([])
  sheet.addRow(['Customer', 'Marketing', 'Class', 'Risk', 'Opening', 'Sales', 'Payment', 'Closing', 'Recovery %', 'Orders', 'Payments', 'Days Since Payment', 'Last Sale', 'Last Payment'])
  rows.forEach(row => sheet.addRow([row.customerName, row.marketingName, row.activityClass, row.riskLevel, row.opening, row.sales, row.payment, row.closing, row.recoveryRate, row.orderCount ?? 'N/A', row.paymentCount ?? 'N/A', row.daysSinceLastPayment ?? 'N/A', row.lastSaleDate ?? '', row.lastPaymentDate ?? '']))
  sheet.getRow(1).font = { bold: true, size: 16 }
  sheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }
  sheet.columns = [28, 24, 16, 12, 14, 14, 14, 14, 12, 10, 10, 18, 14, 14].map(width => ({ width }))
  for (let index = 5; index <= sheet.rowCount; index += 1) {
    const risk = sheet.getCell(index, 4).value
    sheet.getCell(index, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: risk === 'High' ? 'FFFECACA' : risk === 'Medium' ? 'FFFEF3C7' : 'FFD1FAE5' } }
  }
  sheet.autoFilter = { from: 'A4', to: 'N4' }
  sheet.views = [{ state: 'frozen', ySplit: 4 }]
  const buffer = await workbook.xlsx.writeBuffer()
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `customer-credit-risk-${endDate}.xlsx`; anchor.click()
  URL.revokeObjectURL(url)
}
