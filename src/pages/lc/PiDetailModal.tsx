import { X, Loader2, AlertCircle, FileText } from 'lucide-react'
import { usePiDetail } from '@/hooks/useLcTracking'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { PiProductDetail } from '@/types/lcTracking'

interface Props {
  piId: number
  onClose: () => void
}

const STATUS_LABELS: Record<number, string> = {
  0: 'Draft',
  1: 'Submitted',
  2: 'LC Created',
  3: 'Payment Done',
}

export function PiDetailModal({ piId, onClose }: Props) {
  const { data, isLoading, isError } = usePiDetail(piId)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">Proforma Invoice Details</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 size={26} className="animate-spin text-gray-400" />
            </div>
          ) : isError || !data ? (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle size={18} className="mt-0.5 text-red-500" />
              <p className="text-sm text-red-700">Failed to load PI details.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs uppercase font-medium text-gray-400">PI Number</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">{data.piNumber}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-medium text-gray-400">Customer</p>
                  <p className="mt-0.5 text-sm text-gray-900">{data.customerName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-medium text-gray-400">Date</p>
                  <p className="mt-0.5 text-sm text-gray-600">
                    {data.piDate ? formatDate(data.piDate) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase font-medium text-gray-400">Status</p>
                  <p className="mt-0.5 text-sm text-gray-600">
                    {STATUS_LABELS[data.piStatus ?? 0] ?? 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase font-medium text-gray-400">Currency</p>
                  <p className="mt-0.5 text-sm text-gray-600">{data.piCurrency}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-medium text-gray-400">Conversion Rate</p>
                  <p className="mt-0.5 text-sm text-gray-600">{data.piConversionRate ?? 1}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-medium text-gray-400">Reference</p>
                  <p className="mt-0.5 text-sm text-gray-600">{data.piRef || '—'}</p>
                </div>
              </div>

              {/* Products */}
              {Array.isArray(data.piProductDetailsInfo) && data.piProductDetailsInfo.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Products</h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                          <th className="px-4 py-2.5 text-left">Product</th>
                          <th className="px-4 py-2.5 text-right">Qty</th>
                          <th className="px-4 py-2.5 text-right">Price</th>
                          <th className="px-4 py-2.5 text-right">Conv. Rate</th>
                          <th className="px-4 py-2.5 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {data.piProductDetailsInfo.map((item: PiProductDetail, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 font-medium text-gray-900">{item.productName ?? item.piProductId}</td>
                            <td className="px-4 py-2.5 text-right text-gray-600">{item.piProductQuantity}</td>
                            <td className="px-4 py-2.5 text-right text-gray-700">
                              {formatCurrency(item.piProductPrice, data.piCurrency)}
                            </td>
                            <td className="px-4 py-2.5 text-right text-gray-600">{item.piProductPriceConvertionRate}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                              {formatCurrency(item.piLineTotalAmount, data.piCurrency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Conditions (if present) */}
              {data.piConditions && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Conditions</h3>
                  <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                    {Object.entries(data.piConditions).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-1.5 text-xs text-gray-700">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${val ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        {key.replace(/([A-Z])/g, ' $1').replace(/^piCondition/, '').trim()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {data.piNote && (
                <div>
                  <p className="text-xs uppercase font-medium text-gray-400">Notes</p>
                  <p className="mt-0.5 text-sm text-gray-700">{data.piNote}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
