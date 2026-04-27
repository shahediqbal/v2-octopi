import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { SectionCard } from '@/pages/sales-orders/review-cockpit/SectionCard'
import { formatQuantity, toNumber, balanceColorClass } from '@/pages/sales-orders/review-cockpit/format'
import { useCustomerLoanSummary } from '@/hooks/useReviewCockpit'
import { ProductLoanDetailsModal } from '@/pages/sales-orders/review-cockpit/ProductLoanDetailsModal'

interface ProductLoanSectionProps {
  customerId: number | null
}

const PREVIEW_COUNT = 6

export function ProductLoanSection({ customerId }: ProductLoanSectionProps) {
  const { data, isLoading, isError, error } = useCustomerLoanSummary(customerId)
  const [expanded, setExpanded] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const totals = useMemo(() => {
    if (!data || data.length === 0) return { issued: 0, received: 0, balance: 0 }
    let issued = 0, received = 0, balance = 0
    for (const row of data) {
      issued += toNumber(row.loanGivenQty ?? row.loanQty)
      received += toNumber(row.loanReceivedQty ?? row.returnQty)
      balance += toNumber(row.balanceQty ?? row.currentLoanQty)
    }
    return { issued, received, balance }
  }, [data])

  const rows = data ?? []
  const visible = expanded ? rows : rows.slice(0, PREVIEW_COUNT)
  const hasMore = rows.length > PREVIEW_COUNT

  return (
    <SectionCard
      title="Product Loan"
      subtitle="Current loan snapshot"
      right={isLoading ? <Loader2 size={16} className="mt-0.5 animate-spin text-gray-400" /> : null}
      action={
        rows.length > 0 ? (
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            View Details
          </button>
        ) : null
      }
    >
      {isError && <p className="text-sm text-red-600">{(error as Error)?.message}</p>}

      {!isLoading && rows.length === 0 ? (
        <p className="text-sm text-gray-600">No product loan data available.</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-3 py-2" style={{ width: '50%' }}>Product</th>
                  <th className="px-3 py-2 text-right">Received</th>
                  <th className="px-3 py-2 text-right">Given</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((row, idx) => {
                  const bal = toNumber(row.balanceQty ?? row.currentLoanQty)
                  return (
                    <tr key={`${row.productId ?? idx}`}>
                      <td className="px-3 py-2 text-gray-800">{row.productName ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {formatQuantity(row.loanReceivedQty ?? row.returnQty)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {formatQuantity(row.loanGivenQty ?? row.loanQty)}
                      </td>
                      <td className={`px-3 py-2 text-right font-medium ${balanceColorClass(bal)}`}>
                        {formatQuantity(bal)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Expand/Collapse */}
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              {expanded ? (
                <><ChevronUp size={14} /> Show Less</>
              ) : (
                <><ChevronDown size={14} /> Show {rows.length - PREVIEW_COUNT} More Products</>
              )}
            </button>
          )}

          {/* Totals Footer */}
          <div className="mt-3 grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3">
            <div className="text-center">
              <div className="text-xs text-gray-500">Total Issued</div>
              <div className="mt-0.5 text-sm font-semibold text-gray-900">{formatQuantity(totals.issued)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Total Received</div>
              <div className="mt-0.5 text-sm font-semibold text-gray-900">{formatQuantity(totals.received)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Total Balance</div>
              <div className={`mt-0.5 text-sm font-semibold ${balanceColorClass(totals.balance)}`}>
                {formatQuantity(totals.balance)}
              </div>
            </div>
          </div>
        </>
      )}

      {detailsOpen && (
        <ProductLoanDetailsModal
          customerId={customerId}
          summaryData={data ?? []}
          totals={totals}
          onClose={() => setDetailsOpen(false)}
        />
      )}
    </SectionCard>
  )
}
