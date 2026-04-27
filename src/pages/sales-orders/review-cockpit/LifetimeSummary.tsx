import { Loader2 } from 'lucide-react'
import { SectionCard } from '@/pages/sales-orders/review-cockpit/SectionCard'
import { toCurrency, toNumber, formatQuantity } from '@/pages/sales-orders/review-cockpit/format'
import {
  getLastNDaysRange,
  useCustomerCreditSaleSummary,
  useSampleIssueQuantity,
  useTopProducts,
} from '@/hooks/useReviewCockpit'

interface LifetimeSummaryProps {
  customerId: number | null
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function MetricCard({ label, value, border }: { label: string; value: string; border: string }) {
  return (
    <div className={`rounded-lg border-l-4 ${border} bg-gray-50 p-4`}>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-bold text-gray-900">{value}</div>
    </div>
  )
}

export function LifetimeSummary({ customerId }: LifetimeSummaryProps) {
  const endDate = toDateInput(new Date())
  const startDate = '2023-12-01'
  const { data: creditRows, isLoading: creditLoading, isError: creditError, error: creditErr } =
    useCustomerCreditSaleSummary(customerId, startDate, endDate)

  const sampleRange = getLastNDaysRange(365)
  const { data: sampleQty, isLoading: sampleLoading } = useSampleIssueQuantity(
    customerId,
    sampleRange.startDate,
    sampleRange.endDate,
  )

  const topRange = getLastNDaysRange(365)
  const { data: topProducts, isLoading: topLoading } = useTopProducts(
    customerId,
    topRange.startDate,
    topRange.endDate,
  )

  const row = creditRows?.[0]
  const anyLoading = creditLoading || sampleLoading || topLoading

  return (
    <SectionCard
      title="Lifetime Summary"
      subtitle={`Since ${startDate}`}
      right={anyLoading ? <Loader2 size={16} className="mt-0.5 animate-spin text-gray-400" /> : null}
    >
      {creditError && <p className="text-sm text-red-600">{(creditErr as Error)?.message}</p>}

      {/* 4 metric cards matching legacy layout */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Lifetime Sales" value={toCurrency(row?.totalSale)} border="border-gray-700" />
        <MetricCard label="Lifetime Payments" value={toCurrency(row?.totalPaid)} border="border-gray-500" />
        <MetricCard label="Lifetime Sample" value={formatQuantity(sampleQty)} border="border-gray-400" />
        <MetricCard
          label="Top Products"
          value={topProducts && topProducts.length > 0
            ? topProducts.slice(0, 3).map((p) => p.productName ?? '—').join(', ')
            : '—'}
          border="border-gray-300"
        />
      </div>

      {/* Top products detail table */}
      {topProducts && topProducts.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2 text-right">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topProducts.slice(0, 6).map((p, idx) => (
                <tr key={`${p.productId ?? idx}`}>
                  <td className="px-3 py-2 text-gray-800">{p.productName ?? '—'}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatQuantity(p.totalQuantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  )
}
