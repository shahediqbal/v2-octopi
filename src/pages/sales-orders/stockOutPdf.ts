import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type {
  StockOutItemData,
  StockOutOrderDetail,
} from '@/types/stockOut'

export type StockOutPdfType = 'invoice' | 'challan'

const COMPANY_NAME = 'TRADE ZENTRUM'
const COMPANY_ADDRESS =
  'Reg. Office: House #21, Road #01, Block-C, Banasree, Rampura, Dhaka'
const COMPANY_CONTACT =
  'Phone: +8801792 527261  |  Email: tradezentrumbd@gmail.com'

function numberValue(value: unknown): number {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatAmount(value: unknown, digits = 2): string {
  return numberValue(value).toLocaleString('en-BD', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function formatDateOnly(value?: string | null): string {
  if (!value) return '—'

  const dateOnly = String(value).slice(0, 10)

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const [year, month, day] = dateOnly.split('-')

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    return `${day}-${months[Number(month) - 1] ?? month}-${year}`
  }

  return String(value)
}

function sanitizeFileName(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
}

function getPartnerName(detail: StockOutOrderDetail): string {
  const general = detail.stockOutGeneralData

  return (
    general.customerName?.trim() ||
    general.supplierName?.trim() ||
    '—'
  )
}

function getPartnerAddress(detail: StockOutOrderDetail): string {
  const general = detail.stockOutGeneralData

  return (
    general.customerAddress?.trim() ||
    general.supplierAddress?.trim() ||
    '—'
  )
}

function getPartnerLabel(detail: StockOutOrderDetail): string {
  return detail.stockOutGeneralData.supplierName
    ? 'Supplier'
    : 'Customer'
}

function getBatchSummary(item: StockOutItemData): string {
  if (Array.isArray(item.sodBatches)) {
    const batchNumbers = item.sodBatches
      .map((batch) => batch.batchNo?.trim())
      .filter((value): value is string => Boolean(value))

    if (batchNumbers.length > 0) {
      return batchNumbers.join(', ')
    }
  }

  if (
    typeof item.sodBatches === 'string' &&
    item.sodBatches.trim()
  ) {
    return item.sodBatches.trim()
  }

  if (item.sodRealatedBatchNo?.trim()) {
    return item.sodRealatedBatchNo.trim()
  }

  return '—'
}

function getMappedProductSummary(
  item: StockOutItemData,
): string {
  if (item.mappedProductName?.trim()) {
    return item.mappedProductName.trim()
  }

  if (item.sodMappedProductId) {
    return `Product #${item.sodMappedProductId}`
  }

  return '—'
}

function getLineTotal(item: StockOutItemData): number {
  const calculated = numberValue(
    item.sodFinalCalculatedUnitPrice,
  )

  if (calculated !== 0) {
    return calculated
  }

  return (
    numberValue(item.sodQty) *
    numberValue(item.sodUnitPrice)
  )
}

function getTotalQuantity(
  detail: StockOutOrderDetail,
): number {
  return detail.stockOutItemsData.reduce(
    (total, item) => total + numberValue(item.sodQty),
    0,
  )
}

function drawDocumentHeader(
  doc: jsPDF,
  documentType: StockOutPdfType,
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 14

  doc.setFillColor(248, 249, 250)
  doc.rect(0, 0, pageWidth, 32, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(17, 24, 39)
  doc.text(COMPANY_NAME, pageWidth / 2, y, {
    align: 'center',
  })

  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(75, 85, 99)
  doc.text(COMPANY_ADDRESS, pageWidth / 2, y, {
    align: 'center',
  })

  y += 5
  doc.text(COMPANY_CONTACT, pageWidth / 2, y, {
    align: 'center',
  })

  y = 42

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(17, 24, 39)
  doc.text(
    documentType === 'invoice' ? 'INVOICE' : 'CHALLAN',
    pageWidth / 2,
    y,
    { align: 'center' },
  )

  return y + 10
}

function drawInformationSection(
  doc: jsPDF,
  detail: StockOutOrderDetail,
  documentType: StockOutPdfType,
  startY: number,
): number {
  const general = detail.stockOutGeneralData
  const pageWidth = doc.internal.pageSize.getWidth()

  const leftX = 14
  const rightX = pageWidth / 2 + 8
  const valueOffset = 28

  let leftY = startY
  let rightY = startY

  const drawLeftLine = (
    label: string,
    value: string | number | null | undefined,
  ) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(`${label}:`, leftX, leftY)

    doc.setFont('helvetica', 'normal')
    const text = String(value ?? '—')
    const lines = doc.splitTextToSize(
      text,
      pageWidth / 2 - valueOffset - 20,
    )

    doc.text(lines, leftX + valueOffset, leftY)
    leftY += Math.max(lines.length * 4, 5)
  }

  const drawRightLine = (
    label: string,
    value: string | number | null | undefined,
  ) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(`${label}:`, rightX, rightY)

    doc.setFont('helvetica', 'normal')
    const text = String(value ?? '—')
    const lines = doc.splitTextToSize(
      text,
      pageWidth - rightX - valueOffset - 14,
    )

    doc.text(lines, rightX + valueOffset, rightY)
    rightY += Math.max(lines.length * 4, 5)
  }

  const partnerLabel = getPartnerLabel(detail)

  drawLeftLine(
    `${partnerLabel} Name`,
    getPartnerName(detail),
  )
  drawLeftLine(
    `${partnerLabel} Address`,
    getPartnerAddress(detail),
  )
  drawLeftLine(
    'Marketing',
    general.marketingPersonnel || '—',
  )

  if (general.soCustomerReferance?.trim()) {
    drawLeftLine(
      'Customer Ref.',
      general.soCustomerReferance,
    )
  }

  drawRightLine(
    documentType === 'invoice'
      ? 'Invoice No.'
      : 'Challan No.',
    general.soSystemNo || general.soSystemId,
  )
  drawRightLine(
    'Date',
    formatDateOnly(
      general.invoiceDate ?? general.dateOfIssue,
    ),
  )
  drawRightLine(
    'Order Type',
    general.jobTypeName?.replaceAll('_', ' ') || '—',
  )

  if (general.soRelatedLcId?.trim()) {
    drawRightLine('Related LC', general.soRelatedLcId)
  }

  return Math.max(leftY, rightY) + 4
}

function addPageFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages()

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    doc.setDrawColor(209, 213, 219)
    doc.line(
      14,
      pageHeight - 13,
      pageWidth - 14,
      pageHeight - 13,
    )

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(107, 114, 128)

    doc.text(
      'This is a computer-generated document.',
      14,
      pageHeight - 8,
    )

    doc.text(
      `Page ${page} of ${pageCount}`,
      pageWidth - 14,
      pageHeight - 8,
      { align: 'right' },
    )
  }
}

function generateInvoicePdf(
  doc: jsPDF,
  detail: StockOutOrderDetail,
  startY: number,
): void {
  const bill = detail.stockOutBillData
  const currency = bill.sobCurrencyName || 'BDT'

  autoTable(doc, {
    startY,
    margin: {
      left: 14,
      right: 14,
      bottom: 20,
    },
    head: [[
      'SL',
      'Product',
      'Batch',
      'Mapped Product',
      'Qty',
      'Unit Price',
      'Amount',
    ]],
    body: detail.stockOutItemsData.map((item, index) => [
      index + 1,
      item.productName || `Product #${item.sodProductId}`,
      getBatchSummary(item),
      getMappedProductSummary(item),
      formatAmount(item.sodQty),
      formatAmount(item.sodUnitPrice),
      formatAmount(getLineTotal(item)),
    ]),
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.5,
      overflow: 'linebreak',
      valign: 'middle',
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 47 },
      2: { cellWidth: 29 },
      3: { cellWidth: 37 },
      4: { cellWidth: 16, halign: 'right' },
      5: { cellWidth: 23, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
    },
  })

  const tableEndY =
    (doc as jsPDF & {
      lastAutoTable?: { finalY: number }
    }).lastAutoTable?.finalY ?? startY

  const pageWidth = doc.internal.pageSize.getWidth()
  const summaryLabelX = pageWidth - 75
  const summaryValueX = pageWidth - 14

  let y = tableEndY + 8

  const drawAmountLine = (
    label: string,
    value: number,
    isBold = false,
  ) => {
    doc.setFont(
      'helvetica',
      isBold ? 'bold' : 'normal',
    )
    doc.setFontSize(isBold ? 9 : 8)

    doc.text(label, summaryLabelX, y)
    doc.text(
      `${currency} ${formatAmount(value)}`,
      summaryValueX,
      y,
      { align: 'right' },
    )

    y += 6
  }

  drawAmountLine(
    'Subtotal',
    numberValue(bill.calculatedBill),
  )
  drawAmountLine(
    'Discount',
    numberValue(bill.billDiscountAmount),
  )
  drawAmountLine(
    `VAT (${formatAmount(bill.billVatPercantage)}%)`,
    numberValue(bill.calculatedBill) *
      (numberValue(bill.billVatPercantage) / 100),
  )
  drawAmountLine(
    `AIT (${formatAmount(bill.billAitPercantage)}%)`,
    numberValue(bill.calculatedBill) *
      (numberValue(bill.billAitPercantage) / 100),
  )
  drawAmountLine(
    'Adjustment',
    numberValue(bill.billAdjustmentAmount),
  )

  doc.setDrawColor(156, 163, 175)
  doc.line(summaryLabelX, y - 2, summaryValueX, y - 2)

  drawAmountLine(
    'Final Bill',
    numberValue(bill.finalBill),
    true,
  )

  const remarks = detail.stockOutGeneralData.soRemarks?.trim()

  if (remarks) {
    y += 3

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('Remarks:', 14, y)

    doc.setFont('helvetica', 'normal')
    const remarkLines = doc.splitTextToSize(
      remarks,
      pageWidth - 48,
    )

    doc.text(remarkLines, 33, y)
  }
}

function generateChallanPdf(
  doc: jsPDF,
  detail: StockOutOrderDetail,
  startY: number,
): void {
  autoTable(doc, {
    startY,
    margin: {
      left: 14,
      right: 14,
      bottom: 34,
    },
    head: [[
      'SL',
      'Product',
      'Batch',
      'Mapped Product',
      'Quantity',
      'Remarks',
    ]],
    body: detail.stockOutItemsData.map((item, index) => [
      index + 1,
      item.productName || `Product #${item.sodProductId}`,
      getBatchSummary(item),
      getMappedProductSummary(item),
      formatAmount(item.sodQty),
      item.itemRemark?.trim() || '—',
    ]),
    foot: [[
      '',
      'Total Quantity',
      '',
      '',
      formatAmount(getTotalQuantity(detail)),
      '',
    ]],
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'middle',
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    footStyles: {
      fillColor: [243, 244, 246],
      textColor: [17, 24, 39],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 35 },
      3: { cellWidth: 43 },
      4: { cellWidth: 23, halign: 'right' },
      5: { cellWidth: 25 },
    },
  })

  const tableEndY =
    (doc as jsPDF & {
      lastAutoTable?: { finalY: number }
    }).lastAutoTable?.finalY ?? startY

  const pageHeight = doc.internal.pageSize.getHeight()
  let y = Math.min(tableEndY + 14, pageHeight - 62)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Received By:', 14, y)

  y += 14
  doc.setFont('helvetica', 'normal')
  doc.text('Signature: __________________________', 14, y)
  y += 9
  doc.text('Name: ______________________________', 14, y)
  y += 9
  doc.text('Mobile Number: ______________________', 14, y)

  const remarks = detail.stockOutGeneralData.soRemarks?.trim()

  if (remarks) {
    doc.setFont('helvetica', 'bold')
    doc.text('Remarks:', 110, y - 18)

    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(remarks, 82)
    doc.text(lines, 110, y - 13)
  }
}

export function generateStockOutPdf(
  detail: StockOutOrderDetail,
  type: StockOutPdfType,
): void {
  if (!detail?.stockOutGeneralData) {
    throw new Error('Stock-out order detail is required.')
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const headerEndY = drawDocumentHeader(doc, type)

  const informationEndY = drawInformationSection(
    doc,
    detail,
    type,
    headerEndY,
  )

  if (type === 'invoice') {
    generateInvoicePdf(doc, detail, informationEndY)
  } else {
    generateChallanPdf(doc, detail, informationEndY)
  }

  addPageFooter(doc)

  const systemNo =
    detail.stockOutGeneralData.soSystemNo ||
    String(detail.stockOutGeneralData.soSystemId)

  const fileType =
    type === 'invoice' ? 'Invoice' : 'Challan'

  doc.save(
    `${sanitizeFileName(systemNo)}_${fileType}.pdf`,
  )
}