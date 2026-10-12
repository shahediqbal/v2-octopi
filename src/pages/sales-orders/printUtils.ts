import type { StockOutGeneralData, StockOutPackagingDetail } from '@/types/stockOut'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const BASE_PRINT_STYLES = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #ffffff; color: #111827; font-family: Arial, Helvetica, sans-serif; }
  body { margin: 0 auto; }
  button { font: inherit; }
  @page { size: A4 portrait; margin: 12mm 10mm 14mm; }
  @media screen { body { padding: 24px; } }
  @media print {
    html, body { width: auto; min-height: auto; }
    body { padding: 0 !important; }
  }
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

export async function downloadPreviewAsPdf(
  title: string,
  content: HTMLElement | null,
): Promise<boolean> {
  if (!content || typeof document === 'undefined') {
    return false
  }

  const fileName = sanitizeFileName(title || 'document')
  const captureWidth = 794 // A4 width at roughly 96 DPI

  const host = document.createElement('div')
  const clone = content.cloneNode(true) as HTMLElement

  // Remove modal-only negative Tailwind margins.
  clone.classList.remove('-mx-6', '-my-6')

  Object.assign(host.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${captureWidth}px`,
    backgroundColor: '#ffffff',
    overflow: 'visible',
    zIndex: '-1',
  })

  Object.assign(clone.style, {
    width: `${captureWidth}px`,
    maxWidth: `${captureWidth}px`,
    margin: '0',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
  })

  host.appendChild(clone)
  document.body.appendChild(host)

  try {
    await document.fonts?.ready
    await waitForImages(clone)

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      width: captureWidth,
      windowWidth: captureWidth,
      height: clone.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    })

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const marginX = 7
    const marginY = 7
    const printableWidth = pageWidth - marginX * 2
    const printableHeight = pageHeight - marginY * 2

    const pixelsPerMm = canvas.width / printableWidth
    const sliceHeightPx = Math.floor(printableHeight * pixelsPerMm)

    let sourceY = 0
    let pageIndex = 0

    while (sourceY < canvas.height) {
      const currentHeight = Math.min(
        sliceHeightPx,
        canvas.height - sourceY,
      )

      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = currentHeight

      const context = pageCanvas.getContext('2d')

      if (!context) {
        throw new Error('Unable to create PDF canvas.')
      }

      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height)

      context.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        currentHeight,
        0,
        0,
        canvas.width,
        currentHeight,
      )

      if (pageIndex > 0) {
        pdf.addPage('a4', 'portrait')
      }

      const renderedHeightMm = currentHeight / pixelsPerMm
      const imageData = pageCanvas.toDataURL('image/jpeg', 0.96)

      pdf.addImage(
        imageData,
        'JPEG',
        marginX,
        marginY,
        printableWidth,
        renderedHeightMm,
        undefined,
        'FAST',
      )

      sourceY += currentHeight
      pageIndex += 1
    }

    pdf.save(`${fileName}.pdf`)
    return true
  } catch (error) {
    console.error('PDF generation failed:', error)
    return false
  } finally {
    host.remove()
  }
}

async function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(
    container.querySelectorAll<HTMLImageElement>('img'),
  )

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve()
            return
          }

          const finish = () => {
            image.removeEventListener('load', finish)
            image.removeEventListener('error', finish)
            resolve()
          }

          image.addEventListener('load', finish)
          image.addEventListener('error', finish)
        }),
    ),
  )
}

function sanitizeFileName(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
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