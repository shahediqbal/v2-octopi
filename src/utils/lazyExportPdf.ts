import type { ExportPdfOptions } from '@/utils/exportPdf'

export async function exportPdfOnDemand(options: ExportPdfOptions) {
  const { exportPdf } = await import('@/utils/exportPdf')
  return exportPdf(options)
}