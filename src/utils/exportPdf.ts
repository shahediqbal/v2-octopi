import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface PdfColumn {
  key: string
  header: string
  width?: number
  align?: 'left' | 'center' | 'right'
  format?: 'number' | 'integer' | 'date' | 'datetime'
}

export interface ExportPdfOptions {
  fileName: string
  title: string
  subtitle?: string
  columns: PdfColumn[]
  data: Record<string, unknown>[]
  filters?: [string, string | number][]
  summaryCards?: [string, string | number][]
  creator?: string
  orientation?: 'portrait' | 'landscape'
}

const COLORS = {
  title: [17, 24, 39] as const,
  subtitle: [107, 114, 128] as const,
  border: [209, 213, 219] as const,
  headerFill: [31, 41, 55] as const,
  cardFill: [243, 244, 246] as const,
  cardLabel: [107, 114, 128] as const,
  cardValue: [17, 24, 39] as const,
  zebra: [249, 250, 251] as const,
} as const

function formatValue(value: unknown, format?: PdfColumn['format']) {
  if (value === null || value === undefined || value === '') return '-'

  if (format === 'number' || format === 'integer') {
    const num = Number(value)
    if (Number.isNaN(num)) return String(value)
    return num.toLocaleString('en-BD', {
      minimumFractionDigits: format === 'number' ? 2 : 0,
      maximumFractionDigits: format === 'number' ? 2 : 0,
    })
  }

  if (format === 'date' || format === 'datetime') {
    const date = new Date(String(value))
    if (Number.isNaN(date.getTime())) return String(value)
    return format === 'datetime'
      ? date.toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
  }

  return String(value)
}

function resolveAlign(column: PdfColumn) {
  if (column.align) return column.align
  if (column.format === 'number' || column.format === 'integer') return 'right'
  return 'left'
}

function drawSummaryCards(
  doc: jsPDF,
  summaryCards: [string, string | number][],
  startY: number,
  pageWidth: number,
  marginX: number,
) {
  const gap = 10
  const cardsPerRow = Math.min(summaryCards.length, 4)
  const cardWidth = (pageWidth - marginX * 2 - gap * (cardsPerRow - 1)) / cardsPerRow
  const cardHeight = 44

  summaryCards.forEach(([label, value], index) => {
    const row = Math.floor(index / cardsPerRow)
    const col = index % cardsPerRow
    const x = marginX + col * (cardWidth + gap)
    const y = startY + row * (cardHeight + gap)

    doc.setFillColor(...COLORS.cardFill)
    doc.roundedRect(x, y, cardWidth, cardHeight, 6, 6, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.cardLabel)
    doc.text(label, x + 10, y + 15)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...COLORS.cardValue)
    doc.text(String(value), x + 10, y + 31)
  })

  return startY + Math.ceil(summaryCards.length / cardsPerRow) * (cardHeight + gap)
}

export async function exportPdf(options: ExportPdfOptions) {
  const {
    fileName,
    title,
    subtitle,
    columns,
    data,
    filters = [],
    summaryCards = [],
    creator = 'Octopi ERP',
    orientation = 'landscape',
  } = options

  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4', compress: true })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 40
  let cursorY = 40

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...COLORS.title)
  doc.text(title, marginX, cursorY)
  cursorY += 18

  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.subtitle)
    doc.text(subtitle, marginX, cursorY)
    cursorY += 14
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.subtitle)
  doc.text(`Generated ${new Date().toLocaleString()} by ${creator}`, marginX, cursorY)
  cursorY += 18

  if (filters.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.title)
    doc.text('Filters', marginX, cursorY)
    cursorY += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.subtitle)
    filters.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, marginX, cursorY)
      cursorY += 12
    })
    cursorY += 4
  }

  if (summaryCards.length > 0) {
    cursorY = drawSummaryCards(doc, summaryCards, cursorY, pageWidth, marginX)
    cursorY += 4
  }

  const columnStyles = columns.reduce<Record<number, { halign: 'left' | 'center' | 'right'; cellWidth?: number }>>(
    (acc, column, index) => {
      const cellWidth = column.width ? Math.max(column.width * 5.5, 52) : undefined
      acc[index] = {
        halign: resolveAlign(column),
        ...(cellWidth ? { cellWidth } : {}),
      }
      return acc
    },
    {},
  )

  autoTable(doc, {
    startY: cursorY + 10,
    head: [columns.map((column) => column.header)],
    body: data.map((row) => columns.map((column) => formatValue(row[column.key], column.format))),
    margin: { top: 40, right: marginX, bottom: 28, left: marginX },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 6,
      lineColor: COLORS.border,
      lineWidth: 0.5,
      textColor: COLORS.title,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: COLORS.headerFill,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: COLORS.zebra,
    },
    columnStyles,
    didDrawPage: (hookData) => {
      const pageNo = hookData.pageNumber
      doc.setDrawColor(...COLORS.border)
      doc.line(marginX, pageHeight - 20, pageWidth - marginX, pageHeight - 20)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.subtitle)
      doc.text(creator, marginX, pageHeight - 8)
      doc.text(`Page ${pageNo}`, pageWidth - marginX, pageHeight - 8, { align: 'right' })
    },
  })

  doc.save(`${fileName}.pdf`)
}