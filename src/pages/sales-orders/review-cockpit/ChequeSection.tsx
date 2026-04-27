import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { SectionCard } from '@/pages/sales-orders/review-cockpit/SectionCard'
import { toCurrency, toDateLabel, toNumber, chequeStatusColor } from '@/pages/sales-orders/review-cockpit/format'
import { useCustomerChequeReport } from '@/hooks/useReviewCockpit'
import { ChequeDetailsModal } from '@/pages/sales-orders/review-cockpit/ChequeDetailsModal'

interface ChequeSectionProps {
  customerId: number | null
}

export function ChequeSection({ customerId }: ChequeSectionProps) {
  const { data, isLoading, isError, error } = useCustomerChequeReport(customerId, 1)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const metrics = useMemo(() => {
    const rows = data ?? []
    const count = rows.length
    let total = 0
    for (const r of rows) total += toNumber(r.chequeAmount)
    return {
      count,
      total,
      avg: count > 0 ? total / count : 0,
    }
  }, [data])

  return (
    <SectionCard
      title="Cheque"
      subtitle="Pending cheques"
      right={isLoading ? <Loader2 size={16} className="mt-0.5 animate-spin text-gray-400" /> : null}
      action={
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          View All
        </button>
      }
    >
      {isError && <p className="text-sm text-red-600">{(error as Error)?.message}</p>}

      {/* Metrics Row */}
      {!isLoading && (
        <div className="mb-3 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-xs text-gray-500">Pending Count</div>
            <div className="mt-0.5 text-lg font-bold text-gray-900">{metrics.count}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-xs text-gray-500">Total Pending</div>
            <div className="mt-0.5 text-sm font-bold text-gray-900">{toCurrency(metrics.total)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-xs text-gray-500">Average</div>
            <div className="mt-0.5 text-sm font-bold text-gray-900">{toCurrency(metrics.avg)}</div>
          </div>
        </div>
      )}

      {!isLoading && (!data || data.length === 0) ? (
        <p className="text-sm text-gray-600">No pending cheques.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-100">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-3 py-2">Cheque No</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Bank</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data ?? []).slice(0, 6).map((row, idx) => (
                <tr key={`${row.chequeNo ?? idx}`}>
                  <td className="px-3 py-2 font-mono text-gray-800">{row.chequeNo ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-700">{toDateLabel(row.chequeDate)}</td>
                  <td className="px-3 py-2 text-gray-700">{row.bankName ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${chequeStatusColor(row.chequeStatusId)}`}>
                      {row.chequeStatusName ?? '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">{toCurrency(row.chequeAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailsOpen && (
        <ChequeDetailsModal
          customerId={customerId}
          onClose={() => setDetailsOpen(false)}
        />
      )}
    </SectionCard>
  )
}
