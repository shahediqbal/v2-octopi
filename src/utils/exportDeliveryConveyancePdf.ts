import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { DeliveryConveyanceItem } from '@/types/deliveryConveyance'
import { numberToWords } from '@/utils/numberToWords'

export interface DeliveryConveyancePdfOptions {
  startDate: string
  endDate: string
  employeeLabel?: string | null
}

type ImageFormat = 'PNG' | 'JPEG'

interface LoadedImage {
  dataUrl: string
  format: ImageFormat
  width: number
  height: number
}

function formatCurrency(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatBillDate(startDate: string, endDate: string) {
  if (startDate === endDate) return startDate
  return `${startDate} to ${endDate}`
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function resolveInvoiceNo(item: DeliveryConveyanceItem) {
  return item.soSystemNo ?? item.invoiceNo ?? '-'
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

function sanitizeFileValue(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function buildAssetUrl(relativePath: string) {
  const normalized = relativePath.replace(/^\/+/, '')
  return new URL(`${import.meta.env.BASE_URL}${normalized}`, window.location.origin).toString()
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Unable to convert image to data URL'))
    }
    reader.onerror = () => reject(new Error('Unable to read image blob'))
    reader.readAsDataURL(blob)
  })
}

async function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      resolve({ width: image.naturalWidth || image.width || 1, height: image.naturalHeight || image.height || 1 })
    }
    image.onerror = () => reject(new Error('Unable to load image dimensions'))
    image.src = dataUrl
  })
}

async function loadImage(relativePath: string): Promise<LoadedImage | null> {
  try {
    const response = await fetch(buildAssetUrl(relativePath))
    if (!response.ok) return null
    const blob = await response.blob()
    const dataUrl = await blobToDataUrl(blob)
    const dimensions = await getImageDimensions(dataUrl)
    const format = blob.type === 'image/jpeg' ? 'JPEG' : 'PNG'
    return { dataUrl, format, ...dimensions }
  } catch {
    return null
  }
}

function fitImageIntoBox(image: LoadedImage, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height)
  return {
    width: image.width * scale,
    height: image.height * scale,
  }
}

function ensureVerticalSpace(doc: jsPDF, startY: number, requiredHeight: number, marginBottom: number) {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (startY + requiredHeight <= pageHeight - marginBottom) return startY
  doc.addPage()
  return 40
}

export async function exportDeliveryConveyancePdf(
  rows: DeliveryConveyanceItem[],
  options: DeliveryConveyancePdfOptions,
) {
  if (rows.length === 0) return

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 36
  const contentWidth = pageWidth - marginX * 2
  const [tradeLogo, assuLogo] = await Promise.all([
    loadImage('images/trade.png'),
    loadImage('images/assutext-logo.jpeg'),
  ])

  let cursorY = 28

  if (tradeLogo) {
    const tradeSize = fitImageIntoBox(tradeLogo, 80, 50)
    doc.addImage(tradeLogo.dataUrl, tradeLogo.format, marginX, cursorY + (50 - tradeSize.height) / 2, tradeSize.width, tradeSize.height)
  }
  if (assuLogo) {
    const assuSize = fitImageIntoBox(assuLogo, 130, 40)
    doc.addImage(
      assuLogo.dataUrl,
      assuLogo.format,
      pageWidth - marginX - assuSize.width,
      cursorY + (50 - assuSize.height) / 2,
      assuSize.width,
      assuSize.height,
    )
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(17, 24, 39)
  doc.text('TRADE ZENTRUM', pageWidth / 2, cursorY + 20, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(107, 114, 128)
  doc.text('Kunia Targas, Gazipur', pageWidth / 2, cursorY + 38, { align: 'center' })

  cursorY += 64

  doc.setDrawColor(228, 228, 228)
  doc.roundedRect(pageWidth / 2 - 52, cursorY, 104, 20, 3, 3)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(17, 24, 39)
  doc.text('Conveyance Bill', pageWidth / 2, cursorY + 13, { align: 'center' })

  cursorY += 34

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Bill Date : ${formatBillDate(options.startDate, options.endDate)}`, marginX, cursorY)

  cursorY += 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(`Bill By: ${resolveBillBy(rows, options.employeeLabel)}`, marginX, cursorY)

  const tableBody = rows.map((item) => [
    item.taskName ?? '-',
    resolveInvoiceNo(item),
    resolveFactory(item),
    resolveDescription(item),
    resolveStart(item),
    resolveEnd(item),
    item.vehicleName ?? '-',
    formatCurrency(item.taskTransportationCost),
  ])

  autoTable(doc, {
    startY: cursorY + 18,
    head: [['Task Name', 'Invoice Id', 'Factory Name', 'Description', 'From', 'To', 'Transport', 'Fair']],
    body: tableBody,
    theme: 'grid',
    margin: { top: 40, right: marginX, bottom: 30, left: marginX },
    tableWidth: contentWidth,
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 4,
      lineColor: [227, 227, 227],
      lineWidth: 0.5,
      textColor: [17, 24, 39],
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [17, 24, 39],
      fontStyle: 'bold',
      lineColor: [227, 227, 227],
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 67 },
      1: { cellWidth: 55 },
      2: { cellWidth: 67 },
      3: { cellWidth: 100 },
      4: { cellWidth: 52 },
      5: { cellWidth: 52 },
      6: { cellWidth: 52 },
      7: { cellWidth: 50, halign: 'right' },
    },
  })

  const lastAutoTable = doc as jsPDF & { lastAutoTable?: { finalY: number } }
  const totalAmount = rows.reduce((sum, item) => sum + toNumber(item.taskTransportationCost), 0)
  let footerY = ensureVerticalSpace(doc, (lastAutoTable.lastAutoTable?.finalY ?? cursorY) + 22, 70, 40)

  autoTable(doc, {
    startY: footerY,
    body: [['', 'Total Conveyance Amount', formatCurrency(totalAmount)]],
    theme: 'grid',
    margin: { top: 40, right: marginX, bottom: 28, left: marginX },
    tableWidth: contentWidth,
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 6,
      lineColor: [227, 227, 227],
      lineWidth: 0.5,
      textColor: [17, 24, 39],
      overflow: 'linebreak',
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: contentWidth - 220 },
      1: { cellWidth: 145, fontStyle: 'bold' },
      2: { cellWidth: 75, halign: 'right' },
    },
  })

  footerY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? footerY) + 12
  const words = `In Word: ${numberToWords(totalAmount)} Taka only.`
  const wordLines = doc.splitTextToSize(words, contentWidth - 24)
  const wordsBoxHeight = Math.max(30, wordLines.length * 12 + 12)

  footerY = ensureVerticalSpace(doc, footerY, wordsBoxHeight, 40)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(marginX, footerY, contentWidth, wordsBoxHeight, 4, 4, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(wordLines, marginX + 12, footerY + 18)

  const firstInvoice = resolveInvoiceNo(rows[0])
  const fallbackStem = `${options.startDate}_to_${options.endDate}`
  const fileStem = firstInvoice && firstInvoice !== '-' ? sanitizeFileValue(firstInvoice) : sanitizeFileValue(fallbackStem)
  doc.save(`employee-conveyance-${fileStem}.pdf`)
}