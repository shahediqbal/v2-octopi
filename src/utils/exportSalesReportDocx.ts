import type { SalesReportItem } from '@/types/salesReport'

interface Options { rows: SalesReportItem[]; startDate: string; endDate: string }

export async function exportSalesReportDocx({ rows, startDate, endDate }: Options) {
  const { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } = await import('docx')
  const total = rows.reduce((sum, row) => sum + Number(row.sobFinalBill ?? 0), 0)
  const header = ['Invoice No', 'Invoice Date', 'Customer', 'Amount', 'Sales Type', 'Status']
  const tableRows = [
    new TableRow({ tableHeader: true, children: header.map((text) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })] })) }),
    ...rows.map((row) => new TableRow({ children: [
      row.soSystemNo ?? '-',
      row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString('en-GB') : '-',
      row.entityName ?? '-',
      Number(row.sobFinalBill ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2 }),
      row.jobType ?? '-', row.lifecycleName ?? '-',
    ].map((text) => new TableCell({ children: [new Paragraph(String(text))] })) })),
  ]
  const document = new Document({ creator: 'Octopi ERP', title: 'Sales Report', sections: [{ children: [
    new Paragraph({ text: 'Sales Report', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: `${startDate} to ${endDate}`, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: `Total Records: ${rows.length}` }),
    new Paragraph({ text: `Total Sales: ${total.toLocaleString('en-BD', { minimumFractionDigits: 2 })}` }),
    new Paragraph(''),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }),
  ] }] })
  const blob = await Packer.toBlob(document)
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = `Sales_Report_${startDate}_to_${endDate}.docx`
  link.click()
  URL.revokeObjectURL(url)
}
