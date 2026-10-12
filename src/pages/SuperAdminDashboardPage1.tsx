import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, BadgeCheck, Banknote, CalendarDays,
  ChevronDown, CircleDollarSign, Clock3, CreditCard, PackageCheck, RefreshCw,
  ShoppingCart, TrendingUp, Users,
} from 'lucide-react'
import { useSalesPaymentSummary, useMonthlyPurchaseSalesPayment } from '@/hooks/useSalesPaymentDashboard'
import { useMonthlyCreditReport } from '@/hooks/useMonthlyCreditReport'
import { usePendingCancelReport } from '@/hooks/usePendingCancelReport'
import { useDailyInvoiceTracking } from '@/hooks/useDailyInvoiceTracking'
import { useAllowanceChecking } from '@/hooks/useAllowanceChecking'
import { useCurrentStock } from '@/hooks/useCurrentStock'
import { useTaxAitSummary } from '@/hooks/useTaxAitSummary'
import { useSuperAdminCreditRisk, useSuperAdminOperations, useSuperAdminStockSummary } from '@/hooks/useSuperAdminDashboard'
import type { NamedAmount } from '@/types/superAdminDashboard'
import type { MonthlyCreditItem } from '@/types/monthlyCreditReport'
import { InvoiceChallanLookup } from '@/components/dashboard/InvoiceChallanLookup'

function dateText(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function yearRange() {
  const now = new Date()
  return { start: `${now.getFullYear()}-01-01`, end: dateText(now) }
}

function recentDaysRange(days = 60) {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  return { start: dateText(start), end: dateText(end) }
}

function amount(value: number) {
  return `৳ ${Math.round(value).toLocaleString('en-BD')}`
}

function numeric(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0
  const parsed = Number(value.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

interface MarketingPerformance {
  name: string
  sales: number
  recovery: number
  outstanding: number
  rate: number
  customers: number
}

function getMarketingPerformance(rows: MonthlyCreditItem[]): MarketingPerformance[] {
  const result = new Map<string, { sales: number; recovery: number; customers: Set<string> }>()
  const saleKey = /sale|payable|invoice/i
  const recoveryKey = /payment|paid|recovery|collection/i
  const ignoredKey = /last|date|day|status|customer|marketing/i

  for (const row of rows) {
    const name = row.marketingName || row.employeeName || 'Unassigned'
    const current = result.get(name) ?? { sales: 0, recovery: 0, customers: new Set<string>() }
    for (const [key, value] of Object.entries(row.monthlyValues ?? {})) {
      if (ignoredKey.test(key)) continue
      if (recoveryKey.test(key)) current.recovery += numeric(value)
      else if (saleKey.test(key)) current.sales += numeric(value)
    }
    current.sales += numeric(row.totalSales)
    current.recovery += numeric(row.totalPayment ?? row.totalRecovery)
    if (row.customerName) current.customers.add(row.customerName)
    result.set(name, current)
  }

  return [...result.entries()].map(([name, item]) => ({
    name,
    sales: item.sales,
    recovery: item.recovery,
    outstanding: item.sales - item.recovery,
    rate: item.sales > 0 ? item.recovery / item.sales * 100 : 0,
    customers: item.customers.size,
  })).sort((a, b) => b.rate - a.rate || b.recovery - a.recovery)
}

const cardTones = {
  slate: 'bg-slate-100 text-slate-700', blue: 'bg-blue-100 text-blue-700',
  green: 'bg-emerald-100 text-emerald-700', amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
}

function MetricCard({ title, value, detail, icon: Icon, tone = 'slate' }: {
  title: string; value: string; detail: string; icon: typeof TrendingUp; tone?: keyof typeof cardTones
}) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>
      <div className={`rounded-xl p-2.5 ${cardTones[tone]}`}><Icon size={19} /></div>
    </div>
  </div>
}

function Section({ title, detail, href, action, children }: { title: string; detail: string; href?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div><h2 className="font-semibold text-slate-950">{title}</h2><p className="mt-0.5 text-xs text-slate-500">{detail}</p></div>
      <div className="flex shrink-0 items-center gap-2">{action}{href && <Link to={href} className="hidden items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-950 sm:flex">View report <ArrowRight size={14} /></Link>}</div>
    </header><div className="p-5">{children}</div>
  </section>
}

function CompactDateRange({ startDate, endDate, onApply }: { startDate: string; endDate: string; onApply: (start: string, end: string) => void }) {
  const [open, setOpen] = useState(false)
  const [draftStart, setDraftStart] = useState(startDate)
  const [draftEnd, setDraftEnd] = useState(endDate)

  const chooseRecentDays = (days: number) => {
    const range = recentDaysRange(days)
    setDraftStart(range.start)
    setDraftEnd(range.end)
  }

  const apply = () => {
    if (!draftStart || !draftEnd || draftStart > draftEnd) return
    onApply(draftStart, draftEnd)
    setOpen(false)
  }

  return <div className="relative">
    <button type="button" onClick={() => { setDraftStart(startDate); setDraftEnd(endDate); setOpen(value => !value) }} className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" title="Change marketing performance period">
      <CalendarDays size={14} /><span className="hidden md:inline">{startDate} – {endDate}</span><span className="md:hidden">Period</span><ChevronDown size={13} />
    </button>
    {open && <div className="absolute right-0 top-10 z-30 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <p className="mb-2 text-xs font-semibold text-slate-700">Marketing performance period</p>
      <div className="mb-3 grid grid-cols-3 gap-1.5">
        {[30, 60, 90].map(days => <button key={days} type="button" onClick={() => chooseRecentDays(days)} className="rounded-md bg-slate-100 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200">{days} days</button>)}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] font-medium text-slate-500">Start<input type="date" value={draftStart} max={draftEnd} onChange={event => setDraftStart(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-900" /></label>
        <label className="text-[11px] font-medium text-slate-500">End<input type="date" value={draftEnd} min={draftStart} onChange={event => setDraftEnd(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-900" /></label>
      </div>
      {draftStart > draftEnd && <p className="mt-2 text-xs text-red-600">Start date must be before the end date.</p>}
      <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="button" disabled={!draftStart || !draftEnd || draftStart > draftEnd} onClick={apply} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Apply</button></div>
    </div>}
  </div>
}

export function SuperAdminDashboardPage() {
  const initial = useMemo(yearRange, [])
  const initialMarketing = useMemo(() => recentDaysRange(60), [])
  const [startDate, setStartDate] = useState(initial.start)
  const [endDate, setEndDate] = useState(initial.end)
  const [marketingStartDate, setMarketingStartDate] = useState(initialMarketing.start)
  const [marketingEndDate, setMarketingEndDate] = useState(initialMarketing.end)
  const [showAllMarketing, setShowAllMarketing] = useState(false)
  const sales = useSalesPaymentSummary(startDate, endDate, 'monthly', 'sales')
  const payment = useSalesPaymentSummary(startDate, endDate, 'monthly', 'payment')
  const purchase = useMonthlyPurchaseSalesPayment(startDate, endDate)
  const marketingCredit = useMonthlyCreditReport({ employeeId: 0, startDate: marketingStartDate, endDate: marketingEndDate }, true)
  const pending = usePendingCancelReport()
  const delivery = useDailyInvoiceTracking({ startDate, endDate, partnerId: 0 }, true)
  const allowance = useAllowanceChecking({ startDate, endDate, employeeId: 0 }, true)
  const stock = useCurrentStock({ productId: 0, channelId: 0 })
  const taxAit = useTaxAitSummary({ startDate, endDate, customerId: 0 }, true)
  const creditRisk = useSuperAdminCreditRisk(endDate)
  const stockSummary = useSuperAdminStockSummary()
  const operations = useSuperAdminOperations(startDate, endDate)

  const totalSales = (sales.data ?? []).reduce((s, x) => s + (x.amount ?? 0), 0)
  const totalRecovery = (payment.data ?? []).reduce((s, x) => s + (x.amount ?? 0), 0)
  const totalPurchase = (purchase.data ?? []).reduce((s, x) => s + (x.totalPurchase ?? 0), 0)
  const recoveryRate = totalSales ? totalRecovery / totalSales * 100 : 0
  const performance = getMarketingPerformance(marketingCredit.data ?? [])
  const visiblePerformance = showAllMarketing ? performance : performance.slice(0, 10)
  const pendingRows = pending.data ?? []
  const deliveryRows = delivery.data ?? []
  const allowanceRows = allowance.data ?? []
  const stockRows = stock.data ?? []
  const taxAitRows = taxAit.data ?? []
  const stockQuantity = stockRows.reduce((sum, row) => sum + (row.currentQty ?? 0), 0)
  const taxAitAmount = taxAitRows.reduce((sum, row) => sum + (row.sumAitAmount ?? 0), 0)
  const refreshing = [sales, payment, purchase, marketingCredit, pending, delivery, allowance, stock, taxAit, creditRisk, stockSummary, operations].some(x => x.isFetching)

  const refresh = () => void Promise.all([sales.refetch(), payment.refetch(), purchase.refetch(), marketingCredit.refetch(), pending.refetch(), delivery.refetch(), allowance.refetch(), stock.refetch(), taxAit.refetch(), creditRisk.refetch(), stockSummary.refetch(), operations.refetch()])

  return <div className="space-y-5 bg-slate-50/50">
    <InvoiceChallanLookup />
    <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-lg">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-emerald-300">Super Admin</p><h1 className="mt-1 text-2xl font-bold">Executive ERP Dashboard</h1><p className="mt-1 text-sm text-slate-300">Sales, recovery, credit risk and operational performance.</p></div>
        <div className="flex flex-wrap items-end gap-2 rounded-xl bg-white/10 p-3">
          <label className="text-xs text-slate-300">From<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block rounded-lg bg-white px-3 py-2 text-sm text-slate-900" /></label>
          <label className="text-xs text-slate-300">To<input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block rounded-lg bg-white px-3 py-2 text-sm text-slate-900" /></label>
          <button onClick={refresh} disabled={refreshing} className="flex h-10 items-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold disabled:opacity-60"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />Refresh</button>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="Total Sales" value={amount(totalSales)} detail="Selected calendar period" icon={ShoppingCart} tone="blue" />
      <MetricCard title="Recovery" value={amount(totalRecovery)} detail={`${recoveryRate.toFixed(1)}% against sales`} icon={CircleDollarSign} tone="green" />
      <MetricCard title="Outstanding" value={amount(totalSales - totalRecovery)} detail="Period sales less recovery" icon={CreditCard} tone="red" />
      <MetricCard title="Purchases" value={amount(totalPurchase)} detail="Confirmed purchases" icon={PackageCheck} tone="amber" />
      <MetricCard title="Pending Orders" value={String(pendingRows.length)} detail={`${pendingRows.filter(x => (x.daysPending ?? 0) > 7).length} over 7 days`} icon={AlertTriangle} tone="red" />
      <MetricCard title="Tracked Deliveries" value={String(deliveryRows.length)} detail="Lifecycle records" icon={Clock3} />
      <MetricCard title="Allowance Checks" value={String(allowanceRows.length)} detail="Workflow records" icon={BadgeCheck} tone="amber" />
      <MetricCard title="Marketing Team" value={String(performance.length)} detail="Employees represented" icon={Users} tone="blue" />
      <MetricCard title="Stock Value" value={amount(stockSummary.data?.totalStockValue ?? 0)} detail={`${stockSummary.data?.productCount ?? stockRows.length} products`} icon={PackageCheck} tone="green" />
      <MetricCard title="AIT Recoverable" value={amount(taxAitAmount)} detail={`${taxAitRows.length} customer/month records`} icon={Banknote} tone="amber" />
      <MetricCard title="Customer Due" value={amount(creditRisk.data?.totalDue ?? 0)} detail={`${creditRisk.data?.customerCount ?? 0} customers with outstanding`} icon={CreditCard} tone="red" />
    </div>

    <Section title="Customer Due Ageing & Credit Risk" detail={`Outstanding invoices aged as of ${endDate}`} href="/reports/customer-credit">
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['0–30 days', creditRisk.data?.days0To30 ?? 0, 'bg-emerald-500'],
          ['31–60 days', creditRisk.data?.days31To60 ?? 0, 'bg-amber-400'],
          ['61–90 days', creditRisk.data?.days61To90 ?? 0, 'bg-orange-500'],
          ['Over 90 days', creditRisk.data?.daysOver90 ?? 0, 'bg-red-500'],
        ].map(([label, value, colour]) => <div key={String(label)} className="rounded-xl border border-slate-100 p-3"><div className={`mb-2 h-1.5 rounded-full ${colour}`} /><p className="text-xs font-medium text-slate-500">{String(label)}</p><p className="mt-1 text-lg font-bold text-slate-950">{amount(Number(value))}</p></div>)}
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-left text-xs uppercase text-slate-400"><th className="pb-3">Customer</th><th className="pb-3">Marketing</th><th className="pb-3 text-right">Total due</th><th className="pb-3 text-right">Overdue</th><th className="pb-3 text-right">Oldest</th><th className="pb-3 text-right">Risk</th></tr></thead><tbody className="divide-y divide-slate-100">{(creditRisk.data?.topCustomers ?? []).slice(0, 10).map(row => <tr key={row.customerId} className="hover:bg-slate-50"><td className="py-3"><Link className="font-semibold text-slate-900 hover:text-emerald-700" to={`/customers/${row.customerId}/transactions`}>{row.customerName}</Link><p className="text-xs text-slate-400">{row.invoiceCount} outstanding invoices</p></td><td className="py-3 text-slate-600">{row.marketingName || 'Unassigned'}</td><td className="py-3 text-right font-semibold">{amount(row.totalDue)}</td><td className="py-3 text-right text-red-700">{amount(row.overdueAmount)}</td><td className="py-3 text-right">{row.oldestDueDays} days</td><td className="py-3 text-right"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.riskLevel === 'Critical' ? 'bg-red-100 text-red-700' : row.riskLevel === 'High' ? 'bg-orange-100 text-orange-700' : row.riskLevel === 'Watch' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{row.riskLevel}</span></td></tr>)}</tbody></table>{creditRisk.isError && <p className="py-8 text-center text-sm text-red-600">Credit-risk API is not available. Deploy the Phase 2 backend files and refresh.</p>}</div>
    </Section>

    <Section title="Purchase & Stock Valuation" detail="Current quantity valued at latest confirmed purchase price" href="/reports/current-stock">
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MiniMetric label="Stock quantity" value={(stockSummary.data?.totalQuantity ?? stockQuantity).toLocaleString('en-BD')} />
        <MiniMetric label="Stock value" value={amount(stockSummary.data?.totalStockValue ?? 0)} />
        <MiniMetric label="Products" value={String(stockSummary.data?.productCount ?? 0)} />
        <MiniMetric label="Negative stock" value={String(stockSummary.data?.negativeStockCount ?? 0)} danger />
        <MiniMetric label="Missing price" value={String(stockSummary.data?.missingPriceCount ?? 0)} danger />
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div><h3 className="mb-3 text-sm font-semibold text-slate-800">Highest-value stock</h3><div className="space-y-2">{(stockSummary.data?.highestValueProducts ?? []).slice(0, 8).map(row => <div key={row.productId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{row.productName}</p><p className="text-xs text-slate-400">{row.categoryName || 'Uncategorised'} · Qty {row.currentQuantity.toLocaleString('en-BD')}</p></div><div className="text-right"><p className="text-sm font-bold text-slate-900">{amount(row.stockValue)}</p><p className="text-xs text-slate-400">@ {amount(row.latestPurchasePrice ?? 0)}</p></div></div>)}</div></div>
        <div><h3 className="mb-3 text-sm font-semibold text-slate-800">Products requiring price setup</h3><div className="space-y-2">{(stockSummary.data?.missingPriceProducts ?? []).slice(0, 8).map(row => <div key={row.productId} className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/30 p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{row.productName}</p><p className="text-xs text-slate-400">{row.categoryName || 'Uncategorised'}</p></div><span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">Qty {row.currentQuantity.toLocaleString('en-BD')}</span></div>)}{!stockSummary.isLoading && !(stockSummary.data?.missingPriceProducts.length) && <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">All positive-stock products have a confirmed purchase price.</p>}</div></div>
      </div>
      {stockSummary.isError && <p className="mt-4 text-center text-sm text-red-600">Stock-summary API is unavailable. Deploy the Phase 3 backend files and refresh.</p>}
    </Section>

    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Section title="Sales Type Breakdown" detail="Delivered regular, sample and loan activity" href="/reports/sales">
        <NamedAmountList rows={operations.data?.salesTypes ?? []} showQuantity />
      </Section>
      <Section title="Current Order & Delivery Status" detail="Orders grouped by current lifecycle stage" href="/reports/daily-invoice-tracking">
        <NamedAmountList rows={operations.data?.orderStatuses ?? []} />
      </Section>
    </div>

    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <Section title="Allowance Performance" detail="Assigned through completed allowance workflow" href="/reports/allowance-checking">
        <StatusTiles rows={[
          ['Total', operations.data?.allowance.total ?? 0], ['Assigned', operations.data?.allowance.assigned ?? 0],
          ['Started', operations.data?.allowance.started ?? 0], ['Delivered', operations.data?.allowance.delivered ?? 0],
          ['Completed', operations.data?.allowance.completed ?? 0], ['Pending', operations.data?.allowance.pending ?? 0],
        ]} />
      </Section>
      <Section title="Cheque Status" detail="Current cheque pipeline and maturity attention" href="/cheques">
        <NamedAmountList rows={operations.data?.chequeStatuses ?? []} compact />
        <div className="mt-3 grid grid-cols-2 gap-2"><MiniMetric label="Overdue" value={`${operations.data?.overdueCheques ?? 0} · ${amount(operations.data?.overdueChequeAmount ?? 0)}`} danger /><MiniMetric label="Due next 7 days" value={String(operations.data?.chequesDueNext7Days ?? 0)} /></div>
      </Section>
      <Section title="LC Status" detail="LC lifecycle, value and delayed maturity" href="/lc/status">
        <NamedAmountList rows={operations.data?.lcStatuses ?? []} compact />
        <div className="mt-3"><MiniMetric label="Delayed LC" value={String(operations.data?.delayedLcCount ?? 0)} danger /></div>
      </Section>
    </div>

    <Section title="Tax & AIT Recovery" detail="Recoverable versus collected AIT for the selected period" href="/reports/tax-ait-summary">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><MiniMetric label="Recoverable" value={amount(operations.data?.taxAit.recoverable ?? 0)} /><MiniMetric label="Recovered" value={amount(operations.data?.taxAit.recovered ?? 0)} /><MiniMetric label="Outstanding" value={amount(operations.data?.taxAit.outstanding ?? 0)} danger /><MiniMetric label="Recovery rate" value={`${(operations.data?.taxAit.recoveryRate ?? 0).toFixed(1)}%`} /></div>
    </Section>

    <Section title="Management Attention Center" detail="Consolidated risks requiring Super Admin follow-up">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Attention label="Critical customer due" value={amount(creditRisk.data?.daysOver90 ?? 0)} href="/reports/customer-credit" />
        <Attention label="Orders still pending" value={String(operations.data?.pendingOrders ?? pendingRows.length)} href="/reports/pending-cancel" />
        <Attention label="Overdue cheques" value={String(operations.data?.overdueCheques ?? 0)} href="/cheques" />
        <Attention label="Delayed LC" value={String(operations.data?.delayedLcCount ?? 0)} href="/lc/status" />
        <Attention label="Missing stock prices" value={String(stockSummary.data?.missingPriceCount ?? 0)} href="/reports/purchase-price-history" />
        <Attention label="Negative stock" value={String(stockSummary.data?.negativeStockCount ?? 0)} href="/reports/current-stock" />
        <Attention label="Pending allowances" value={String(operations.data?.allowance.pending ?? 0)} href="/reports/allowance-checking" />
        <Attention label="AIT outstanding" value={amount(operations.data?.taxAit.outstanding ?? 0)} href="/reports/tax-ait-summary" />
      </div>
      {operations.isError && <p className="mt-4 text-center text-sm text-red-600">Operations API is unavailable. Deploy the cumulative backend package and refresh.</p>}
    </Section>

    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
      <div className="xl:col-span-3"><Section title="Marketing Performance — Sales vs Recovery" detail={`${marketingStartDate} to ${marketingEndDate}${marketingCredit.isFetching ? ' · Loading…' : ''}`} href="/reports/monthly-credit" action={<CompactDateRange startDate={marketingStartDate} endDate={marketingEndDate} onApply={(start, end) => { setMarketingStartDate(start); setMarketingEndDate(end) }} />}>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b text-left text-xs uppercase text-slate-400"><th className="pb-3">Rank / Marketing</th><th className="pb-3 text-right">Sales</th><th className="pb-3 text-right">Recovery</th><th className="pb-3 text-right">Outstanding</th><th className="pb-3 pl-5">Recovery rate</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{visiblePerformance.map((x, i) => <tr key={x.name} className="hover:bg-slate-50"><td className="py-3 font-medium"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs">{i + 1}</span>{x.name}<span className="ml-2 text-xs font-normal text-slate-400">{x.customers} customers</span></td><td className="py-3 text-right">{amount(x.sales)}</td><td className="py-3 text-right font-semibold text-emerald-700">{amount(x.recovery)}</td><td className="py-3 text-right text-red-700">{amount(x.outstanding)}</td><td className="py-3 pl-5"><div className="flex items-center gap-2"><div className="h-2 flex-1 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${x.rate >= 80 ? 'bg-emerald-500' : x.rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(x.rate, 100)}%` }} /></div><span className="w-14 text-right font-semibold">{x.rate.toFixed(1)}%</span></div></td></tr>)}</tbody>
        </table>{!marketingCredit.isLoading && !performance.length && <p className="py-10 text-center text-sm text-slate-400">No marketing performance data for this period.</p>}</div>
        {performance.length > 10 && <div className="mt-3 flex justify-center border-t border-slate-100 pt-3"><button type="button" onClick={() => setShowAllMarketing(value => !value)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">{showAllMarketing ? 'Show top 10' : `Show all (${performance.length})`}</button></div>}
      </Section></div>
      <div className="xl:col-span-2"><Section title="Operational Attention" detail="Orders requiring management follow-up" href="/reports/pending-cancel"><div className="space-y-3">{pendingRows.slice(0, 7).map(x => <Link key={x.soSystemId ?? x.soSystemNo} to="/reports/pending-cancel" className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 hover:bg-amber-50"><div className="min-w-0"><p className="truncate font-semibold">{x.customerName || 'Unknown customer'}</p><p className="truncate text-xs text-slate-500">{x.soSystemNo || `Order #${x.soSystemId}`} · {x.soSystemPending || x.soDecesionPending || 'Pending'}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${(x.daysPending ?? 0) > 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{x.daysPending ?? 0} days</span></Link>)}</div></Section></div>
    </div>

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Section title="Credit & Due" detail="Opening, sales, payments, returns and running due" href="/reports/customer-credit"><Info icon={CreditCard} text="Customer credit and due investigation" /></Section>
      <Section title="Delivery Lifecycle" detail="Invoice stage and turnaround time" href="/reports/daily-invoice-tracking"><Info icon={CalendarDays} text={`${deliveryRows.length} tracked delivery records`} /></Section>
      <Section title="Allowance Control" detail="Operational allowance verification" href="/reports/allowance-checking"><Info icon={Banknote} text={`${allowanceRows.length} allowance records`} /></Section>
    </div>
  </div>
}

function Info({ icon: Icon, text }: { icon: typeof TrendingUp; text: string }) {
  return <div className="flex items-center gap-3"><div className="rounded-xl bg-slate-100 p-3 text-slate-700"><Icon size={20} /></div><p className="font-semibold text-slate-900">{text}</p></div>
}

function MiniMetric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return <div className={`rounded-xl border p-3 ${danger ? 'border-red-100 bg-red-50/40' : 'border-slate-100 bg-slate-50/50'}`}><p className="text-xs font-medium text-slate-500">{label}</p><p className={`mt-1 text-lg font-bold ${danger ? 'text-red-700' : 'text-slate-950'}`}>{value}</p></div>
}

function NamedAmountList({ rows, showQuantity = false, compact = false }: { rows: NamedAmount[]; showQuantity?: boolean; compact?: boolean }) {
  const max = Math.max(...rows.map(row => row.count), 1)
  return <div className="space-y-3">{rows.slice(0, compact ? 5 : 10).map(row => <div key={row.name}><div className="mb-1 flex items-center justify-between gap-2 text-sm"><span className="truncate font-medium text-slate-700">{row.name}</span><span className="shrink-0 font-semibold text-slate-950">{row.count} · {amount(row.amount)}{showQuantity ? ` · Qty ${row.quantity.toLocaleString('en-BD')}` : ''}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.count / max * 100}%` }} /></div></div>)}{!rows.length && <p className="py-8 text-center text-sm text-slate-400">No data for the selected period.</p>}</div>
}

function StatusTiles({ rows }: { rows: [string, number][] }) {
  return <div className="grid grid-cols-2 gap-2">{rows.map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-950">{value}</p></div>)}</div>
}

function Attention({ label, value, href }: { label: string; value: string; href: string }) {
  return <Link to={href} className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/40 p-3 hover:bg-red-50"><div><p className="text-xs font-medium text-red-600">{label}</p><p className="mt-1 font-bold text-slate-950">{value}</p></div><ArrowRight size={16} className="text-red-400" /></Link>
}
