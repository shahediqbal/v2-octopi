/**
 * Global reusable Excel export utility for all reports.
 *
 * Usage:
 *   import { exportExcel } from '@/utils/exportExcel'
 *
 *   exportExcel({
 *     fileName: 'Mapping_Report_2026-03-01',
 *     title: 'Mapping Report',
 *     subtitle: '01/03/2026 to 02/03/2026',
 *     columns: [ { key: 'soSystemNo', header: 'Invoice No' }, ... ],
 *     data: filteredData,
 *     filters: [['Date Range','01/03/2026 - 02/03/2026'], ['Customer','All']],
 *     summaryCards: [['Total Records', 100], ['Filtered', 85]],
 *     numericKeys: ['sodRequestedQty','sodConfirmedQty'],
 *     dateKeys: ['invoiceDate'],
 *   })
 */
import type { Border, CellValue, Workbook, Worksheet } from 'exceljs'
import ExcelJS from 'exceljs'

/* ─── public types ─── */

export interface ExcelColumn {
  /** Object key in each data row */
  key: string
  /** Display header text */
  header: string
  /** Column width override (auto-sized if omitted) */
  width?: number
  /**
   * How to format the column:
   * - 'number'   → right-aligned, #,##0.00
   * - 'integer'  → right-aligned, #,##0
   * - 'date'     → yyyy-mm-dd
   * - 'datetime' → yyyy-mm-dd hh:mm
   * - undefined  → left-aligned text
   */
  format?: 'number' | 'integer' | 'date' | 'datetime'
}

export interface ExportExcelOptions {
  /** File name (without .xlsx) */
  fileName: string
  /** Bold title in row 1 */
  title: string
  /** Optional subtitle in row 2 (e.g. date range, filtered-by) */
  subtitle?: string
  /** Column definitions in display order */
  columns: ExcelColumn[]
  /** Data rows — plain objects keyed by ExcelColumn.key */
  data: Record<string, unknown>[]
  /**
   * Optional filter pairs shown in a "Parameters" sheet.
   * e.g. [['Date Range', '01/03/2026 – 02/03/2026'], ['Customer', 'All']]
   */
  filters?: [string, string | number][]
  /**
   * Optional summary cards rendered above the table.
   * e.g. [['Total Records', 100], ['Filtered', 85]]
   */
  summaryCards?: [string, string | number][]
  /** Keys of columns that contain numbers (shortcut instead of per-column format) */
  numericKeys?: string[]
  /** Keys of columns that contain dates (shortcut) */
  dateKeys?: string[]
  /** Sheet name (default: 'Report') */
  sheetName?: string
  /** Creator metadata */
  creator?: string
}

/* ─── colour palette (Octopi brand-neutral grays) ─── */

const COLORS = {
  titleFont: 'FF1F2937',       // gray-800
  subtitleFont: 'FF6B7280',    // gray-500
  headerBg: 'FFE5E7EB',        // gray-200
  headerFont: 'FF111827',      // gray-900
  borderColor: 'FFD1D5DB',     // gray-300
  zebraFill: 'FFF9FAFB',       // gray-50
  summaryBg: 'FFF3F4F6',       // gray-100
  summaryLabel: 'FF6B7280',    // gray-500
  summaryValue: 'FF111827',    // gray-900
} as const

/* ─── number formats ─── */
const FMT: Record<string, string> = {
  number: '#,##0.00',
  integer: '#,##0',
  date: 'yyyy-mm-dd',
  datetime: 'yyyy-mm-dd hh:mm',
}

function colLetter(idx: number): string {
  let s = ''
  let n = idx
  while (n > 0) {
    n--
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26)
  }
  return s
}

function autosizeColumns(
  ws: Worksheet,
  columns: ExcelColumn[],
  data: Record<string, unknown>[],
) {
  const MIN = 10
  const MAX = 50
  columns.forEach((col, idx) => {
    if (col.width) {
      ws.getColumn(idx + 1).width = col.width
      return
    }
    let w = Math.max(col.header.length, MIN)
    for (const row of data) {
      const v = row[col.key]
      const len = v === null || v === undefined ? 0 : String(v).length
      w = Math.max(w, len)
    }
    ws.getColumn(idx + 1).width = Math.min(w + 3, MAX)
  })
}

function applyBorders(
  ws: Worksheet,
  fromRow: number,
  toRow: number,
  fromCol: number,
  toCol: number,
) {
  const border: Partial<Border> = { style: 'thin', color: { argb: COLORS.borderColor } }
  for (let r = fromRow; r <= toRow; r++) {
    for (let c = fromCol; c <= toCol; c++) {
      ws.getCell(r, c).border = { top: border, left: border, bottom: border, right: border }
    }
  }
}

function applyZebraStripes(ws: Worksheet, fromRow: number, toRow: number) {
  for (let r = fromRow; r <= toRow; r++) {
    if (r % 2 === 0) {
      ws.getRow(r).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.zebraFill },
      }
    }
  }
}

function saveWorkbook(workbook: Workbook, fileName: string) {
  return workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${fileName}.xlsx`
    link.click()
    URL.revokeObjectURL(link.href)
  })
}

function resolveFormat(col: ExcelColumn, numericKeys?: string[], dateKeys?: string[]): string | undefined {
  if (col.format) return FMT[col.format]
  if (numericKeys?.includes(col.key)) return FMT.number
  if (dateKeys?.includes(col.key)) return FMT.date
  return undefined
}

function isNumericFormat(fmt: string | undefined): boolean {
  return fmt === FMT.number || fmt === FMT.integer
}

/* ─── main export function ─── */

export async function exportExcel(opts: ExportExcelOptions): Promise<void> {
  const {
    fileName,
    title,
    subtitle,
    columns,
    data,
    filters,
    summaryCards,
    numericKeys,
    dateKeys,
    sheetName = 'Report',
    creator = 'Octopi ERP',
  } = opts

  const colCount = columns.length
  const lastColLetter = colLetter(colCount)

  /* workbook */
  const wb = new ExcelJS.Workbook()
  wb.creator = creator
  wb.created = new Date()

  let currentRow = 1

  /* worksheet */
  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 0 }], // will update ySplit below
  })

  /* ── Row 1: Title ── */
  ws.mergeCells(`A${currentRow}:${lastColLetter}${currentRow}`)
  const titleCell = ws.getCell(`A${currentRow}`)
  titleCell.value = title
  titleCell.font = { size: 16, bold: true, color: { argb: COLORS.titleFont } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' }
  ws.getRow(currentRow).height = 28
  currentRow++

  /* ── Row 2: Subtitle ── */
  if (subtitle) {
    ws.mergeCells(`A${currentRow}:${lastColLetter}${currentRow}`)
    const subCell = ws.getCell(`A${currentRow}`)
    subCell.value = subtitle
    subCell.font = { size: 11, italic: true, color: { argb: COLORS.subtitleFont } }
    subCell.alignment = { horizontal: 'left' }
    currentRow++
  }

  /* ── Row 3: Generated timestamp ── */
  ws.mergeCells(`A${currentRow}:${lastColLetter}${currentRow}`)
  const tsCell = ws.getCell(`A${currentRow}`)
  tsCell.value = `Generated: ${new Date().toLocaleString()}`
  tsCell.font = { size: 9, italic: true, color: { argb: COLORS.subtitleFont } }
  tsCell.alignment = { horizontal: 'left' }
  currentRow++

  /* ── Summary cards row ── */
  if (summaryCards && summaryCards.length > 0) {
    currentRow++ // blank spacer
    const summaryRow = currentRow
    summaryCards.forEach((card, idx) => {
      const cell = ws.getCell(summaryRow, idx + 1)
      cell.value = `${card[0]}: ${card[1]}`
      cell.font = { size: 10, bold: true, color: { argb: COLORS.summaryValue } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.summaryBg },
      }
      cell.alignment = { horizontal: 'center' }
    })
    ws.getRow(summaryRow).height = 22
    currentRow++
  }

  /* blank spacer before table */
  currentRow++

  /* ── Header row ── */
  const headerRow = currentRow
  const headerRowObj = ws.getRow(headerRow)
  headerRowObj.values = columns.map((c) => c.header)
  headerRowObj.height = 24
  headerRowObj.font = { bold: true, size: 11, color: { argb: COLORS.headerFont } }
  headerRowObj.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }

  // header background
  for (let c = 1; c <= colCount; c++) {
    ws.getCell(headerRow, c).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.headerBg },
    }
  }

  /* freeze panes at header */
  ws.views = [{ state: 'frozen', ySplit: headerRow }]

  currentRow++

  /* ── Data rows ── */
  const dataStartRow = currentRow
  const colFormats = columns.map((col) => resolveFormat(col, numericKeys, dateKeys))

  data.forEach((row) => {
    const rowObj = ws.getRow(currentRow)
    const values: CellValue[] = columns.map((col) => {
      const v = row[col.key]
      return v === undefined || v === null ? '' : (v as CellValue)
    })
    rowObj.values = values

    // apply per-cell formatting
    columns.forEach((_col, idx) => {
      const cell = ws.getCell(currentRow, idx + 1)
      const fmt = colFormats[idx]
      if (fmt) {
        cell.numFmt = fmt
      }
      cell.alignment = {
        horizontal: isNumericFormat(fmt) ? 'right' : 'left',
        vertical: 'middle',
        wrapText: true,
      }
    })
    currentRow++
  })

  const dataEndRow = currentRow - 1

  /* ── Styling ── */
  autosizeColumns(ws, columns, data)
  applyBorders(ws, headerRow, dataEndRow, 1, colCount)
  applyZebraStripes(ws, dataStartRow, dataEndRow)

  /* ── Footer row (record count) ── */
  currentRow++
  ws.mergeCells(`A${currentRow}:${lastColLetter}${currentRow}`)
  const footerCell = ws.getCell(`A${currentRow}`)
  footerCell.value = `Total Records: ${data.length}`
  footerCell.font = { size: 10, bold: true, color: { argb: COLORS.subtitleFont } }
  footerCell.alignment = { horizontal: 'left' }

  /* ── Parameters sheet (if filters provided) ── */
  if (filters && filters.length > 0) {
    const ps = wb.addWorksheet('Parameters')
    ps.addRow(['Parameter', 'Value'])
    ps.getRow(1).font = { bold: true }
    filters.forEach(([label, value]) => {
      ps.addRow([label, value])
    })
    ps.addRow(['Generated At', new Date().toISOString()])
    ps.addRow(['Generated By', creator])
    ps.columns = [{ width: 25 }, { width: 60 }]
  }

  /* ── Save ── */
  await saveWorkbook(wb, fileName)
}
