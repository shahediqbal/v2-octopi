import { useEffect } from 'react'
import { AlertCircle, Loader2, X } from 'lucide-react'
import { useStockInDetail } from '@/hooks/useStockIn'

interface StockInViewModalProps {
  stockInId: number | null
  onClose: () => void
}

function formatDate(value: string | null | undefined) {
  return value ? value.slice(0, 10) : '—'
}

function formatAmount(value: number | null | undefined) {
  return value != null ? value.toFixed(4) : '—'
}

function getBatchSummary(
  batches: Array<{ batchNo?: string | null; batchNumber?: string | null }> | null | undefined,
) {
  const values = (batches ?? [])
    .map((batch) => batch.batchNo ?? batch.batchNumber ?? null)
    .filter((value): value is string => Boolean(value?.trim()))

  return values.length > 0 ? values.join(', ') : 'No Batches'
}

function getPackSummary(
  packs: Array<{
    packTypeName?: string | null
    sipPackSize?: string | null
    packDetails?: string | null
  }> | null | undefined,
) {
  const values = (packs ?? [])
    .map((pack) => pack.packTypeName ?? pack.sipPackSize ?? pack.packDetails ?? null)
    .filter((value): value is string => Boolean(value?.trim()))

  return values.length > 0 ? values.join(', ') : 'No Maps'
}

function extractErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'body' in error &&
    error.body &&
    typeof error.body === 'object'
  ) {
    const body = error.body as Record<string, unknown>
    for (const candidate of [body.errMsg, body.message, body.title]) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'Failed to load stock-in details.'
}

export function StockInViewModal({ stockInId, onClose }: StockInViewModalProps) {
  const { data: detail, isLoading, isError, error } = useStockInDetail(stockInId ?? undefined)

  useEffect(() => {
    if (stockInId == null) return undefined

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, stockInId])

  if (stockInId == null) {
    return null
  }

  const general = detail?.stockInGeneralData
  const bill = detail?.stockInBillData
  const partnerName = general?.supplierName ?? general?.customerName ?? '—'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Stock-In Detail</h2>
            <p className="mt-1 text-sm text-gray-500">{general?.siSystemNo ?? `Order #${stockInId}`}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close view dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-gray-400" />
              <span className="ml-3 text-sm text-gray-500">Loading stock-in details…</span>
            </div>
          ) : isError || !detail ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{extractErrorMessage(error)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">SI No.</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{general.siSystemNo ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">Invoice No.</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{general.siInvoiceNo ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">Invoice Date</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(general.siInvoiceDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">Order Type</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{general.jobTypeName ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">Partner</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{partnerName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">Source Channel</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{general.siSourceChannelName ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">Destination Channel</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{general.siDestinationChannelName ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">Invoice Received</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {general.siInvoiceReceiveStatus ? 'Yes' : 'No'}
                      {general.siInvoiceReceiveDate ? ` (${formatDate(general.siInvoiceReceiveDate)})` : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500">Remarks</p>
                  <p className="mt-1 text-sm text-gray-700">{general.siRemarks?.trim() || '—'}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3 text-right">Declared Qty</th>
                        <th className="px-4 py-3 text-right">Confirmed Qty</th>
                        <th className="px-4 py-3 text-right">Declared Price</th>
                        <th className="px-4 py-3 text-right">Confirmed Price</th>
                        <th className="px-4 py-3">Strength</th>
                        <th className="px-4 py-3">Batches</th>
                        <th className="px-4 py-3">Maps</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detail.stockInItemsData.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                            No items found.
                          </td>
                        </tr>
                      )}
                      {detail.stockInItemsData.map((item) => (
                        <tr key={`${item.sidId ?? item.sidProductId}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{item.productName || '—'}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{formatAmount(item.sidDeclaredQty)}</td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {item.sidConfirmedQty != null ? formatAmount(item.sidConfirmedQty) : 'Not Provided Yet'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">{formatAmount(item.sidDeclaredUnitPrice)}</td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {item.sidConfirmedUnitPrice != null
                              ? formatAmount(item.sidConfirmedUnitPrice)
                              : 'Not Provided Yet'}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{item.sidProductStrength ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-700">{getBatchSummary(item.sidBatches)}</td>
                          <td className="px-4 py-3 text-gray-700">{getPackSummary(item.sidPacks)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Bill Summary</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">Subtotal</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{formatAmount(bill?.sibCalculatedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">Discount</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{formatAmount(bill?.sibDiscountAmouunt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">Adjustment</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{formatAmount(bill?.sibAdjustedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">Final Total</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatAmount(bill?.sibFinalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">Currency</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{bill?.sibCurrencyName ?? '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}