import { useMemo, useRef, useState } from 'react'
import { X, Loader2, FileText, AlertCircle, Printer, ChevronDown, ChevronRight } from 'lucide-react'
import { useQuotationDetail } from '@/hooks/useQuotation'
import { formatPrintDate } from '@/pages/sales-orders/printUtils'

const quotationViewStyles = `
  .qv * { box-sizing: border-box; }
  .qv { font-family: Arial, Helvetica, sans-serif; color: #111827; background: #fff; }
  .qv-header {
    display: flex; flex-direction: row; justify-content: space-between; align-items: center;
    background: #f8f9fa; width: 100%; padding: 24px 8px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .qv-header-center {
    flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;
  }
  .qv-header h4 { font-weight: 700; margin: 8px 0; font-size: 18px; }
  .qv-header-meta { font-size: 13px; color: #6b7280; font-weight: 700; margin: 2px 0; }
  .qv-header-contact { font-size: 13px; color: #6b7280; font-weight: 700; margin: 4px 0 0; display: flex; gap: 24px; }
  .qv-logo-wrap { padding: 0 20px; display: flex; align-items: center; justify-content: center; }
  .qv-logo-left { width: 85px; height: 60px; object-fit: contain; }
  .qv-logo-right { width: 120px; height: 50px; object-fit: contain; }
  .qv-body { padding: 24px; }
  .qv-title { text-align: center; margin-bottom: 12px; }
  .qv-title span { font-weight: 800; padding: 5px; font-size: 15px; letter-spacing: 0.03em; }
  .qv-info { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 24px; margin-bottom: 40px; min-height: 100px; }
  .qv-info-block div { margin-bottom: 6px; font-size: 14px; }
  .qv-table-wrap { width: 100%; overflow-x: auto; padding: 10px 0; }
  .qv-table { width: 100%; border-collapse: collapse; border: 1px solid #000; }
  .qv-table th { border: 1px solid #000; padding: 8px; font-size: 13px; text-align: left; background: #f2f2f2; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .qv-table td { border: 1px solid #000; padding: 8px; font-size: 13px; text-align: left; vertical-align: top; }
  .qv-table td.qv-price, .qv-table th.qv-price { text-align: right; white-space: nowrap; }
  .qv-notes { padding: 24px; }
  .qv-notes h5 { margin: 0 0 12px; font-size: 16px; font-weight: 700; }
  .qv-notes ul { margin: 0; padding-left: 20px; }
  .qv-notes li { margin-bottom: 8px; font-size: 14px; }
  @page { size: A4; margin: 0; }
  @media print {
    html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .qv-table-wrap { overflow: visible; }
  }
`

type CustomColumnKey =
  | 'productCategoryName'
  | 'functionName'
  | 'groupName'
  | 'hsCode'
  | 'brandName'
  | 'countryOfOrigin'
  | 'productLevel'
  | 'productShelfLife'
  | 'productPackSize'

type NoteKey =
  | 'paymentTerm'
  | 'excludingVatAit'
  | 'exmptedSRO'
  | 'offerValidity'
  | 'deliveryLeadTime'

const customColumnOptions: Array<{ key: CustomColumnKey; label: string; header: string }> = [
  { key: 'productCategoryName', label: 'Categoryname', header: 'Category' },
  { key: 'functionName', label: 'Functionname', header: 'Function' },
  { key: 'groupName', label: 'Groupname', header: 'Group' },
  { key: 'hsCode', label: 'HS Code', header: 'HS Code' },
  { key: 'brandName', label: 'Brandname', header: 'Brand' },
  { key: 'countryOfOrigin', label: 'Origin', header: 'Origin' },
  { key: 'productLevel', label: 'Product Level', header: 'Product Level' },
  { key: 'productShelfLife', label: 'Product Shelf Life', header: 'Shelf Life' },
  { key: 'productPackSize', label: 'Product Pack Size', header: 'Pack Size' },
]

const noteOptions: Array<{ key: NoteKey; label: string }> = [
  { key: 'paymentTerm', label: 'Payment Term' },
  { key: 'excludingVatAit', label: 'Excluding VAT & AIT' },
  { key: 'exmptedSRO', label: '0% Exempted SRO 188' },
  { key: 'offerValidity', label: 'Offer validity' },
  { key: 'deliveryLeadTime', label: 'Delivery Lead time' },
]

function getPriceVatContent(vat: number | null | undefined, ait: number | null | undefined) {
  const normalizedVat = Number(vat ?? 0)
  const normalizedAit = Number(ait ?? 0)

  if (normalizedVat === 0 && normalizedAit === 0) return null
  if (normalizedVat !== 0 && normalizedAit === 0) {
    return `Price Including ${normalizedVat.toFixed(2)}% VAT & Excluding AIT`
  }
  if (normalizedVat === 0 && normalizedAit !== 0) {
    return `Price Excluding VAT & Including ${normalizedAit.toFixed(2)}% AIT`
  }
  return `Price Including ${normalizedVat.toFixed(2)}% VAT & ${normalizedAit.toFixed(2)}% AIT`
}

function formatQuotationAmount(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0)
  if (Number.isNaN(numeric)) {
    return '0.00'
  }
  return numeric.toFixed(2)
}

function escapePrintTitle(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function triggerQuotationPrintPreview(title: string, content: HTMLElement | null) {
  if (!content || typeof window === 'undefined') {
    return false
  }

  const printWindow = window.open('', '_blank', 'width=1024,height=768')
  if (!printWindow) {
    return false
  }

  const printStyles = `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #ffffff; color: #111827; font-family: Arial, Helvetica, sans-serif; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    ${quotationViewStyles}
  `

  printWindow.document.open()
  printWindow.document.write(
    `<!doctype html><html><head><meta charset="utf-8" /><title>${escapePrintTitle(title)}</title><style>${printStyles}</style></head><body>${content.outerHTML}</body></html>`,
  )
  printWindow.document.close()

  const finalizePrint = () => {
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const waitForImages = () => {
    const images = Array.from(printWindow.document.images)
    const pending = images.filter((image) => !image.complete)

    if (pending.length === 0) {
      window.setTimeout(finalizePrint, 300)
      return
    }

    let remaining = pending.length
    const handleSettled = () => {
      remaining -= 1
      if (remaining <= 0) {
        window.setTimeout(finalizePrint, 300)
      }
    }

    pending.forEach((image) => {
      image.addEventListener('load', handleSettled, { once: true })
      image.addEventListener('error', handleSettled, { once: true })
    })

    window.setTimeout(() => {
      if (remaining > 0) {
        finalizePrint()
      }
    }, 1200)
  }

  if (printWindow.document.readyState === 'complete') {
    waitForImages()
  } else {
    printWindow.onload = waitForImages
  }

  return true
}

function ToggleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-700"
      >
        <span>{title}</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && <div className="border-t border-gray-100 px-4 py-3">{children}</div>}
    </div>
  )
}

interface QuotationViewModalProps {
  quotationId: number
  onClose: () => void
}

export function QuotationViewModal({ quotationId, onClose }: QuotationViewModalProps) {
  const { data, isLoading, isError } = useQuotationDetail(quotationId)
  const printRef = useRef<HTMLDivElement | null>(null)
  const [printError, setPrintError] = useState('')
  const [customizeOpen, setCustomizeOpen] = useState(true)
  const [notesOpen, setNotesOpen] = useState(true)
  const [visibleColumns, setVisibleColumns] = useState<Record<CustomColumnKey, boolean>>({
    productCategoryName: false,
    functionName: false,
    groupName: false,
    hsCode: false,
    brandName: false,
    countryOfOrigin: false,
    productLevel: false,
    productShelfLife: false,
    productPackSize: false,
  })
  const [selectedNotes, setSelectedNotes] = useState<Record<NoteKey, boolean>>({
    paymentTerm: false,
    excludingVatAit: false,
    exmptedSRO: false,
    offerValidity: false,
    deliveryLeadTime: false,
  })

  const master = data?.priceQuotationMasterData
  const items = data?.priceQuotationDetailList ?? []
  const currency = master?.pqCurrencyName ?? 'BDT'

  const renderedNotes = useMemo(() => {
    const notes: string[] = []
    const firstItem = items[0]
    const vatNote = getPriceVatContent(firstItem?.pqdAppliedVatPercantage, firstItem?.pqdAppliedAitPercantage)

    if (vatNote) notes.push(vatNote)
    if (selectedNotes.paymentTerm) {
      notes.push('Payment Term- Cash/Cheque/LC within seven days of goods delivery.')
    }
    if (selectedNotes.excludingVatAit) {
      notes.push('Price Excluding VAT & AIT')
    }
    if (selectedNotes.exmptedSRO) {
      notes.push('Exempted as per SRO 188-Ain/2019/45-Mushok')
    }
    if (selectedNotes.offerValidity) {
      notes.push('Offer validity for 15days.')
    }
    if (selectedNotes.deliveryLeadTime) {
      notes.push('Delivery lead time - 24 hours.')
    }

    return notes
  }, [items, selectedNotes])

  const handlePrint = () => {
    setPrintError('')
    const didOpen = triggerQuotationPrintPreview(`price-quotation-${master?.pqSystemNo ?? quotationId}`, printRef.current)
    if (!didOpen) {
      setPrintError('Could not open the print window. Please allow pop-ups and try again.')
    }
  }

  const toggleColumn = (key: CustomColumnKey) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleNote = (key: NoteKey) => {
    setSelectedNotes((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4">
      <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-[1600px] flex-col overflow-hidden rounded-2xl bg-[#f5f6f8] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-gray-500" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">Quotation Details</h2>
              {master && (
                <p className="text-xs text-gray-500">
                  {master.pqSystemNo} · {master.customerName}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          {isLoading && (
            <div className="flex flex-1 items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading quotation…</span>
            </div>
          )}

          {isError && (
            <div className="m-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle size={18} className="mt-0.5 text-red-500" />
              <p className="text-sm text-red-700">Failed to load quotation details.</p>
            </div>
          )}

          {!isLoading && !isError && master && (
            <>
              <aside className="w-full overflow-y-auto border-b border-gray-200 bg-[#eef1f4] px-4 py-4 lg:w-[280px] lg:border-b-0 lg:border-r">
                <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                  >
                    <Printer size={15} /> Print PDF
                  </button>
                  <p className="mt-2 text-xs text-gray-500">
                    Opens the print dialog with the legacy quotation layout so you can print or save as PDF.
                  </p>
                  {printError && <p className="mt-2 text-xs text-red-600">{printError}</p>}
                </div>

                <div className="space-y-3">
                  <ToggleSection
                    title="Customize"
                    open={customizeOpen}
                    onToggle={() => setCustomizeOpen((prev) => !prev)}
                  >
                    <div className="space-y-2">
                      {customColumnOptions.map((option) => (
                        <label key={option.key} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={visibleColumns[option.key]}
                            onChange={() => toggleColumn(option.key)}
                            className="h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </ToggleSection>

                  <ToggleSection
                    title="Notes"
                    open={notesOpen}
                    onToggle={() => setNotesOpen((prev) => !prev)}
                  >
                    <div className="space-y-2">
                      {noteOptions.map((option) => (
                        <label key={option.key} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedNotes[option.key]}
                            onChange={() => toggleNote(option.key)}
                            className="h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </ToggleSection>
                </div>
              </aside>

              <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <style>{quotationViewStyles}</style>
                  <div ref={printRef} className="qv">

                    <div className="qv-header">
                      <div className="qv-logo-wrap">
                        <img src="/images/trade.png" alt="Trade Zentrum" className="qv-logo-left" />
                      </div>
                      <div className="qv-header-center">
                        <h4>TRADE ZENTRUM</h4>
                        <div className="qv-header-meta">
                          Reg. Office: House #21, Road #01, Block-C, Banasree, Rampura
                        </div>
                        <div className="qv-header-contact">
                          <span>&#9990;&nbsp;+8801792 527261</span>
                          <span>&#128233;&nbsp;tradezentrumbd@gmail.com</span>
                        </div>
                      </div>
                      <div className="qv-logo-wrap">
                        <img src="/images/assutext-logo.jpeg" alt="Assutext" className="qv-logo-right" />
                      </div>
                    </div>

                    <div className="qv-body">
                      <div className="qv-title">
                        <span>PRICE QUOTATION</span>
                      </div>

                      <div className="qv-info">
                        <div className="qv-info-block">
                          <div>Quotation Number : {master.pqSystemNo || ''}</div>
                          <div>Date Of Issue: {master.pqOrderDate ? formatPrintDate(master.pqOrderDate) : ''}</div>
                        </div>
                        <div className="qv-info-block">
                          <div>Customer Name : {master.customerName || ''}</div>
                          <div>Customer Address: {master.customerAddress ?? 'Not Available'}</div>
                        </div>
                      </div>

                      <div className="qv-table-wrap">
                        <table className="qv-table">
                          <thead>
                            <tr>
                              <th>PRODUCT NAME</th>
                              {customColumnOptions.map((option) =>
                                visibleColumns[option.key] ? <th key={option.key}>{option.header}</th> : null,
                              )}
                              <th className="qv-price">PRICE/KG</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.length === 0 ? (
                              <tr>
                                <td colSpan={2 + customColumnOptions.filter((option) => visibleColumns[option.key]).length}>
                                  No line items.
                                </td>
                              </tr>
                            ) : (
                              items.map((item, idx) => (
                                <tr key={`${item.pqdProductId}-${idx}`}>
                                  <td>{item.productName}</td>
                                  {customColumnOptions.map((option) => {
                                    if (!visibleColumns[option.key]) {
                                      return null
                                    }

                                    const value = item[option.key]
                                    return <td key={option.key}>{value == null || value === '' ? '—' : String(value)}</td>
                                  })}
                                  <td className="qv-price">{currency} {formatQuotationAmount(item.pqdFinalPrice)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="qv-notes">
                      <h5>Notes:</h5>
                      {renderedNotes.length === 0 ? (
                        <p className="text-sm text-gray-500">No notes selected.</p>
                      ) : (
                        <ul>
                          {renderedNotes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
