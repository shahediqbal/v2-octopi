import type { StockOutGeneralData, StockOutPackagingDetail } from '@/types/stockOut'

const BASE_PRINT_STYLES = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #ffffff; color: #111827; font-family: Arial, Helvetica, sans-serif; }
  body { padding: 24px; }
  button { font: inherit; }
  @page { margin: 0; size: auto; }
`

export function triggerPrintWindow(title: string, content: HTMLElement | null) {
  if (!content || typeof window === 'undefined') {
    return false
  }

  const printWindow = window.open('', '_blank', 'width=1024,height=768')
  if (!printWindow) {
    return false
  }

  const contentHtml = content.outerHTML

  printWindow.document.open()
  printWindow.document.write(
    `<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>${BASE_PRINT_STYLES}</style></head><body>${contentHtml}</body></html>`,
  )
  printWindow.document.close()

  const doPrint = () => {
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  if (printWindow.document.readyState === 'complete') {
    window.setTimeout(doPrint, 300)
  } else {
    printWindow.onload = () => window.setTimeout(doPrint, 300)
  }

  return true
}

export function formatPrintDate(value: string | null | undefined) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatPrintAmount(value: number | string | null | undefined, fractionDigits = 2) {
  const numeric = Number(value ?? 0)
  if (Number.isNaN(numeric)) return '0.00'

  return numeric.toLocaleString('en-BD', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export function getPartnerName(general: Pick<StockOutGeneralData, 'customerName' | 'supplierName'> | Pick<StockOutPackagingDetail, 'customerName' | 'supplierName'>) {
  return general.customerName ?? general.supplierName ?? '—'
}

export function getPartnerAddress(
  general:
    | Pick<StockOutGeneralData, 'customerAddress' | 'supplierAddress'>
    | { customerAddress?: string | null; supplierAddress?: string | null },
) {
  return general.customerAddress ?? general.supplierAddress ?? '—'
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}