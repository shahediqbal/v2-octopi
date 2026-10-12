// ============================================================
// Stock-In — Challan Modal
// Shows stock-in challan detail (fetched from API)
// ============================================================
import { useEffect, useRef } from 'react'
import { X, Loader2, AlertCircle, Printer } from 'lucide-react'
import { useStockInChallan } from '@/hooks/useStockIn'

const TRADE_LOGO = '/images/trade.png'
const ASSUTECH_LOGO = '/images/assutext-logo.jpeg'

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getLineQuantity(item: {
  sipPackSize?: number | string | null
  sipPackQty?: number | null
  sidDeclaredQty?: number | null
}): number | null {
  const packSize = toNumber(item.sipPackSize)
  const packQty = toNumber(item.sipPackQty)
  if (packSize != null && packQty != null) {
    return packSize * packQty
  }

  const declaredQty = toNumber(item.sidDeclaredQty)
  return declaredQty != null ? declaredQty : null
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function textOrDash(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : '—'
}

function shouldShowOrderType(orderType: string | null | undefined): boolean {
  return !!orderType && orderType !== 'Cash_Sales' && orderType !== 'Credit_Sales'
}

interface Props {
  stockInId: number
  onClose: () => void
}

export function ChallanModal({ stockInId, onClose }: Props) {
  const challanQuery = useStockInChallan(stockInId)
  const printRef = useRef<HTMLDivElement>(null)
  const challan = challanQuery.data
  const isLoading = challanQuery.isLoading
  const isError = !isLoading && !challan

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handlePrint() {
    if (!printRef.current) return
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>Stock-In Challan</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 24px; }
            .challan-shell { border: 1px solid #e5e7eb; }
            .challan-brand { display: flex; align-items: center; justify-content: space-between; gap: 16px; background: #f3f4f6; padding: 20px 16px; }
            .challan-brand-logo { width: 110px; height: 52px; object-fit: contain; }
            .challan-brand-center { flex: 1; text-align: center; }
            .challan-brand-center h1 { margin: 0 0 8px; font-size: 24px; font-weight: 700; }
            .challan-brand-center p { margin: 0 0 4px; color: #4b5563; }
            .challan-title { padding: 20px 16px 0; text-align: center; }
            .challan-title h2 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.12em; }
            .challan-meta { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; padding: 24px 16px 12px; }
            .challan-meta-block { min-height: 96px; }
            .challan-meta-row { margin-bottom: 8px; }
            .challan-meta-label { font-weight: 700; }
            .challan-content { padding: 0 16px 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px 10px; }
            th { background: #f9fafb; font-weight: 700; }
            .tr { text-align: right; }
            .tc { text-align: center; }
            .total-table { margin-top: 24px; }
            .notes-box { margin-top: 16px; border-radius: 6px; background: #f3f4f6; padding: 12px 16px; }
            .remarks { padding: 8px 16px 0; text-align: center; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-auto rounded-xl bg-white shadow-2xl">
        {/* Modal header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Stock-In Challan</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : isError || !challan ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <p className="text-sm font-medium">Failed to load challan.</p>
            </div>
          ) : (() => {
            const g = challan.stockInGeneralData
            const items = challan.stockInItemsData
            const partnerName = g.supplierName ?? g.customerName
            const partnerAddress = g.supplierAddress ?? g.customerAddress
            const partnerNameLabel = g.supplierName ? 'Supplier Name' : g.customerName ? 'Customer Name' : 'Partner Name'
            const partnerAddressLabel = g.supplierAddress ? 'Supplier Address' : g.customerAddress ? 'Customer Address' : 'Partner Address'
            const orderType = g.jobTypeName
            const totalQuantity = items.reduce((sum, item) => sum + (getLineQuantity(item) ?? 0), 0)
            return (
              <div className="space-y-6">
                <div ref={printRef} className="challan-shell overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="challan-brand flex flex-col items-center justify-between gap-4 bg-gray-100 px-4 py-5 md:flex-row">
                    <div className="flex w-28 items-center justify-center md:w-24">
                      <img src={TRADE_LOGO} alt="Trade Zentrum" className="challan-brand-logo h-[50px] w-[80px] object-contain" />
                    </div>
                    <div className="challan-brand-center flex-1 text-center">
                      <h1 className="text-2xl font-bold tracking-wide text-gray-900">TRADE ZENTRUM</h1>
                      <p className="text-sm font-semibold text-gray-500">
                        Reg. Office: House #21, Road #01, Block-C, Banasree, Rampura, Dhaka
                      </p>
                      <p className="text-sm font-semibold text-gray-500">
                        <span>☎ +8801792 527261</span>
                        <span className="mx-3 hidden md:inline">|</span>
                        <span className="block md:inline">📩 tradezentrumbd@gmail.com</span>
                      </p>
                    </div>
                    <div className="flex w-32 items-center justify-center md:w-28">
                      <img src={ASSUTECH_LOGO} alt="Assutech" className="challan-brand-logo h-[50px] w-[120px] object-contain" />
                    </div>
                  </div>

                  <div className="challan-title px-4 pt-6 text-center">
                    <h2 className="text-xl font-bold tracking-[0.14em] text-gray-900">CHALLAN</h2>
                  </div>

                  <div className="challan-meta grid gap-6 px-4 pb-4 pt-8 text-sm md:grid-cols-[1.4fr_1fr]">
                    <div className="challan-meta-block min-h-[90px] space-y-2 text-gray-800">
                      <div className="challan-meta-row">
                        <span className="challan-meta-label font-semibold">{partnerNameLabel} : </span>
                        <span>{textOrDash(partnerName)}</span>
                      </div>
                      <div className="challan-meta-row">
                        <span className="challan-meta-label font-semibold">{partnerAddressLabel} : </span>
                        <span>{textOrDash(partnerAddress)}</span>
                      </div>
                    </div>

                    <div className="challan-meta-block space-y-2 text-gray-800">
                      <div className="challan-meta-row">
                        <span className="challan-meta-label font-semibold">Challan Number : </span>
                        <span>{textOrDash(g.siSystemNo)}</span>
                      </div>
                      <div className="challan-meta-row">
                        <span className="challan-meta-label font-semibold">Customer Challan Number : </span>
                        <span>{textOrDash(g.siInvoiceNo)}</span>
                      </div>
                      <div className="challan-meta-row">
                        <span className="challan-meta-label font-semibold">Date Of Issue : </span>
                        <span>{formatDate(g.siInvoiceDate)}</span>
                      </div>
                      {shouldShowOrderType(orderType) && (
                        <div className="challan-meta-row">
                          <span className="challan-meta-label font-semibold">Order Type : </span>
                          <span>{textOrDash(orderType)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="challan-content px-4 pb-4">
                    {items.length > 0 ? (
                      <>
                        <div className="overflow-x-auto">
                          <table className="challan-table min-w-full border border-gray-300 text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Product Name</th>
                                <th className="tc px-3 py-2 font-semibold text-gray-700">Pack Size(KG)</th>
                                <th className="tc px-3 py-2 font-semibold text-gray-700">Pack Type</th>
                                <th className="tc px-3 py-2 font-semibold text-gray-700">No of Pack</th>
                                <th className="tc px-3 py-2 font-semibold text-gray-700">Line Quantity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, i) => (
                                <tr key={i}>
                                  <td className="px-3 py-2 text-gray-900">{item.productName}</td>
                                  <td className="tc px-3 py-2 text-gray-700">{item.sipPackSize ?? '—'}</td>
                                  <td className="tc whitespace-nowrap px-3 py-2 text-gray-700">{item.packTypeName ?? '—'}</td>
                                  <td className="tc px-3 py-2 text-gray-700">{item.sipPackQty ?? '—'}</td>
                                  <td className="tc px-3 py-2 text-gray-900">{getLineQuantity(item)?.toFixed(2) ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <table className="total-table mt-8 w-full border border-gray-300 text-sm">
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-3 py-2"></td>
                              <td className="tr border border-gray-300 px-3 py-2 font-semibold text-gray-900">Total Quantity (KG)</td>
                              <td className="tr border border-gray-300 px-3 py-2 font-semibold text-gray-900">{totalQuantity.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </>
                    ) : (
                      <p className="py-8 text-center text-sm text-gray-500">No items found in this challan.</p>
                    )}

                    {challan.notes && (
                      <div className="notes-box mt-4 rounded bg-gray-100 px-4 py-3 text-sm text-gray-700">
                        {challan.notes}
                      </div>
                    )}
                  </div>

                  <div className="remarks px-4 pb-4 pt-1 text-center text-sm text-gray-700">
                    {g.siRemarks ? (
                      <>
                        <span className="font-semibold text-gray-900">Remarks :</span> {g.siRemarks}
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="flex justify-start px-1">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    <Printer className="h-4 w-4" /> Download as PDF
                  </button>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
