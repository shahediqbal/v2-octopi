import { useMemo } from 'react'
import { AlertCircle, BarChart3, Loader2 } from 'lucide-react'
import {
  useMonthlyPurchaseSalesPayment,
  useSalesPaymentSummary,
} from '@/hooks/useSalesPaymentDashboard'
import type { SalesPaymentSummaryItem } from '@/types/salesPaymentDashboard'

/* ─── Date helpers ─── */
function todayStr() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}
function daysAgoStr(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}
function oneYearAgoStr() {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}
function fmtAmount(v: number | null) {
  if (v == null) return '-'
  return v.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/* ─── Bar chart component ─── */
function BarChart({ items, color }: { items: SalesPaymentSummaryItem[]; color: string }) {
  const max = Math.max(...items.map((i) => i.amount ?? 0), 1)
  return (
    <div className="space-y-1.5">
      {items.map((item, idx) => {
        const pct = ((item.amount ?? 0) / max) * 100
        return (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 truncate text-right text-gray-500">{item.intervalValue ?? '-'}</span>
            <div className="relative flex-1 rounded-sm bg-gray-100" style={{ height: '18px' }}>
              <div
                className={`absolute inset-y-0 left-0 rounded-sm ${color}`}
                style={{ width: `${pct}%`, minWidth: pct > 0 ? '2px' : 0 }}
              />
            </div>
            <span className="w-24 shrink-0 text-gray-700">{fmtAmount(item.amount)}</span>
          </div>
        )
      })}
      {items.length === 0 && (
        <p className="py-4 text-center text-xs text-gray-400">No data available.</p>
      )}
    </div>
  )
}

/* ─── Section wrapper ─── */
function DashSection({
  title,
  loading,
  error,
  children,
}: {
  title: string
  loading: boolean
  error: boolean
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-800">{title}</h3>
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-gray-400" />
          <span className="ml-2 text-xs text-gray-400">Loading…</span>
        </div>
      )}
      {!loading && error && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle size={14} /> Failed to load data.
        </div>
      )}
      {!loading && !error && children}
    </div>
  )
}

export function SalesPaymentDashboardPage() {
  const today = useMemo(todayStr, [])
  const days30Ago = useMemo(() => daysAgoStr(30), [])
  const days84Ago = useMemo(() => daysAgoStr(84), []) // ~12 weeks
  const yearAgo = useMemo(oneYearAgoStr, [])

  /* ─── Daily queries ─── */
  const {
    data: dailySales = [],
    isLoading: dSalesLoading,
    isError: dSalesError,
  } = useSalesPaymentSummary(days30Ago, today, 'daily', 'sales')
  const {
    data: dailyPayment = [],
    isLoading: dPayLoading,
    isError: dPayError,
  } = useSalesPaymentSummary(days30Ago, today, 'daily', 'payment')

  /* ─── Weekly queries ─── */
  const {
    data: weeklySales = [],
    isLoading: wSalesLoading,
    isError: wSalesError,
  } = useSalesPaymentSummary(days84Ago, today, 'weekly', 'sales')
  const {
    data: weeklyPayment = [],
    isLoading: wPayLoading,
    isError: wPayError,
  } = useSalesPaymentSummary(days84Ago, today, 'weekly', 'payment')

  /* ─── Monthly queries ─── */
  const {
    data: monthlySales = [],
    isLoading: mSalesLoading,
    isError: mSalesError,
  } = useSalesPaymentSummary(yearAgo, today, 'monthly', 'sales')
  const {
    data: monthlyPayment = [],
    isLoading: mPayLoading,
    isError: mPayError,
  } = useSalesPaymentSummary(yearAgo, today, 'monthly', 'payment')

  /* ─── Monthly summary query ─── */
  const {
    data: monthlySummary = [],
    isLoading: summaryLoading,
    isError: summaryError,
  } = useMonthlyPurchaseSalesPayment()

  const totalMonthlySales = monthlySummary.reduce((s, r) => s + (r.totalSales ?? 0), 0)
  const totalMonthlyPurchase = monthlySummary.reduce((s, r) => s + (r.totalPurchase ?? 0), 0)
  const totalMonthlyPayment = monthlySummary.reduce((s, r) => s + (r.totalPayment ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Sales & Payment Dashboard</h2>
            <p className="mt-1 text-sm text-gray-500">
              Auto-loaded daily/weekly/monthly summaries — last 30 days, 12 weeks, 1 year.
            </p>
          </div>
        </div>
      </div>

      {/* ── Daily Section ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DashSection
          title="Daily Sales — Last 30 Days"
          loading={dSalesLoading}
          error={dSalesError}
        >
          <BarChart items={dailySales} color="bg-gray-700" />
        </DashSection>
        <DashSection
          title="Daily Payment — Last 30 Days"
          loading={dPayLoading}
          error={dPayError}
        >
          <BarChart items={dailyPayment} color="bg-gray-400" />
        </DashSection>
      </div>

      {/* ── Weekly Section ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DashSection
          title="Weekly Sales — Last 12 Weeks"
          loading={wSalesLoading}
          error={wSalesError}
        >
          <BarChart items={weeklySales} color="bg-gray-700" />
        </DashSection>
        <DashSection
          title="Weekly Payment — Last 12 Weeks"
          loading={wPayLoading}
          error={wPayError}
        >
          <BarChart items={weeklyPayment} color="bg-gray-400" />
        </DashSection>
      </div>

      {/* ── Monthly Section ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DashSection
          title="Monthly Sales — Last 12 Months"
          loading={mSalesLoading}
          error={mSalesError}
        >
          <BarChart items={monthlySales} color="bg-gray-700" />
        </DashSection>
        <DashSection
          title="Monthly Payment — Last 12 Months"
          loading={mPayLoading}
          error={mPayError}
        >
          <BarChart items={monthlyPayment} color="bg-gray-400" />
        </DashSection>
      </div>

      {/* ── Monthly Summary Table ── */}
      <DashSection
        title="Monthly Purchase / Sales / Payment Summary"
        loading={summaryLoading}
        error={summaryError}
      >
        {/* Summary totals */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-xs text-gray-500">Total Purchase</p>
            <p className="mt-0.5 text-base font-bold text-gray-900">{fmtAmount(totalMonthlyPurchase)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-xs text-gray-500">Total Sales</p>
            <p className="mt-0.5 text-base font-bold text-gray-900">{fmtAmount(totalMonthlySales)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-xs text-gray-500">Total Payment</p>
            <p className="mt-0.5 text-base font-bold text-emerald-700">{fmtAmount(totalMonthlyPayment)}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3 text-right">Total Purchase</th>
                <th className="px-4 py-3 text-right">Total Sales</th>
                <th className="px-4 py-3 text-right">Total Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthlySummary.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{row.monthName ?? '-'}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{fmtAmount(row.totalPurchase)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-900">{fmtAmount(row.totalSales)}</td>
                  <td className="px-4 py-2.5 text-right text-emerald-700">{fmtAmount(row.totalPayment)}</td>
                </tr>
              ))}
              {monthlySummary.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-gray-400">No data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashSection>
    </div>
  )
}
