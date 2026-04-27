import type { ExportExcelOptions } from '@/utils/exportExcel'

export async function exportExcelOnDemand(options: ExportExcelOptions) {
  const { exportExcel } = await import('@/utils/exportExcel')
  return exportExcel(options)
}