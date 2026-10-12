import type { Cell, Worksheet, Workbook } from 'exceljs'
import ExcelJS from 'exceljs'
import type { MonthlyCreditItem, MonthlyCreditLastTransactions } from '@/types/monthlyCreditReport'

const MONTH_METRICS = [
  'Opening Balance',
  'Sales (Gross)',
  'Payment (Gross)',
  'Sales Return',
  'Adjustment',
  'Final Sales',
  'Final Payment',
  'Closing Balance',
] as const

const MONTH_COLORS = [
  'E6F3FF',
  'FFF0E6',
  'E6FFE6',
  'FFF6E6',
  'F0E6FF',
  'E6FFFF',
  'FFE6E6',
  'FFFFE6',
  'F0F0F0',
  'E6F7FF',
  'FFF0F5',
  'F0FFF0',
] as const

const LAST_TRANSACTION_COLOR = 'F5F5DC'
const FIXED_COLUMN_COUNT = 3
const LAST_TRANSACTION_COLUMN_COUNT = 7

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getMonthlyValues(item: MonthlyCreditItem): Record<string, number | null | undefined> {
  return isRecord(item.monthlyValues) ? (item.monthlyValues as Record<string, number | null | undefined>) : {}
}

function getLastTransactions(item: MonthlyCreditItem): MonthlyCreditLastTransactions {
  return isRecord(item.lastTransactions) ? (item.lastTransactions as MonthlyCreditLastTransactions) : {}
}

function toSafeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function toSafeDate(value: unknown): Date | string {
  if (typeof value !== 'string' || !value) return 'N/A'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed
}

function toMonthSortValue(monthName: string): number {
  const parsed = new Date(`1 ${monthName} 2000`)
  return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime()
}

function formatLongDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function columnLetter(index: number): string {
  let result = ''
  let current = index

  while (current > 0) {
    const remainder = (current - 1) % 26
    result = String.fromCharCode(65 + remainder) + result
    current = Math.floor((current - 1) / 26)
  }

  return result
}

function setBorder(cell: Cell, color = '000000') {
  cell.border = {
    top: { style: 'thin', color: { argb: color } },
    left: { style: 'thin', color: { argb: color } },
    bottom: { style: 'thin', color: { argb: color } },
    right: { style: 'thin', color: { argb: color } },
  }
}

function fillCell(cell: Cell, color: string) {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: color },
  }
}

function styleHeaderCell(cell: Cell, color: string, textColor: string, horizontal: 'left' | 'center' = 'center') {
  cell.font = { bold: true, color: { argb: textColor } }
  fillCell(cell, color)
  setBorder(cell)
  cell.alignment = {
    wrapText: true,
    vertical: 'center',
    horizontal,
  }
}

function collectMonths(reportData: MonthlyCreditItem[]): string[] {
  const monthNames = new Set<string>()

  reportData.forEach((item) => {
    Object.keys(getMonthlyValues(item)).forEach((key) => {
      const [monthName] = key.split(' ')
      if (monthName) monthNames.add(monthName)
    })
  })

  return Array.from(monthNames).sort((left, right) => toMonthSortValue(left) - toMonthSortValue(right))
}

function getLastColumnLetter(sortedMonths: string[]): string {
  const totalColumns = FIXED_COLUMN_COUNT + sortedMonths.length * MONTH_METRICS.length + LAST_TRANSACTION_COLUMN_COUNT
  return columnLetter(totalColumns)
}

function applyColumnWidths(worksheet: Worksheet, sortedMonths: string[]) {
  worksheet.columns = [
    { key: 'sl', width: 5 },
    { key: 'customer', width: 30 },
    { key: 'marketing', width: 25 },
    ...Array.from({ length: sortedMonths.length * MONTH_METRICS.length }, () => ({ width: 12 })),
    { key: 'lastSaleAmt', width: 15 },
    { key: 'lastSaleDate', width: 12 },
    { key: 'lastPaymentAmt', width: 15 },
    { key: 'lastPaymentDate', width: 12 },
    { key: 'daysSincePayment', width: 12 },
    { key: 'daysSinceLastSale', width: 12 },
    { key: 'paymentStatus', width: 15 },
  ]
}

async function saveWorkbook(workbook: Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

export async function exportMonthlyCreditReportExcel(
  reportData: MonthlyCreditItem[],
  startDate: string,
  endDate: string,
  employeeId: number,
): Promise<void> {
  if (reportData.length === 0) return

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Credit Summary', {
    views: [{ showGridLines: false }],
  })

  const sortedMonths = collectMonths(reportData)
  const lastColumnLetter = getLastColumnLetter(sortedMonths)

  const reportTitle = worksheet.addRow(['Monthly Credit Summary Report'])
  reportTitle.font = { size: 18, bold: true, color: { argb: '003366' } }
  reportTitle.height = 30
  worksheet.mergeCells(`A1:${lastColumnLetter}1`)
  worksheet.getCell('A1').alignment = { vertical: 'center', horizontal: 'center' }

  if (employeeId && typeof reportData[0]?.marketingName === 'string' && reportData[0].marketingName) {
    const marketingRow = worksheet.addRow([`Marketing Person: ${reportData[0].marketingName}`])
    marketingRow.font = { bold: true }
    worksheet.mergeCells(`A${marketingRow.number}:${lastColumnLetter}${marketingRow.number}`)
  }

  const dateRangeRow = worksheet.addRow([
    `Report Period: ${formatLongDate(startDate)} to ${formatLongDate(endDate)}`,
  ])
  worksheet.mergeCells(`A${dateRangeRow.number}:${lastColumnLetter}${dateRangeRow.number}`)
  worksheet.addRow([])

  const mainHeaderRow = worksheet.addRow([])
  const subHeaderRow = worksheet.addRow([])

  mainHeaderRow.getCell(1).value = 'SL'
  mainHeaderRow.getCell(2).value = 'Customer Name'
  mainHeaderRow.getCell(3).value = 'Marketing Person'

  let currentColumn = 4
  sortedMonths.forEach((month, monthIndex) => {
    MONTH_METRICS.forEach((metric, metricIndex) => {
      if (metricIndex === 0) {
        worksheet.mergeCells(
          mainHeaderRow.getCell(currentColumn).address,
          mainHeaderRow.getCell(currentColumn + MONTH_METRICS.length - 1).address,
        )
        mainHeaderRow.getCell(currentColumn).value = month
        mainHeaderRow.getCell(currentColumn).alignment = {
          horizontal: 'center',
          vertical: 'center',
        }
      }
      subHeaderRow.getCell(currentColumn).value = metric
      currentColumn++
    })
  })

  mainHeaderRow.getCell(currentColumn).value = 'Last Transaction Info'
  worksheet.mergeCells(
    mainHeaderRow.getCell(currentColumn).address,
    mainHeaderRow.getCell(currentColumn + LAST_TRANSACTION_COLUMN_COUNT - 1).address,
  )
  subHeaderRow.getCell(currentColumn).value = 'Last Sale Amount'
  subHeaderRow.getCell(currentColumn + 1).value = 'Last Sale Date'
  subHeaderRow.getCell(currentColumn + 2).value = 'Last Payment Amount'
  subHeaderRow.getCell(currentColumn + 3).value = 'Last Payment Date'
  subHeaderRow.getCell(currentColumn + 4).value = 'Days Since Payment'
  subHeaderRow.getCell(currentColumn + 5).value = 'Days Since Last Sale'
  subHeaderRow.getCell(currentColumn + 6).value = 'Payment Status'

  ;[mainHeaderRow, subHeaderRow].forEach((row, rowIndex) => {
    let headerColumn = 1

    for (let index = 0; index < FIXED_COLUMN_COUNT; index++) {
      styleHeaderCell(row.getCell(headerColumn), rowIndex === 0 ? '003366' : '4F81BD', 'FFFFFF', 'left')
      headerColumn++
    }

    sortedMonths.forEach((_month, monthIndex) => {
      const monthColor = MONTH_COLORS[monthIndex % MONTH_COLORS.length]
      for (let metricIndex = 0; metricIndex < MONTH_METRICS.length; metricIndex++) {
        styleHeaderCell(row.getCell(headerColumn), monthColor, '000000')
        headerColumn++
      }
    })

    for (let index = 0; index < LAST_TRANSACTION_COLUMN_COUNT; index++) {
      styleHeaderCell(row.getCell(headerColumn), LAST_TRANSACTION_COLOR, '000000')
      headerColumn++
    }
  })

  mainHeaderRow.height = 25
  subHeaderRow.height = 40

  const columnTotals = new Map<number, number>()
  const totalColumnColors = new Map<number, string>()

  let trackedColumn = 4
  sortedMonths.forEach((_month, monthIndex) => {
    const monthColor = MONTH_COLORS[monthIndex % MONTH_COLORS.length]
    MONTH_METRICS.forEach(() => {
      totalColumnColors.set(trackedColumn, monthColor)
      trackedColumn++
    })
  })

  totalColumnColors.set(trackedColumn, LAST_TRANSACTION_COLOR)
  totalColumnColors.set(trackedColumn + 2, LAST_TRANSACTION_COLOR)

  reportData.forEach((item, rowIndex) => {
    const dataRow = worksheet.addRow([])
    const monthlyValues = getMonthlyValues(item)
    const lastTransactions = getLastTransactions(item)

    dataRow.getCell(1).value = rowIndex + 1
    dataRow.getCell(2).value = typeof item.customerName === 'string' ? item.customerName : '-'
    dataRow.getCell(3).value = typeof item.marketingName === 'string' ? item.marketingName : '-'

    let dataColumn = 4
    sortedMonths.forEach((_month, monthIndex) => {
      const monthColor = MONTH_COLORS[monthIndex % MONTH_COLORS.length]
      MONTH_METRICS.forEach((metric) => {
        const value = toSafeNumber(monthlyValues[`${sortedMonths[monthIndex]} ${metric}`])
        const cell = dataRow.getCell(dataColumn)
        cell.value = value
        cell.numFmt = '#,##0.00'
        cell.alignment = { horizontal: 'right' }
        fillCell(cell, monthColor)
        setBorder(cell, 'D3D3D3')
        columnTotals.set(dataColumn, (columnTotals.get(dataColumn) ?? 0) + value)
        dataColumn++
      })
    })

    const lastSaleAmount = toSafeNumber(lastTransactions.lastSaleAmount)
    dataRow.getCell(dataColumn).value = lastSaleAmount
    dataRow.getCell(dataColumn).numFmt = '#,##0.00'
    dataRow.getCell(dataColumn).alignment = { horizontal: 'right' }
    fillCell(dataRow.getCell(dataColumn), LAST_TRANSACTION_COLOR)
    columnTotals.set(dataColumn, (columnTotals.get(dataColumn) ?? 0) + lastSaleAmount)
    setBorder(dataRow.getCell(dataColumn), 'D3D3D3')
    dataColumn++

    dataRow.getCell(dataColumn).value = toSafeDate(lastTransactions.lastSaleDate)
    dataRow.getCell(dataColumn).numFmt = 'dd-mmm-yyyy'
    fillCell(dataRow.getCell(dataColumn), LAST_TRANSACTION_COLOR)
    setBorder(dataRow.getCell(dataColumn), 'D3D3D3')
    dataColumn++

    const lastPaymentAmount = toSafeNumber(lastTransactions.lastPaymentAmount)
    dataRow.getCell(dataColumn).value = lastPaymentAmount
    dataRow.getCell(dataColumn).numFmt = '#,##0.00'
    dataRow.getCell(dataColumn).alignment = { horizontal: 'right' }
    fillCell(dataRow.getCell(dataColumn), LAST_TRANSACTION_COLOR)
    columnTotals.set(dataColumn, (columnTotals.get(dataColumn) ?? 0) + lastPaymentAmount)
    setBorder(dataRow.getCell(dataColumn), 'D3D3D3')
    dataColumn++

    dataRow.getCell(dataColumn).value = toSafeDate(lastTransactions.lastPaymentDate)
    dataRow.getCell(dataColumn).numFmt = 'dd-mmm-yyyy'
    fillCell(dataRow.getCell(dataColumn), LAST_TRANSACTION_COLOR)
    setBorder(dataRow.getCell(dataColumn), 'D3D3D3')
    dataColumn++

    dataRow.getCell(dataColumn).value = lastTransactions.daysSinceLastPayment ?? 'N/A'
    fillCell(dataRow.getCell(dataColumn), LAST_TRANSACTION_COLOR)
    setBorder(dataRow.getCell(dataColumn), 'D3D3D3')
    dataColumn++

    dataRow.getCell(dataColumn).value = lastTransactions.daysSinceLastSale ?? 'N/A'
    fillCell(dataRow.getCell(dataColumn), LAST_TRANSACTION_COLOR)
    setBorder(dataRow.getCell(dataColumn), 'D3D3D3')
    dataColumn++

    dataRow.getCell(dataColumn).value = lastTransactions.paymentStatus ?? 'N/A'
    fillCell(dataRow.getCell(dataColumn), LAST_TRANSACTION_COLOR)
    setBorder(dataRow.getCell(dataColumn), 'D3D3D3')
  })

  if (reportData.length > 0) {
    const totalRow = worksheet.addRow([])
    totalRow.getCell(1).value = 'Grand Total'
    worksheet.mergeCells(`A${totalRow.number}:C${totalRow.number}`)
    totalRow.getCell(1).alignment = { horizontal: 'right' }
    totalRow.getCell(1).font = { bold: true }
    setBorder(totalRow.getCell(1))

    columnTotals.forEach((total, columnIndex) => {
      const cell = totalRow.getCell(columnIndex)
      cell.value = total
      cell.numFmt = '#,##0.00'
      cell.font = { bold: true }
      cell.alignment = { horizontal: 'right' }
      fillCell(cell, totalColumnColors.get(columnIndex) ?? LAST_TRANSACTION_COLOR)
      setBorder(cell)
    })

    for (let columnIndex = 4; columnIndex <= FIXED_COLUMN_COUNT + sortedMonths.length * MONTH_METRICS.length + LAST_TRANSACTION_COLUMN_COUNT; columnIndex++) {
      const cell = totalRow.getCell(columnIndex)
      if (cell.value == null || cell.value === '') {
        const fillColor = totalColumnColors.get(columnIndex)
        if (fillColor) fillCell(cell, fillColor)
        setBorder(cell)
      }
    }
  }

  applyColumnWidths(worksheet, sortedMonths)
  worksheet.views = [
    {
      state: 'frozen',
      xSplit: 3,
      ySplit: 5,
      topLeftCell: 'D6',
      showGridLines: false,
    },
  ]

  const footerRow = worksheet.addRow([])
  worksheet.mergeCells(`A${footerRow.number}:${lastColumnLetter}${footerRow.number}`)
  footerRow.getCell(1).value = `Generated on ${new Date().toLocaleString()}`
  footerRow.getCell(1).font = { italic: true, color: { argb: '808080' } }
  footerRow.getCell(1).alignment = { horizontal: 'right' }

  const marketingName = typeof reportData[0]?.marketingName === 'string' ? reportData[0].marketingName : ''
  const safeMarketingName = marketingName.replace(/[^a-zA-Z0-9]/g, '_')
  const suffix = employeeId && safeMarketingName ? `_${safeMarketingName}` : ''

  await saveWorkbook(workbook, `Credit_Summary_${startDate}_to_${endDate}${suffix}`)
}