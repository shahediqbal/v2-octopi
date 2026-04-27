// ============================================================
// Stock-In — Challan Modal
// Shows stock-in challan detail (fetched from API)
// ============================================================
import { useEffect, useMemo, useRef } from 'react'
import { X, Loader2, AlertCircle, Printer } from 'lucide-react'
import { useStockInChallan, useStockInDetail } from '@/hooks/useStockIn'

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

interface Props {
  stockInId: number
  onClose: () => void
}

export function ChallanModal({ stockInId, onClose }: Props) {
  const detailQuery = useStockInDetail(stockInId)
  const challanQuery = useStockInChallan(
    stockInId,
    !detailQuery.isLoading && !detailQuery.data,
  )
  const printRef = useRef<HTMLDivElement>(null)

  const challan = useMemo(() => {
    if (detailQuery.data) {
      return {
        stockInGeneralData: detailQuery.data.stockInGeneralData,
        stockInBillData: detailQuery.data.stockInBillData,
        stockInItemsData:
          challanQuery.data?.stockInItemsData?.length
            ? challanQuery.data.stockInItemsData
            : detailQuery.data.stockInItemsData,
      }
    }

    return challanQuery.data
  }, [challanQuery.data, detailQuery.data])

  const isLoading = detailQuery.isLoading || (!detailQuery.data && challanQuery.isLoading)
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
            body { font-family: sans-serif; font-size: 12px; color: #111; margin: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
            th { background: #f0f0f0; font-weight: 600; }
            .header-section { margin-bottom: 16px; }
            .header-section p { margin: 2px 0; }
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
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl bg-white shadow-2xl">
        {/* Modal header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Stock-In Challan</h2>
          <div className="flex items-center gap-2">
            {!isLoading && !isError && (
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
            )}
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
            const b = challan.stockInBillData
            const hasPackBreakdown = items.some(
              (item) => item.sipPackSize != null || item.sipPackQty != null || item.packTypeName != null,
            )
            const totalQuantity = items.reduce((sum, item) => sum + (getLineQuantity(item) ?? 0), 0)
            const showBillSummary =
              !!detailQuery.data
              || [
                b.sibCalculatedAmount,
                b.sibDiscountAmouunt,
                b.sibAdjustedAmount,
                b.sibFinalAmount,
              ].some((value) => value !== 0)
            return (
              <div ref={printRef} className="space-y-6">
                {/* Header info */}
                <div className="header-section grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">SI No.</p>
                    <p className="font-medium text-gray-900">{g.siSystemNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Invoice No.</p>
                    <p className="font-medium text-gray-900">{g.siInvoiceNo ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Invoice Date</p>
                    <p className="font-medium text-gray-900">{g.siInvoiceDate?.slice(0, 10) ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Order Type</p>
                    <p className="font-medium text-gray-900">{g.jobTypeName ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Partner</p>
                    <p className="font-medium text-gray-900">{g.supplierName ?? g.customerName ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Source → Destination</p>
                    <p className="font-medium text-gray-900">
                      {g.siSourceChannelName ?? '—'} → {g.siDestinationChannelName ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Items table */}
                {items && items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-600">
                        <tr>
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">Product</th>
                          {hasPackBreakdown ? (
                            <>
                              <th className="px-3 py-2 text-right">Pack Size</th>
                              <th className="px-3 py-2 text-left">Pack Type</th>
                              <th className="px-3 py-2 text-right">No. of Pack</th>
                              <th className="px-3 py-2 text-right">Line Qty</th>
                            </>
                          ) : (
                            <>
                              <th className="px-3 py-2 text-right">Qty</th>
                              <th className="px-3 py-2 text-right">Unit Price</th>
                              <th className="px-3 py-2 text-right">Total</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((item, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                            <td className="px-3 py-2 text-gray-900">{item.productName}</td>
                            {hasPackBreakdown ? (
                              <>
                                <td className="px-3 py-2 text-right text-gray-700">{item.sipPackSize ?? '—'}</td>
                                <td className="px-3 py-2 text-gray-700">{item.packTypeName ?? '—'}</td>
                                <td className="px-3 py-2 text-right text-gray-700">{item.sipPackQty ?? '—'}</td>
                                <td className="px-3 py-2 text-right font-medium text-gray-900">
                                  {getLineQuantity(item)?.toFixed(2) ?? '—'}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-3 py-2 text-right text-gray-700">{item.sidDeclaredQty ?? '—'}</td>
                                <td className="px-3 py-2 text-right text-gray-700">
                                  {item.sidDeclaredUnitPrice != null
                                    ? item.sidDeclaredUnitPrice.toFixed(4)
                                    : '—'}
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-gray-900">
                                  {item.sidDeclaredQty != null && item.sidDeclaredUnitPrice != null
                                    ? ((item.sidDeclaredQty ?? 0) * (item.sidDeclaredUnitPrice ?? 0)).toFixed(2)
                                    : '—'}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No items found in this challan.</p>
                )}

                {items.length > 0 && (
                  <div className="ml-auto w-64 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between font-semibold text-gray-900">
                      <span>Total Quantity</span>
                      <span>{totalQuantity.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {g.siRemarks && (
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                    <span className="font-medium text-gray-900">Remarks:</span> {g.siRemarks}
                  </div>
                )}

                {/* Bill summary */}
                {b && showBillSummary && (
                  <div className="ml-auto w-60 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        {b.sibCalculatedAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-red-600">
                        -{b.sibDiscountAmouunt?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Adjustment</span>
                      <span className="font-medium">
                        {b.sibAdjustedAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold">
                      <span>Final Amount</span>
                      <span>
                        {b.sibFinalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
