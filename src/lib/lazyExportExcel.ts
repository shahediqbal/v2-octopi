import ExcelJS from 'exceljs'

interface ExportOptions {
  filename: string
  sheetName: string
  headers: string[]
  rows: (string | number | null | undefined)[][]
}

export async function lazyExportExcel({ filename, sheetName, headers, rows }: ExportOptions) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(sheetName)

  ws.addRow(headers)
  rows.forEach((row) => ws.addRow(row))

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
