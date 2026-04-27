import { X, Loader2, AlertCircle, FileText } from 'lucide-react'
import { useLcDetail } from '@/hooks/useLcTracking'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Props {
  lcDocId: number
  onClose: () => void
}

export function LcDocumentDetailModal({ lcDocId, onClose }: Props) {
  const { data, isLoading, isError } = useLcDetail(lcDocId)

  const dateRow = (label: string, value?: string | null) => (
    <div>
      <p className="text-xs uppercase font-medium text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-gray-700">{value ? formatDate(value) : '—'}</p>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">LC Document Details</h2>
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
              <p className="text-sm text-red-700">Failed to load LC document details.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase font-medium text-gray-400">LC Number</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">{data.lcNumber ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-medium text-gray-400">LC Amount</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">
                    {formatCurrency(data.lcAmount ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase font-medium text-gray-400">LC Date</p>
                  <p className="mt-0.5 text-sm text-gray-700">
                    {data.lcDate ? formatDate(data.lcDate) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase font-medium text-gray-400">IBC Number</p>
                  <p className="mt-0.5 text-sm text-gray-700">{data.ibcNumber ?? '—'}</p>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Document Timeline
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {dateRow('Prepared', data.docPrepDate)}
                  {dateRow('Submitted', data.docSumbitDate)}
                  {dateRow('Customer Accepted', data.docCustomerAcceptedDate)}
                  {dateRow('Beneficiary Submission', data.docBenificerySubmissionDate)}
                  {dateRow('Bank Acceptance', data.bankAcceptanceDate)}
                  {dateRow('Maturity', data.maturityDate)}
                  {dateRow('Revised Maturity', data.revisedMaturityDate)}
                </div>
              </div>

              {/* Payment info */}
              {Array.isArray(data.lcPaymentInfo) && data.lcPaymentInfo.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Payments ({data.lcPaymentInfo.length})
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                          <th className="px-4 py-2.5 text-left">Date</th>
                          <th className="px-4 py-2.5 text-right">Amount</th>
                          <th className="px-4 py-2.5 text-left">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.lcPaymentInfo.map((p, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 text-gray-600">
                              {p.paymentDate ? formatDate(p.paymentDate) : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                              {formatCurrency(p.paymentAmount ?? 0)}
                            </td>
                            <td className="px-4 py-2.5 text-gray-600">{p.paymentNote ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
