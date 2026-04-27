import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { SectionCard } from '@/pages/sales-orders/review-cockpit/SectionCard'
import { toCurrency, toDateLabel, toNumber, dueStatusLabel } from '@/pages/sales-orders/review-cockpit/format'
import { getTaxYearRange, usePaymentSummary, useTaxAitDetails } from '@/hooks/useReviewCockpit'
import { TaxAitDetailsModal } from '@/pages/sales-orders/review-cockpit/TaxAitDetailsModal'

interface TaxAitSectionProps {
  customerId: number | null
}

export function TaxAitSection({ customerId }: TaxAitSectionProps) {
  const taxRange = getTaxYearRange()
  const { data: taxRows, isLoading: taxLoading, isError: taxError, error: taxErr } = useTaxAitDetails(
    customerId,
    taxRange.startDate,
    taxRange.endDate,
  )

  const { data: paymentRows, isLoading: payLoading, isError: payError, error: payErr } = usePaymentSummary(
    customerId,
  )

  const [detailsOpen, setDetailsOpen] = useState(false)

  const payment = paymentRows?.[0]

  const metrics = useMemo(() => {
    const rows = taxRows ?? []
    let taxableBase = 0, totalVat = 0, totalAit = 0
    for (const r of rows) {
      taxableBase += toNumber(r.taxableBase)
      totalVat += toNumber(r.vatAmount)
      totalAit += toNumber(r.aitAmount ?? r.taxAmount)
    }
    const vatPaid = toNumber(payment?.totalVatPaid)
    const aitPaid = toNumber(payment?.totalAitPaid)
    const vatBalance = totalVat - vatPaid
    const aitBalance = totalAit - aitPaid
    return { invoices: rows.length, taxableBase, totalVat, totalAit, vatPaid, aitPaid, vatBalance, aitBalance }
  }, [taxRows, payment])

  const vatStatus = dueStatusLabel(metrics.vatBalance)
  const aitStatus = dueStatusLabel(metrics.aitBalance)

  return (
    <SectionCard
      title="Tax & AIT"
      subtitle={`Tax year ${taxRange.startDate} → ${taxRange.endDate}`}
      right={(taxLoading || payLoading) ? <Loader2 size={16} className="mt-0.5 animate-spin text-gray-400" /> : null}
      action={
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          View Details
        </button>
      }
    >
      {(taxError || payError) && (
        <p className="text-sm text-red-600">
          {(taxErr as Error | undefined)?.message || (payErr as Error | undefined)?.message}
        </p>
      )}

      {/* 8 Metric Cards */}
      {!taxLoading && !payLoading && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          <MetricCard label="Invoices" value={String(metrics.invoices)} />
          <MetricCard label="Taxable Base" value={toCurrency(metrics.taxableBase)} />
          <MetricCard label="Total VAT" value={toCurrency(metrics.totalVat)} />
          <MetricCard label="Total AIT" value={toCurrency(metrics.totalAit)} />
          <MetricCard label="VAT Paid" value={toCurrency(metrics.vatPaid)} />
          <MetricCard label="AIT Paid" value={toCurrency(metrics.aitPaid)} />
          <MetricCard label="VAT Balance" value={toCurrency(metrics.vatBalance)} statusText={vatStatus.text} statusCls={vatStatus.cls} />
          <MetricCard label="AIT Balance" value={toCurrency(metrics.aitBalance)} statusText={aitStatus.text} statusCls={aitStatus.cls} />
        </div>
      )}

      <div className="mt-4">
        {!taxLoading && (!taxRows || taxRows.length === 0) ? (
          <p className="text-sm text-gray-600">No tax/AIT data for this range.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-3 py-2">Invoice</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Month</th>
                  <th className="px-3 py-2 text-right">Taxable</th>
                  <th className="px-3 py-2 text-right">VAT %</th>
                  <th className="px-3 py-2 text-right">VAT</th>
                  <th className="px-3 py-2 text-right">AIT %</th>
                  <th className="px-3 py-2 text-right">AIT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(taxRows ?? []).slice(0, 8).map((row, idx) => (
                  <tr key={`${row.challanNo ?? row.systemNo ?? idx}`}>
                    <td className="px-3 py-2 font-mono text-gray-800">{row.challanNo ?? row.systemNo ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{toDateLabel(row.challanDate ?? row.invoiceDate)}</td>
                    <td className="px-3 py-2 text-gray-700">{row.monthName ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{toCurrency(row.taxableBase)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{row.vatPercent != null ? `${row.vatPercent}%` : '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{toCurrency(row.vatAmount)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{row.aitPercent != null ? `${row.aitPercent}%` : '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{toCurrency(row.aitAmount ?? row.taxAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailsOpen && (
        <TaxAitDetailsModal
          customerId={customerId}
          onClose={() => setDetailsOpen(false)}
        />
      )}
    </SectionCard>
  )
}

function MetricCard({ label, value, statusText, statusCls }: { label: string; value: string; statusText?: string; statusCls?: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2 text-center">
      <div className="text-[10px] leading-tight text-gray-500">{label}</div>
      <div className="mt-0.5 text-xs font-bold text-gray-900">{value}</div>
      {statusText && (
        <div className={`mt-0.5 text-[10px] font-semibold ${statusCls}`}>{statusText}</div>
      )}
    </div>
  )
}
