import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { SectionCard } from '@/pages/sales-orders/review-cockpit/SectionCard'
import { toCurrency, toNumber, lcLifecycleColor } from '@/pages/sales-orders/review-cockpit/format'
import { useLcPaymentInfo } from '@/hooks/useReviewCockpit'
import { LCDetailsModal } from '@/pages/sales-orders/review-cockpit/LCDetailsModal'

interface LCSectionProps {
  customerId: number | null
}

export function LCSection({ customerId }: LCSectionProps) {
  const { data, isLoading, isError, error } = useLcPaymentInfo(customerId)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedPiSystemId, setSelectedPiSystemId] = useState<number | null>(null)

  const metrics = useMemo(() => {
    const rows = data ?? []
    let total = 0
    for (const r of rows) total += toNumber(r.lcAmount ?? r.piAmount ?? r.lcReceivedAmount)
    return { count: rows.length, total, avg: rows.length > 0 ? total / rows.length : 0 }
  }, [data])

  function handleRowClick(piSystemId: number | undefined) {
    if (piSystemId) {
      setSelectedPiSystemId(piSystemId)
      setDetailsOpen(true)
    }
  }

  return (
    <SectionCard
      title="LC"
      subtitle="PI/LC payment info"
      right={isLoading ? <Loader2 size={16} className="mt-0.5 animate-spin text-gray-400" /> : null}
      action={
        (data ?? []).length > 0 ? (
          <button
            type="button"
            onClick={() => { setSelectedPiSystemId(null); setDetailsOpen(true) }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            View Details
          </button>
        ) : null
      }
    >
      {isError && <p className="text-sm text-red-600">{(error as Error)?.message}</p>}

      {/* Metrics Row */}
      {!isLoading && (
        <div className="mb-3 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-xs text-gray-500">Total LCs</div>
            <div className="mt-0.5 text-lg font-bold text-gray-900">{metrics.count}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-xs text-gray-500">Total Amount</div>
            <div className="mt-0.5 text-sm font-bold text-gray-900">{toCurrency(metrics.total)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-xs text-gray-500">Average</div>
            <div className="mt-0.5 text-sm font-bold text-gray-900">{toCurrency(metrics.avg)}</div>
          </div>
        </div>
      )}

      {!isLoading && (!data || data.length === 0) ? (
        <p className="text-sm text-gray-600">No LC data.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-100">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-3 py-2">LC No</th>
                <th className="px-3 py-2">PI No</th>
                <th className="px-3 py-2">Lifecycle</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-right">Paid</th>
                <th className="px-3 py-2 text-right">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data ?? []).slice(0, 8).map((row, idx) => (
                <tr
                  key={`${row.lcNo ?? idx}-${row.piNo ?? ''}`}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(row.piSystemId)}
                >
                  <td className="px-3 py-2 font-mono text-gray-800">{row.lcNo ?? row.lcNumber ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-700">{row.piNo ?? row.piNumber ?? '—'}</td>
                  <td className="px-3 py-2">
                    {row.lcLifecycleName ? (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${lcLifecycleColor(row.lcLifecycleName)}`}>
                        {row.lcLifecycleName}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">{toCurrency(row.lcAmount ?? row.piAmount ?? row.lcReceivedAmount)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{toCurrency(row.paidAmount)}</td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">{toCurrency(row.dueAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailsOpen && (
        <LCDetailsModal
          piSystemId={selectedPiSystemId}
          lcRows={data ?? []}
          onClose={() => setDetailsOpen(false)}
        />
      )}
    </SectionCard>
  )
}
