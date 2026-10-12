import type { StockOutOrderDetail, StockOutPackagingDetail } from '@/types/stockOut'

interface Options {
  type: 'invoice' | 'challan'
  detail: StockOutOrderDetail
  packaging?: StockOutPackagingDetail | null
}

export async function exportErpDocumentDocx({ type, detail, packaging }: Options) {
  const { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } = await import('docx')
  const general = detail.stockOutGeneralData
  const isInvoice = type === 'invoice'
  const title = isInvoice ? 'INVOICE' : 'DELIVERY CHALLAN'
  const customer = general.customerName ?? general.supplierName ?? packaging?.customerName ?? packaging?.supplierName ?? '-'
  const address = general.customerAddress ?? general.supplierAddress ?? '-'
  const documentNo = general.soSystemNo ?? packaging?.soSystemNo ?? String(general.soSystemId)
  const headers = isInvoice
    ? ['SL', 'Product', 'Quantity', 'Unit Price', 'Amount']
    : ['SL', 'Product', 'Order Qty', 'Pack Size', 'Pack Type', 'No. Pack', 'Product Qty']
  const bodyRows = isInvoice
    ? detail.stockOutItemsData.map((item, index) => [
        String(index + 1), item.productName ?? item.mappedProductName ?? '-',
        Number(item.sodConfirmedQty ?? item.sodQty).toLocaleString('en-BD'),
        Number(item.sodUnitPrice ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2 }),
        (Number(item.sodConfirmedQty ?? item.sodQty) * Number(item.sodUnitPrice ?? 0)).toLocaleString('en-BD', { minimumFractionDigits: 2 }),
      ])
    : (packaging?.stockOutPackagingItems ?? []).map((item, index) => [
        String(index + 1), item.productName ?? item.mappedProductName ?? '-',
        Number(item.sodConfirmedQty ?? 0).toLocaleString('en-BD'),
        Number(item.sopPackSize ?? 0).toLocaleString('en-BD'), item.packTypeName ?? '-',
        Number(item.sopNoPack ?? 0).toLocaleString('en-BD'), Number(item.sopProductQty ?? 0).toLocaleString('en-BD'),
      ])
  const rows = [
    new TableRow({ tableHeader: true, children: headers.map((text) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })] })) }),
    ...bodyRows.map((values) => new TableRow({ children: values.map((text) => new TableCell({ children: [new Paragraph(text)] })) })),
  ]
  const children = [
    new Paragraph({ text: 'TRADE ZENTRUM', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: `Document No: ${documentNo}` }),
    new Paragraph({ text: `Date: ${general.invoiceDate ? new Date(general.invoiceDate).toLocaleDateString('en-GB') : '-'}` }),
    new Paragraph({ text: `Customer: ${customer}` }),
    new Paragraph({ text: `Address: ${address}` }),
    new Paragraph(''),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
  ]
  if (isInvoice) children.push(new Paragraph({ text: `Total: ${Number(detail.stockOutBillData.finalBill ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`, alignment: AlignmentType.RIGHT }))
  const document = new Document({ creator: 'Octopi ERP', title: `${documentNo} ${title}`, sections: [{ children }] })
  const blob = await Packer.toBlob(document)
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = `${documentNo}_${isInvoice ? 'Invoice' : 'Challan'}.docx`
  link.click()
  URL.revokeObjectURL(url)
}
