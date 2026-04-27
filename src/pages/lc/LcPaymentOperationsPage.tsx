import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, CreditCard } from 'lucide-react'
import { usePiByStatus, useLcPaymentSummary } from '@/hooks/useLcTracking'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { PiByStatus } from '@/types/lcTracking'

function PaymentSummaryCell({ lcDocId }: { lcDocId: number }) {
  const { data } = useLcPaymentSummary(lcDocId)
  if (!data) return <span className="text-gray-400">—</span>
  return (
    <div className="text-right text-xs">
      <p className="font-medium text-gray-900">{formatCurrency(data.totalPaid ?? 0)}</p>
      <p className="text-gray-400">of {formatCurrency(data.lcAmount ?? 0)}</p>
    </div>
  )
}

export function LcPaymentOperationsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: piList = [], isLoading, isError } = usePiByStatus(2)

  const filtered = (piList as PiByStatus[]).filter(
    (pi) =>
      pi.piNumber?.toLowerCase().includes(search.toLowerCase()) ||
      pi.customerName?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">LC Payment Operations</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Record payments against LC documents
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Search by PI number or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={26} className="animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="flex items-start gap-3 p-6">
            <AlertCircle size={18} className="mt-0.5 text-red-500" />
            <p className="text-sm text-red-700">Failed to load LC documents.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3 text-left">PI Number</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">PI Date</th>
                  <th className="px-5 py-3 text-right">Payment Progress</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                      No LC documents available for payment.
                    </td>
                  </tr>
                ) : (
                  filtered.map((pi) => (
                    <tr key={pi.piSystemId} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-900">{pi.piNumber}</td>
                      <td className="px-5 py-3 text-gray-700">{pi.customerName}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {pi.piDate ? formatDate(pi.piDate) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        {pi.lcDocId ? (
                          <PaymentSummaryCell lcDocId={pi.lcDocId} />
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/lc/payment/new?lcDocId=${pi.lcDocId ?? pi.piSystemId}`)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <CreditCard size={12} /> Add Payment
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
