import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
import { useCustomerCreditSummary } from '@/hooks/useCustomerCreditReport'
import { useChannels } from '@/hooks/useCustomers'
import { useSuperAdminCreditRisk, useSuperAdminFinanceAnalysis, useSuperAdminOperations, useSuperAdminPurchaseDetails, useSuperAdminStockMovement, useSuperAdminStockSummary } from '@/hooks/useSuperAdminDashboard'
import type { CreditRiskCustomer, FinanceChequeRow, FinanceLcRow, FinanceTaxAitCompany, NamedAmount, StockMovementProduct } from '@/types/superAdminDashboard'
import { InvoiceChallanLookup } from '@/components/dashboard/InvoiceChallanLookup'
import { InvoiceChallanPairReport } from '@/components/dashboard/InvoiceChallanPairReport'
import { DashboardMapsTab, DeliveryAuditAttention } from '@/components/dashboard/DashboardMapsTab'
import { DashboardDataTable } from '@/components/dashboard/DashboardDataTable'
import { DashboardExcelButton } from '@/components/dashboard/DashboardExcelButton'
import { OverviewDrilldownModal } from '@/components/dashboard/OverviewDrilldownModal'
import type { OverviewDrilldownKind } from '@/components/dashboard/OverviewDrilldownModal'
import { MarketingPerformanceDrilldownModal } from '@/components/dashboard/MarketingPerformanceDrilldownModal'
import { CreditAgingDrilldownModal } from '@/components/dashboard/CreditAgingDrilldownModal'
import type { CreditAgingBucket } from '@/components/dashboard/CreditAgingDrilldownModal'
import { DashboardChartsTab } from '@/components/dashboard/DashboardChartsTab'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import { analyseCreditRisk } from '@/utils/creditRiskAnalysis'
import type { CreditRiskAnalysisRow } from '@/utils/creditRiskAnalysis'

function dateText(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function recentDaysRange(days = 60) {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  return { start: dateText(start), end: dateText(end) }
}

function amount(value: number, fractionDigits = 0) {
  return `৳ ${value.toLocaleString('en-BD', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`
}

function displayDate(value: string | null | undefined) {
  if (!value) return '—'
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

interface MarketingPerformance {
  name: string
  sales: number
  recovery: number
  outstanding: number
  rate: number
  customers: number
}

interface CreditUniverseRow extends CreditRiskAnalysisRow {
  creditShare: number
  cumulativeShare: number
}

const dashboardTabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'sales-recovery', label: 'Sales & Recovery' },
  { key: 'credit-risk', label: 'Credit Risk' },
  { key: 'stock-purchase', label: 'Stock & Purchase' },
  { key: 'order-operations', label: 'Order Operations' },
  { key: 'finance', label: 'Finance' },
  { key: 'attention', label: 'Action Center' },
  { key: 'maps', label: 'Maps' },
  { key: 'charts', label: 'Charts' },
] as const

type DashboardTab = typeof dashboardTabs[number]['key']

const stockMovementTabs = [
  { key: 'Fast Moving', label: 'Fast moving', countKey: 'fastMovingCount' },
  { key: 'Medium Moving', label: 'Medium', countKey: 'mediumMovingCount' },
  { key: 'Slow Moving', label: 'Slow', countKey: 'slowMovingCount' },
  { key: 'Idle', label: 'Idle', countKey: 'idleCount' },
  { key: 'Dead Stock', label: 'Dead stock', countKey: 'deadCount' },
  { key: 'Never Moved', label: 'Never moved', countKey: 'neverMovedCount' },
] as const

type StockMovementClass = typeof stockMovementTabs[number]['key']

function getMarketingPerformance(rows: CreditRiskAnalysisRow[]): MarketingPerformance[] {
  const result = new Map<string, { sales: number; recovery: number; customers: Set<string> }>()

  for (const row of rows) {
    const name = row.marketingName
    const current = result.get(name) ?? { sales: 0, recovery: 0, customers: new Set<string>() }
    current.sales += row.sales
    current.recovery += row.payment
    current.customers.add(row.customerName)
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

function MetricCard({ title, value, detail, icon: Icon, tone = 'slate', onClick }: {
  title: string; value: string; detail: string; icon: typeof TrendingUp; tone?: keyof typeof cardTones; onClick?: () => void
}) {
  const content = <div className="flex items-start justify-between gap-3">
    <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>
    <div className={`rounded-xl p-2.5 ${cardTones[tone]}`}><Icon size={19} /></div>
  </div>

  if (onClick) return <button
    type="button"
    onClick={onClick}
    className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
    title={`View ${title.toLowerCase()} details`}
  >
    {content}
  </button>

  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    {content}
  </div>
}

function TableHeading({ title, action }: { title: string; action: React.ReactNode }) {
  return <div className="mb-3 flex items-center justify-between gap-3">
    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    {action}
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

function CompactDateRange({ startDate, endDate, onApply, label = 'Period' }: { startDate: string; endDate: string; onApply: (start: string, end: string) => void; label?: string }) {
  const [open, setOpen] = useState(false)
  const [draftStart, setDraftStart] = useState(startDate)
  const [draftEnd, setDraftEnd] = useState(endDate)

  const apply = () => {
    if (!draftStart || !draftEnd || draftStart > draftEnd) return
    onApply(draftStart, draftEnd)
    setOpen(false)
  }

  return <div className="relative">
    <button type="button" onClick={() => { setDraftStart(startDate); setDraftEnd(endDate); setOpen(value => !value) }} className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" title={`Change ${label.toLowerCase()}`}>
      <CalendarDays size={14} /><span className="hidden md:inline">{startDate} – {endDate}</span><span className="md:hidden">Period</span><ChevronDown size={13} />
    </button>
    {open && <div className="absolute right-0 top-10 z-30 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <p className="mb-3 text-xs font-semibold text-slate-700">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] font-medium text-slate-500">Start<input type="date" value={draftStart} max={draftEnd} onChange={event => setDraftStart(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-900" /></label>
        <label className="text-[11px] font-medium text-slate-500">End<input type="date" value={draftEnd} min={draftStart} onChange={event => setDraftEnd(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-900" /></label>
      </div>
      {draftStart > draftEnd && <p className="mt-2 text-xs text-red-600">Start date must be before the end date.</p>}
      <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="button" disabled={!draftStart || !draftEnd || draftStart > draftEnd} onClick={apply} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Apply</button></div>
    </div>}
  </div>
}

async function exportCreditBehaviour(rows: CreditRiskAnalysisRow[], startDate: string, endDate: string) {
  await exportExcelOnDemand({
    fileName: `Dashboard_Customer_Credit_Risk_${startDate}_to_${endDate}`,
    title: 'Customer Behaviour and Recovery Risk',
    subtitle: `${startDate} to ${endDate}`,
    sheetName: 'Customer Risk',
    columns: [
      { key: 'customerName', header: 'Customer', width: 28 },
      { key: 'marketingName', header: 'Marketing', width: 22 },
      { key: 'activityClass', header: 'Class' },
      { key: 'opening', header: 'Opening', format: 'number' },
      { key: 'sales', header: 'Sales', format: 'number' },
      { key: 'payment', header: 'Payment', format: 'number' },
      { key: 'closing', header: 'Closing', format: 'number' },
      { key: 'recoveryRate', header: 'Recovery %', format: 'number' },
      { key: 'daysSinceLastPayment', header: 'Days Since Payment', format: 'integer' },
      { key: 'riskLevel', header: 'Risk' },
    ],
    data: rows as unknown as Record<string, unknown>[],
    filters: [['Date Range', `${startDate} – ${endDate}`]],
    summaryCards: [
      ['Customers', rows.length],
      ['Closing Balance', rows.reduce((sum, row) => sum + row.closing, 0)],
      ['High Risk', rows.filter(row => row.riskLevel === 'High').length],
    ],
  })
}

async function exportInvoiceAgeing(rows: CreditRiskCustomer[], asOfDate: string) {
  await exportExcelOnDemand({
    fileName: `Dashboard_Invoice_Ageing_${asOfDate}`,
    title: 'Invoice Ageing Position',
    subtitle: `As of ${asOfDate}`,
    sheetName: 'Invoice Ageing',
    columns: [
      { key: 'customerName', header: 'Customer', width: 28 },
      { key: 'marketingName', header: 'Marketing', width: 22 },
      { key: 'invoiceCount', header: 'Outstanding Invoices', format: 'integer' },
      { key: 'totalDue', header: 'Total Due', format: 'number' },
      { key: 'overdueAmount', header: 'Overdue', format: 'number' },
      { key: 'oldestDueDays', header: 'Oldest Days', format: 'integer' },
      { key: 'riskLevel', header: 'Risk' },
    ],
    data: rows as unknown as Record<string, unknown>[],
    filters: [['As of Date', asOfDate]],
    summaryCards: [
      ['Customers', rows.length],
      ['Total Due', rows.reduce((sum, row) => sum + row.totalDue, 0)],
      ['Overdue', rows.reduce((sum, row) => sum + row.overdueAmount, 0)],
    ],
  })
}

async function exportStockMovement(
  rows: StockMovementProduct[],
  startDate: string,
  endDate: string,
  channel: string,
  movementClass: string,
) {
  await exportExcelOnDemand({
    fileName: `Dashboard_Inventory_Movement_${movementClass.replaceAll(' ', '_')}_${endDate}`,
    title: 'Inventory Movement Analysis',
    subtitle: `${movementClass} · ${startDate} to ${endDate}`,
    sheetName: 'Inventory Movement',
    columns: [
      { key: 'productName', header: 'Product', width: 30 },
      { key: 'categoryName', header: 'Category', width: 20 },
      { key: 'currentQuantity', header: 'Current Qty', format: 'number' },
      { key: 'periodIssuedQuantity', header: 'Issued', format: 'number' },
      { key: 'periodTransactionCount', header: 'Transactions', format: 'integer' },
      { key: 'lastMovementDate', header: 'Last Movement', format: 'date' },
      { key: 'averageMonthlyIssue', header: 'Average / Month', format: 'number' },
      { key: 'monthsOfStock', header: 'Months Stock', format: 'number' },
      { key: 'stockValue', header: 'Stock Value', format: 'number' },
      { key: 'movementClass', header: 'Class' },
    ],
    data: rows as unknown as Record<string, unknown>[],
    filters: [
      ['Date Range', `${startDate} – ${endDate}`],
      ['Channel', channel],
      ['Movement Class', movementClass],
    ],
    summaryCards: [
      ['Products', rows.length],
      ['Current Quantity', rows.reduce((sum, row) => sum + row.currentQuantity, 0)],
      ['Stock Value', rows.reduce((sum, row) => sum + row.stockValue, 0)],
    ],
  })
}

async function exportMarketingPerformance(rows: MarketingPerformance[], startDate: string, endDate: string) {
  await exportExcelOnDemand({
    fileName: `Dashboard_Marketing_Performance_${startDate}_to_${endDate}`,
    title: 'Marketing Performance — Sales vs Recovery',
    subtitle: `${startDate} to ${endDate}`,
    sheetName: 'Marketing Performance',
    columns: [
      { key: 'name', header: 'Marketing', width: 26 },
      { key: 'customers', header: 'Customers', format: 'integer' },
      { key: 'sales', header: 'Sales', format: 'number' },
      { key: 'recovery', header: 'Recovery', format: 'number' },
      { key: 'outstanding', header: 'Outstanding', format: 'number' },
      { key: 'rate', header: 'Recovery %', format: 'number' },
    ],
    data: rows as unknown as Record<string, unknown>[],
    filters: [['Date Range', `${startDate} – ${endDate}`]],
    summaryCards: [
      ['Marketing Team', rows.length],
      ['Sales', rows.reduce((sum, row) => sum + row.sales, 0)],
      ['Recovery', rows.reduce((sum, row) => sum + row.recovery, 0)],
    ],
  })
}

async function exportCreditUniverse(rows: CreditUniverseRow[], startDate: string, endDate: string) {
  await exportExcelOnDemand({
    fileName: `Dashboard_80_Percent_Credit_Universe_${endDate}`,
    title: 'Customers Covering 80% of Credit Universe',
    subtitle: `${startDate} to ${endDate}`,
    sheetName: 'Credit Concentration',
    columns: [
      { key: 'customerName', header: 'Customer', width: 30 },
      { key: 'marketingName', header: 'Marketing', width: 22 },
      { key: 'opening', header: 'Opening', format: 'number' },
      { key: 'sales', header: 'Sales', format: 'number' },
      { key: 'payment', header: 'Recovery', format: 'number' },
      { key: 'closing', header: 'Closing Balance', format: 'number' },
      { key: 'creditShare', header: '% of Total Credit', format: 'number' },
      { key: 'cumulativeShare', header: 'Cumulative %', format: 'number' },
    ],
    data: rows as unknown as Record<string, unknown>[],
    filters: [
      ['Date Range', `${startDate} – ${endDate}`],
      ['Rule', 'Highest positive closing balances until cumulative credit reaches at least 80%'],
    ],
    summaryCards: [
      ['Customers', rows.length],
      ['Closing Balance', rows.reduce((sum, row) => sum + row.closing, 0)],
      ['Cumulative Share', rows.at(-1)?.cumulativeShare ?? 0],
    ],
  })
}

async function exportLcLifecycle(rows: FinanceLcRow[], stage: string) {
  await exportExcelOnDemand({
    fileName: `Dashboard_LC_Lifecycle_${stage.replaceAll(' ', '_')}`,
    title: 'LC Lifecycle Analysis',
    subtitle: `${stage} lifecycle stage`,
    sheetName: 'LC Lifecycle',
    columns: [
      { key: 'customerName', header: 'Customer', width: 28 },
      { key: 'piNumber', header: 'PI Number', width: 18 },
      { key: 'piDate', header: 'PI Date', format: 'date' },
      { key: 'piAmount', header: 'PI Amount', format: 'number' },
      { key: 'currency', header: 'Currency' },
      { key: 'lcNumber', header: 'LC Number', width: 18 },
      { key: 'lcDate', header: 'LC Date', format: 'date' },
      { key: 'paymentTerms', header: 'Payment Terms', width: 20 },
      { key: 'lifecycleStage', header: 'Lifecycle Stage', width: 20 },
    ],
    data: rows as unknown as Record<string, unknown>[],
    filters: [['Lifecycle Stage', stage]],
    summaryCards: [
      ['Records', rows.length],
      ['PI Amount', rows.reduce((sum, row) => sum + row.piAmount, 0)],
    ],
  })
}

async function exportCheques(rows: FinanceChequeRow[], title: string, filter: string) {
  await exportExcelOnDemand({
    fileName: `Dashboard_${title.replaceAll(' ', '_')}`,
    title,
    subtitle: filter,
    sheetName: 'Cheques',
    columns: [
      { key: 'customerName', header: 'Customer', width: 28 },
      { key: 'chequeNumber', header: 'Cheque No.', width: 18 },
      { key: 'amount', header: 'Amount', format: 'number' },
      { key: 'chequeDate', header: 'Cheque Date', format: 'date' },
      { key: 'bankName', header: 'Bank', width: 22 },
      { key: 'collectorName', header: 'Collector', width: 20 },
      { key: 'statusName', header: 'Status' },
      { key: 'daysRemaining', header: 'Days Remaining', format: 'integer' },
    ],
    data: rows as unknown as Record<string, unknown>[],
    filters: [['Status / Window', filter]],
    summaryCards: [
      ['Cheques', rows.length],
      ['Amount', rows.reduce((sum, row) => sum + row.amount, 0)],
    ],
  })
}

async function exportTaxAitCompanies(
  rows: FinanceTaxAitCompany[],
  taxYear: string,
  status: string,
) {
  await exportExcelOnDemand({
    fileName: `Dashboard_Tax_AIT_${taxYear}_${status}`,
    title: 'Tax & AIT Company Analysis',
    subtitle: `Tax year ${taxYear} · ${status}`,
    sheetName: 'Tax AIT Companies',
    columns: [
      { key: 'companyName', header: 'Company', width: 28 },
      { key: 'companyAddress', header: 'Address', width: 30 },
      { key: 'invoiceCount', header: 'Invoices', format: 'integer' },
      { key: 'taxableBase', header: 'Taxable Base', format: 'number' },
      { key: 'vatPayable', header: 'VAT Payable', format: 'number' },
      { key: 'aitPayable', header: 'AIT Payable', format: 'number' },
      { key: 'vatPaid', header: 'VAT Paid', format: 'number' },
      { key: 'aitPaid', header: 'AIT Paid', format: 'number' },
      { key: 'totalPayable', header: 'Total Payable', format: 'number' },
      { key: 'totalPaid', header: 'Total Paid', format: 'number' },
      { key: 'pendingAmount', header: 'Pending', format: 'number' },
      { key: 'status', header: 'Status' },
    ],
    data: rows as unknown as Record<string, unknown>[],
    filters: [
      ['Tax Year', taxYear],
      ['Status', status],
    ],
    summaryCards: [
      ['Companies', rows.length],
      ['Total Payable', rows.reduce((sum, row) => sum + row.totalPayable, 0)],
      ['Total Paid', rows.reduce((sum, row) => sum + row.totalPaid, 0)],
      ['Pending', rows.reduce((sum, row) => sum + row.pendingAmount, 0)],
    ],
  })
}

export function SuperAdminDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const activeTab: DashboardTab = dashboardTabs.some(tab => tab.key === requestedTab)
    ? requestedTab as DashboardTab
    : 'overview'
  const initial = useMemo(() => recentDaysRange(30), [])
  const initialMarketing = useMemo(() => recentDaysRange(60), [])
  const initialMovement = useMemo(() => recentDaysRange(90), [])
  const [overviewRange, setOverviewRange] = useState(initial)
  const [salesRange, setSalesRange] = useState(initial)
  const [orderRange, setOrderRange] = useState(initial)
  const [movementRange, setMovementRange] = useState(initialMovement)
  const [marketingStartDate, setMarketingStartDate] = useState(initialMarketing.start)
  const [marketingEndDate, setMarketingEndDate] = useState(initialMarketing.end)
  const [showAllMarketing, setShowAllMarketing] = useState(false)
  const [activeMovementClass, setActiveMovementClass] = useState<StockMovementClass>('Never Moved')
  const [activeLcStage, setActiveLcStage] = useState('PI Created')
  const [activeChequeStatus, setActiveChequeStatus] = useState('Pending')
  const [activeTaxStatus, setActiveTaxStatus] = useState('All')
  const [activeTaxYear, setActiveTaxYear] = useState('')
  const [stockMovementChannelId, setStockMovementChannelId] = useState(0)
  const [drilldownKind, setDrilldownKind] = useState<OverviewDrilldownKind | null>(null)
  const [creditAgingBucket, setCreditAgingBucket] = useState<CreditAgingBucket | null>(null)
  const [selectedMarketingName, setSelectedMarketingName] = useState<string | null>(null)
  const today = useMemo(() => dateText(new Date()), [])
  const sales = useSalesPaymentSummary(overviewRange.start, overviewRange.end, 'monthly', 'sales', activeTab === 'overview')
  const payment = useSalesPaymentSummary(overviewRange.start, overviewRange.end, 'monthly', 'payment', activeTab === 'overview')
  const dailySales = useSalesPaymentSummary(today, today, 'daily', 'sales')
  const dailyPayment = useSalesPaymentSummary(today, today, 'daily', 'payment')
  const dailyOperations = useSuperAdminOperations(today, today)
  const purchase = useMonthlyPurchaseSalesPayment(overviewRange.start, overviewRange.end, activeTab === 'overview')
  const overviewCredit = useMonthlyCreditReport(
    { employeeId: 0, startDate: overviewRange.start, endDate: overviewRange.end },
    activeTab === 'overview',
  )
  const overviewCreditRows = useMemo(
    () => analyseCreditRisk(overviewCredit.data ?? []),
    [overviewCredit.data],
  )
  const overviewCustomerCredit = useCustomerCreditSummary(
    { customerId: 0, startDate: overviewRange.start, endDate: overviewRange.end },
    activeTab === 'overview',
  )
  const purchaseDetails = useSuperAdminPurchaseDetails(
    overviewRange.start,
    overviewRange.end,
    activeTab === 'overview' && drilldownKind === 'purchases',
  )
  const marketingCredit = useMonthlyCreditReport(
    { employeeId: 0, startDate: marketingStartDate, endDate: marketingEndDate },
    activeTab === 'sales-recovery',
  )
  const marketingCustomerRows = useMemo(
    () => analyseCreditRisk(marketingCredit.data ?? []),
    [marketingCredit.data],
  )
  const creditPeriod = useMemo(() => recentDaysRange(365), [])
  const creditBehaviour = useMonthlyCreditReport({ employeeId: 0, startDate: creditPeriod.start, endDate: creditPeriod.end }, activeTab === 'credit-risk')
  const creditRows = useMemo(() => analyseCreditRisk(creditBehaviour.data ?? []), [creditBehaviour.data])
  const creditTotals = useMemo(() => ({
    opening: creditRows.reduce((sum, row) => sum + row.opening, 0), sales: creditRows.reduce((sum, row) => sum + row.sales, 0),
    payment: creditRows.reduce((sum, row) => sum + row.payment, 0), closing: creditRows.reduce((sum, row) => sum + row.closing, 0),
    high: creditRows.filter(row => row.riskLevel === 'High').length, medium: creditRows.filter(row => row.riskLevel === 'Medium').length,
  }), [creditRows])
  const pending = usePendingCancelReport()
  const delivery = useDailyInvoiceTracking({ startDate: overviewRange.start, endDate: overviewRange.end, partnerId: 0 }, activeTab === 'overview')
  const allowance = useAllowanceChecking({ startDate: overviewRange.start, endDate: overviewRange.end, employeeId: 0 }, activeTab === 'overview')
  const stock = useCurrentStock({ productId: 0, channelId: 0 })
  const creditRisk = useSuperAdminCreditRisk(creditPeriod.end, activeTab === 'credit-risk' || activeTab === 'attention' || activeTab === 'charts')
  const stockSummary = useSuperAdminStockSummary(0, activeTab === 'overview' || activeTab === 'stock-purchase' || activeTab === 'attention')
  const stockMovementChannels = useChannels()
  const stockMovement = useSuperAdminStockMovement(movementRange.start, movementRange.end, stockMovementChannelId, activeTab === 'stock-purchase' || activeTab === 'charts')
  const overviewOperations = useSuperAdminOperations(overviewRange.start, overviewRange.end, activeTab === 'overview')
  const salesOperations = useSuperAdminOperations(salesRange.start, salesRange.end, activeTab === 'sales-recovery')
  const orderOperations = useSuperAdminOperations(orderRange.start, orderRange.end, activeTab === 'order-operations')
  const financeAnalysis = useSuperAdminFinanceAnalysis(today, activeTab === 'overview' || activeTab === 'finance' || activeTab === 'attention')
  const attentionOperations = useSuperAdminOperations(initial.start, initial.end, activeTab === 'attention')

  const totalSales = (sales.data ?? []).reduce((s, x) => s + (x.amount ?? 0), 0)
  const totalRecovery = (payment.data ?? []).reduce((s, x) => s + (x.amount ?? 0), 0)
  const todaySales = (dailySales.data ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0)
  const todayCollection = (dailyPayment.data ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0)
  const todayDelivered = dailyOperations.data?.deliveredOrders ?? 0
  const todayPending = dailyOperations.data?.pendingOrders ?? 0
  const todayLogged = (dailyOperations.data?.orderStatuses ?? []).reduce((sum, row) => sum + row.count, 0)
  const totalPurchase = (purchase.data ?? []).reduce((s, x) => s + (x.totalPurchase ?? 0), 0)
  const customerCreditRows = overviewCustomerCredit.data ?? []
  const customerDue = customerCreditRows.reduce((sum, row) => {
    const closingBalance = Number(row.totalDue ?? 0)
    return sum + (Number.isFinite(closingBalance) ? closingBalance : 0)
  }, 0)
  const recoveryRate = totalSales ? totalRecovery / totalSales * 100 : 0
  const performance = getMarketingPerformance(
    activeTab === 'overview' ? overviewCreditRows : marketingCustomerRows,
  )
  const visiblePerformance = showAllMarketing ? performance : performance.slice(0, 11)
  const selectedMarketingCustomers = useMemo(
    () => selectedMarketingName
      ? marketingCustomerRows.filter(row => row.marketingName === selectedMarketingName)
      : [],
    [marketingCustomerRows, selectedMarketingName],
  )
  const creditUniverseRows = useMemo(() => {
    const positiveRows = marketingCustomerRows
      .filter(row => row.closing > 0)
      .sort((left, right) => right.closing - left.closing)
    const totalCredit = positiveRows.reduce((sum, row) => sum + row.closing, 0)
    const selected: CreditUniverseRow[] = []
    let cumulative = 0

    for (const row of positiveRows) {
      if (totalCredit <= 0 || cumulative / totalCredit >= 0.8) break
      cumulative += row.closing
      selected.push({
        ...row,
        creditShare: row.closing / totalCredit * 100,
        cumulativeShare: cumulative / totalCredit * 100,
      })
    }

    return selected
  }, [marketingCustomerRows])
  const visibleMovementProducts = useMemo(
    () => (stockMovement.data?.products ?? []).filter(row => row.movementClass === activeMovementClass),
    [activeMovementClass, stockMovement.data?.products],
  )
  const selectedStockMovementChannel = useMemo(
    () => stockMovementChannelId === 0
      ? 'All channels'
      : stockMovementChannels.data?.find(channel => channel.channelId === stockMovementChannelId)?.channelName ?? 'Selected channel',
    [stockMovementChannelId, stockMovementChannels.data],
  )
  const pendingRows = pending.data ?? []
  const deliveryRows = delivery.data ?? []
  const allowanceRows = allowance.data ?? []
  const stockRows = stock.data ?? []
  const stockQuantity = stockRows.reduce((sum, row) => sum + (row.currentQty ?? 0), 0)
  const taxYears = useMemo(
    () => financeAnalysis.data?.taxYears ?? [],
    [financeAnalysis.data?.taxYears],
  )
  const currentTaxYear = taxYears.find(year => year.isCurrent)
  const selectedTaxYear = taxYears.find(year => year.label === activeTaxYear)
    ?? currentTaxYear
  const taxAitCompanies = useMemo(
    () => selectedTaxYear?.companies ?? financeAnalysis.data?.taxAitCompanies ?? [],
    [financeAnalysis.data?.taxAitCompanies, selectedTaxYear?.companies],
  )
  const currentTaxCompanies = useMemo(
    () => currentTaxYear?.companies ?? financeAnalysis.data?.taxAitCompanies ?? [],
    [currentTaxYear?.companies, financeAnalysis.data?.taxAitCompanies],
  )
  const taxAitAmount = currentTaxCompanies.reduce((sum, row) => sum + row.aitPayable, 0)
  const taxAitPending = currentTaxCompanies.reduce((sum, row) => sum + row.pendingAmount, 0)
  const visibleLcRows = useMemo(
    () => (financeAnalysis.data?.lcRows ?? []).filter(row => activeLcStage === 'All' || row.lifecycleStage === activeLcStage),
    [activeLcStage, financeAnalysis.data?.lcRows],
  )
  const visibleChequeRows = useMemo(
    () => (financeAnalysis.data?.chequeRows ?? []).filter(row => activeChequeStatus === 'All' || row.statusName === activeChequeStatus),
    [activeChequeStatus, financeAnalysis.data?.chequeRows],
  )
  const visibleTaxAitCompanies = useMemo(
    () => taxAitCompanies.filter(row => activeTaxStatus === 'All' || row.status === activeTaxStatus),
    [activeTaxStatus, taxAitCompanies],
  )
  const upcomingChequeRows = financeAnalysis.data?.upcomingCheques ?? []
  const taxYearLabel = selectedTaxYear?.label ?? financeAnalysis.data?.taxYearLabel ?? ''
  const pendingOrderRows = overviewOperations.data?.pendingOrderDetails ?? []
  const taxAitTotals = useMemo(() => ({
    payable: taxAitCompanies.reduce((sum, row) => sum + row.totalPayable, 0),
    paid: taxAitCompanies.reduce((sum, row) => sum + row.totalPaid, 0),
    pending: taxAitCompanies.reduce((sum, row) => sum + row.pendingAmount, 0),
    paidCompanies: taxAitCompanies.filter(row => row.status === 'Paid').length,
    pendingCompanies: taxAitCompanies.filter(row => row.status === 'Pending').length,
  }), [taxAitCompanies])
  const dailyRefreshing = dailySales.isFetching || dailyPayment.isFetching || dailyOperations.isFetching
  const dailyLastUpdatedAt = Math.max(
    dailySales.dataUpdatedAt ?? 0,
    dailyPayment.dataUpdatedAt ?? 0,
    dailyOperations.dataUpdatedAt ?? 0,
  )
  const dailyLastUpdated = dailyLastUpdatedAt > 0 ? new Date(dailyLastUpdatedAt) : null

  const refreshToday = useCallback(async () => {
    if (dailyRefreshing) return
    await Promise.all([dailySales.refetch(), dailyPayment.refetch(), dailyOperations.refetch()])
  }, [dailyOperations, dailyPayment, dailyRefreshing, dailySales])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshToday()
    }, 5 * 60 * 1000)
    return () => window.clearInterval(intervalId)
  }, [refreshToday])

  const selectTab = (tab: DashboardTab) => {
    const next = new URLSearchParams(searchParams)
    if (tab === 'overview') next.delete('tab')
    else next.set('tab', tab)
    if (tab !== 'maps') next.delete('mapSection')
    setSearchParams(next, { replace: true })
  }

  const openDeliveryAudit = () => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', 'maps')
    next.set('mapSection', 'audit')
    setSearchParams(next, { replace: true })
  }

  return <div className="space-y-5 bg-slate-50/50">
    <InvoiceChallanLookup />
    <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-lg">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-emerald-300">Super Admin</p><h1 className="mt-1 text-2xl font-bold">Executive ERP Dashboard</h1><p className="mt-1 text-sm text-slate-300">Sales, recovery, credit risk and operational performance.</p></div>
      </div>
    </div>

    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div><h2 className="font-semibold text-slate-950">Today's Business</h2><p className="text-xs text-slate-500">Daily position for {today}{dailyLastUpdated ? ` · Last updated ${dailyLastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</p></div>
        <button type="button" onClick={() => void refreshToday()} disabled={dailyRefreshing} className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60" title="Refresh today's business" aria-label="Refresh today's business">
          <RefreshCw size={14} className={dailyRefreshing ? 'animate-spin' : ''} /><span className="hidden sm:inline">{dailyRefreshing ? 'Updating…' : 'Refresh'}</span>
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Daily Sales" value={amount(todaySales)} detail="Sales logged today" icon={ShoppingCart} tone="blue" />
        <MetricCard title="Daily Collection" value={amount(todayCollection)} detail="Collections received today" icon={CircleDollarSign} tone="green" />
        <MetricCard title="Orders Logged" value={String(todayLogged)} detail="Total orders logged today" icon={BadgeCheck} tone="blue" />
        <MetricCard title="Delivered" value={String(todayDelivered)} detail="Today's logged orders delivered" icon={PackageCheck} tone="green" />
        <MetricCard title="Pending" value={String(todayPending)} detail="Today's logged orders still pending" icon={Clock3} tone="amber" />
      </div>
      {(dailySales.isError || dailyPayment.isError || dailyOperations.isError) && <p className="mt-2 text-xs font-medium text-red-600">One or more daily summaries could not be loaded. Please retry.</p>}
    </section>

    <nav className="sticky top-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-sm backdrop-blur" aria-label="Dashboard sections">
      <div className="flex gap-1 overflow-x-auto">
        {dashboardTabs.map(tab => <button key={tab.key} type="button" onClick={() => selectTab(tab.key)} className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${activeTab === tab.key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}>{tab.label}</button>)}
      </div>
    </nav>

    {activeTab === 'overview' && <><div className="flex justify-end"><CompactDateRange startDate={overviewRange.start} endDate={overviewRange.end} label="Overview period" onApply={(start, end) => setOverviewRange({ start, end })} /></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="Total Sales" value={amount(totalSales)} detail="View customer sales and open due" icon={ShoppingCart} tone="blue" onClick={() => setDrilldownKind('sales')} />
      <MetricCard title="Recovery" value={amount(totalRecovery)} detail={`${recoveryRate.toFixed(1)}% · view customer closing`} icon={CircleDollarSign} tone="green" onClick={() => setDrilldownKind('recovery')} />
      <MetricCard title="Outstanding" value={amount(totalSales - totalRecovery)} detail="Period sales less recovery" icon={CreditCard} tone="red" />
      <MetricCard title="Purchases" value={amount(totalPurchase)} detail="View supplier purchase details" icon={PackageCheck} tone="amber" onClick={() => setDrilldownKind('purchases')} />
      <MetricCard title="Pending Orders" value={String(pendingOrderRows.length)} detail={`${pendingOrderRows.filter(row => row.daysPending > 7).length} over 7 days · view details`} icon={AlertTriangle} tone="red" onClick={() => setDrilldownKind('pending-orders')} />
      <MetricCard title="Tracked Deliveries" value={String(deliveryRows.length)} detail="Lifecycle records" icon={Clock3} />
      <MetricCard title="Allowance Checks" value={String(allowanceRows.length)} detail="Workflow records" icon={BadgeCheck} tone="amber" />
      <MetricCard title="Marketing Team" value={String(performance.length)} detail="Employees represented" icon={Users} tone="blue" />
      <MetricCard title="Stock Value" value={amount(stockSummary.data?.totalStockValue ?? 0)} detail={`${stockSummary.data?.productCount ?? stockRows.length} products · view calculation`} icon={PackageCheck} tone="green" onClick={() => setDrilldownKind('stock-value')} />
      <MetricCard title="AIT Payable" value={amount(taxAitAmount)} detail={`${taxAitCompanies.length} taxable companies · current tax year`} icon={Banknote} tone="amber" />
      <MetricCard
        title="Customer Due"
        value={amount(customerDue, 2)}
        detail={`${customerCreditRows.length} customers · credit summary closing balance`}
        icon={CreditCard}
        tone="red"
      />
    </div>

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Section title="Credit & Due" detail="Opening, sales, payments, returns and running due" href="/reports/customer-credit"><Info icon={CreditCard} text="Customer credit and due investigation" /></Section>
      <Section title="Delivery Lifecycle" detail="Invoice stage and turnaround time" href="/reports/daily-invoice-tracking"><Info icon={CalendarDays} text={`${deliveryRows.length} tracked delivery records`} /></Section>
      <Section title="Allowance Control" detail="Operational allowance verification" href="/reports/allowance-checking"><Info icon={Banknote} text={`${allowanceRows.length} allowance records`} /></Section>
    </div></>}

    {activeTab === 'credit-risk' && <Section title="Customer Credit Risk Analysis" detail={`365-day behaviour · 60-day recovery cycle · as of ${creditPeriod.end}`}>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <MiniMetric label="Opening" value={amount(creditTotals.opening)} />
        <MiniMetric label="365-day sales" value={amount(creditTotals.sales)} />
        <MiniMetric label="365-day recovery" value={amount(creditTotals.payment)} />
        <MiniMetric label="Closing" value={amount(creditTotals.closing)} danger={creditTotals.closing > 0} />
        <MiniMetric label="Medium risk" value={String(creditTotals.medium)} />
        <MiniMetric label="High risk" value={String(creditTotals.high)} danger />
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { bucket: 'days0To30' as const, label: '0–30 days', value: creditRisk.data?.days0To30 ?? 0, colour: 'bg-emerald-500' },
          { bucket: 'days31To60' as const, label: '31–60 days', value: creditRisk.data?.days31To60 ?? 0, colour: 'bg-amber-400' },
          { bucket: 'days61To90' as const, label: '61–90 days', value: creditRisk.data?.days61To90 ?? 0, colour: 'bg-orange-500' },
          { bucket: 'daysOver90' as const, label: 'Over 90 days', value: creditRisk.data?.daysOver90 ?? 0, colour: 'bg-red-500' },
        ].map(item => <button
          key={item.bucket}
          type="button"
          onClick={() => setCreditAgingBucket(item.bucket)}
          className="rounded-xl border border-slate-100 p-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          title={`View ${item.label} customer details`}
        >
          <div className={`mb-2 h-1.5 rounded-full ${item.colour}`} />
          <p className="text-xs font-medium text-slate-500">{item.label}</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{amount(item.value)}</p>
          <p className="mt-1 text-[11px] font-semibold text-emerald-700">View customers</p>
        </button>)}
      </div>
      <div className="mb-6">
        <TableHeading
          title="Customer behaviour and recovery risk"
          action={<DashboardExcelButton disabled={!creditRows.length} onExport={() => exportCreditBehaviour(creditRows, creditPeriod.start, creditPeriod.end)} />}
        />
        <DashboardDataTable
          rows={creditRows}
          minWidthClassName="min-w-[1120px]"
          defaultSort={{ columnId: 'closing', direction: 'desc' }}
          initialRowCount={30}
          collapsedLabel={`Load all (${creditRows.length})`}
          rowKey={(row, index) => `${row.marketingName}-${row.customerName}-${index}`}
          rowClassName={row => row.riskLevel === 'High' ? 'bg-red-50/50' : row.riskLevel === 'Medium' ? 'bg-amber-50/40' : 'bg-emerald-50/20'}
          columns={[
            { id: 'customer', header: 'Customer', sortValue: row => row.customerName, render: row => <span className="font-semibold text-slate-900">{row.customerName}</span> },
            { id: 'marketing', header: 'Marketing', sortValue: row => row.marketingName, render: row => row.marketingName },
            { id: 'class', header: 'Class', sortValue: row => row.activityClass, render: row => row.activityClass },
            { id: 'opening', header: 'Opening', align: 'right', sortValue: row => row.opening, render: row => amount(row.opening) },
            { id: 'sales', header: 'Sales', align: 'right', sortValue: row => row.sales, render: row => amount(row.sales) },
            { id: 'payment', header: 'Payment', align: 'right', sortValue: row => row.payment, render: row => amount(row.payment) },
            { id: 'closing', header: 'Closing', align: 'right', sortValue: row => row.closing, render: row => <span className="font-semibold">{amount(row.closing)}</span> },
            { id: 'recovery', header: 'Recovery', align: 'right', sortValue: row => row.recoveryRate, render: row => `${row.recoveryRate.toFixed(1)}%` },
            { id: 'lastPayment', header: 'Last payment', align: 'right', sortValue: row => row.daysSinceLastPayment, render: row => row.daysSinceLastPayment == null ? 'No payment' : `${row.daysSinceLastPayment} days` },
            { id: 'risk', header: 'Risk', align: 'right', sortValue: row => row.riskLevel, render: row => <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.riskLevel === 'High' ? 'bg-red-100 text-red-700' : row.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{row.riskLevel}</span> },
          ]}
        />
        {creditBehaviour.isLoading && <p className="py-8 text-center text-sm text-slate-500">Loading 365-day customer behaviour…</p>}
        {creditBehaviour.isError && <p className="py-8 text-center text-sm text-red-600">Monthly credit data could not be loaded.</p>}
      </div>

      <TableHeading
        title="Invoice ageing position"
        action={<DashboardExcelButton disabled={!(creditRisk.data?.topCustomers.length)} onExport={() => exportInvoiceAgeing(creditRisk.data?.topCustomers ?? [], creditPeriod.end)} />}
      />
      <DashboardDataTable
        rows={creditRisk.data?.topCustomers ?? []}
        minWidthClassName="min-w-[900px]"
        defaultSort={{ columnId: 'overdue', direction: 'desc' }}
        initialRowCount={20}
        rowKey={row => row.customerId}
        columns={[
          { id: 'customer', header: 'Customer', sortValue: row => row.customerName, render: row => <Link className="font-semibold text-slate-900 hover:text-emerald-700" to={`/customers/${row.customerId}/transactions`}>{row.customerName}</Link> },
          { id: 'marketing', header: 'Marketing', sortValue: row => row.marketingName, render: row => row.marketingName || 'Unassigned' },
          { id: 'invoices', header: 'Invoices', align: 'right', sortValue: row => row.invoiceCount, render: row => row.invoiceCount },
          { id: 'due', header: 'Total due', align: 'right', sortValue: row => row.totalDue, render: row => <span className="font-semibold">{amount(row.totalDue)}</span> },
          { id: 'overdue', header: 'Overdue', align: 'right', sortValue: row => row.overdueAmount, render: row => <span className="text-red-700">{amount(row.overdueAmount)}</span> },
          { id: 'oldest', header: 'Oldest', align: 'right', sortValue: row => row.oldestDueDays, render: row => `${row.oldestDueDays} days` },
          { id: 'risk', header: 'Risk', align: 'right', sortValue: row => row.riskLevel, render: row => <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.riskLevel === 'Critical' ? 'bg-red-100 text-red-700' : row.riskLevel === 'High' ? 'bg-orange-100 text-orange-700' : row.riskLevel === 'Watch' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{row.riskLevel}</span> },
        ]}
      />
      {creditRisk.isError && <p className="py-8 text-center text-sm text-red-600">Credit-risk API is not available. Deploy the Phase 2 backend files and refresh.</p>}
    </Section>}

    {activeTab === 'stock-purchase' && <Section title="Purchase & Stock Valuation" detail="Current quantity valued at latest confirmed purchase price" href="/reports/current-stock">
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
    </Section>}

    {activeTab === 'stock-purchase' && <Section title="Inventory Movement Analysis" detail={`${selectedStockMovementChannel} · confirmed stock issues; idle age is measured as of today`} action={<div className="flex flex-wrap items-center justify-end gap-2">
      <label className="sr-only" htmlFor="stock-movement-channel">Stock movement channel</label>
      <select
        id="stock-movement-channel"
        value={stockMovementChannelId}
        onChange={event => setStockMovementChannelId(Number(event.target.value))}
        disabled={stockMovementChannels.isLoading}
        className="h-8 max-w-48 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 focus:border-emerald-500 disabled:cursor-wait disabled:opacity-60"
      >
        <option value={0}>{stockMovementChannels.isLoading ? 'Loading channels…' : 'All Channels'}</option>
        {(stockMovementChannels.data ?? []).map(channel => <option key={channel.channelId} value={channel.channelId}>{channel.channelName}</option>)}
      </select>
      <CompactDateRange startDate={movementRange.start} endDate={movementRange.end} label="Movement period" onApply={(start, end) => setMovementRange({ start, end })} />
      <DashboardExcelButton
        disabled={!visibleMovementProducts.length}
        onExport={() => exportStockMovement(visibleMovementProducts, movementRange.start, movementRange.end, selectedStockMovementChannel, activeMovementClass)}
      />
    </div>}>
      {stockMovementChannels.isError && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">The channel list could not be loaded. Showing all-channel movement data.</p>}
      <div className="mb-4 overflow-x-auto border-b border-slate-200">
        <div className="flex min-w-max gap-1" role="tablist" aria-label="Stock movement categories">
          {stockMovementTabs.map(tab => {
            const selected = activeMovementClass === tab.key
            const count = Number(stockMovement.data?.[tab.countKey] ?? 0)
            return <button key={tab.key} type="button" role="tab" aria-selected={selected} onClick={() => setActiveMovementClass(tab.key)} className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${selected ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'}`}>
              {tab.label}<span className={`rounded-full px-2 py-0.5 text-xs ${selected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{count}</span>
            </button>
          })}
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-500"><span>Idle value: <b className="text-slate-800">{amount(stockMovement.data?.idleStockValue ?? 0)}</b></span><span>Dead/never-moved value: <b className="text-red-700">{amount(stockMovement.data?.deadStockValue ?? 0)}</b></span></div>
      <div role="tabpanel">
        <DashboardDataTable
          rows={visibleMovementProducts}
          minWidthClassName="min-w-[1180px]"
          defaultSort={{ columnId: 'stockValue', direction: 'desc' }}
          initialRowCount={20}
          expansionKey={`${activeMovementClass}-${stockMovementChannelId}-${movementRange.start}-${movementRange.end}`}
          rowKey={row => row.productId}
          columns={[
            { id: 'product', header: 'Product', sortValue: row => row.productName, render: row => <p className="font-semibold text-slate-900">{row.productName}</p> },
            { id: 'category', header: 'Category', sortValue: row => row.categoryName || 'Uncategorised', render: row => row.categoryName || 'Uncategorised' },
            { id: 'currentQty', header: 'Current qty', align: 'right', sortValue: row => row.currentQuantity, render: row => row.currentQuantity.toLocaleString('en-BD') },
            { id: 'issued', header: 'Issued', align: 'right', sortValue: row => row.periodIssuedQuantity, render: row => row.periodIssuedQuantity.toLocaleString('en-BD') },
            { id: 'transactions', header: 'Transactions', align: 'right', sortValue: row => row.periodTransactionCount, render: row => row.periodTransactionCount },
            { id: 'lastMovement', header: 'Last movement', align: 'right', sortValue: row => row.daysSinceLastMovement, render: row => row.lastMovementDate ? `${row.daysSinceLastMovement} days ago` : 'Never' },
            { id: 'average', header: 'Avg / month', align: 'right', sortValue: row => row.averageMonthlyIssue, render: row => row.averageMonthlyIssue.toFixed(2) },
            { id: 'monthsStock', header: 'Months stock', align: 'right', sortValue: row => row.monthsOfStock, render: row => row.monthsOfStock == null ? '—' : row.monthsOfStock.toFixed(1) },
            { id: 'stockValue', header: 'Stock value', align: 'right', sortValue: row => row.stockValue, render: row => amount(row.stockValue) },
            { id: 'class', header: 'Class', align: 'right', sortValue: row => row.movementClass, render: row => <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.movementClass === 'Fast Moving' ? 'bg-emerald-100 text-emerald-700' : row.movementClass === 'Medium Moving' ? 'bg-blue-100 text-blue-700' : row.movementClass === 'Slow Moving' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{row.movementClass}</span> },
          ]}
        />
      </div>
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Classification logic</h3>
        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
          <p><b className="text-emerald-700">Fast moving:</b> moved within 30 days and issued in at least 3 distinct orders during the selected period.</p>
          <p><b className="text-blue-700">Medium:</b> last movement was within 60 days but it does not meet the Fast-moving order-frequency rule.</p>
          <p><b className="text-amber-700">Slow:</b> last movement was 61–90 days ago.</p>
          <p><b className="text-orange-700">Idle:</b> last movement was 91–180 days ago.</p>
          <p><b className="text-red-700">Dead stock:</b> last movement was more than 180 days ago.</p>
          <p><b className="text-slate-700">Never moved:</b> current stock exists but no confirmed issue history was found.</p>
        </div>
      </div>
      {stockMovement.isLoading && <p className="py-8 text-center text-sm text-slate-500">Loading movement analysis…</p>}
      {stockMovement.isError && <p className="py-8 text-center text-sm text-red-600">Stock-movement API is unavailable. Deploy the included backend files.</p>}
    </Section>}

    {activeTab === 'sales-recovery' && <Section title="Sales Type Breakdown" detail="Delivered regular, sample and loan activity" href="/reports/sales" action={<CompactDateRange startDate={salesRange.start} endDate={salesRange.end} label="Sales period" onApply={(start, end) => setSalesRange({ start, end })} />}>
      <NamedAmountList rows={salesOperations.data?.salesTypes ?? []} showQuantity />
    </Section>}

    {activeTab === 'order-operations' && <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Section title="Current Order & Delivery Status" detail="Orders grouped by current lifecycle stage" href="/reports/daily-invoice-tracking" action={<CompactDateRange startDate={orderRange.start} endDate={orderRange.end} label="Order period" onApply={(start, end) => setOrderRange({ start, end })} />}>
        <NamedAmountList rows={orderOperations.data?.orderStatuses ?? []} />
      </Section>
      <Section title="Allowance Performance" detail="Assigned through completed allowance workflow" href="/reports/allowance-checking">
        <StatusTiles rows={[
          ['Total', orderOperations.data?.allowance.total ?? 0], ['Assigned', orderOperations.data?.allowance.assigned ?? 0],
          ['Started', orderOperations.data?.allowance.started ?? 0], ['Delivered', orderOperations.data?.allowance.delivered ?? 0],
          ['Completed', orderOperations.data?.allowance.completed ?? 0], ['Pending', orderOperations.data?.allowance.pending ?? 0],
        ]} />
      </Section>
    </div>}

    {activeTab === 'finance' && <>
      <Section
        title="LC Lifecycle Analysis"
        detail="Lifecycle stage from the LC Tracking Report · all report records"
        href="/lc/status"
        action={<DashboardExcelButton
          disabled={!visibleLcRows.length}
          onExport={() => exportLcLifecycle(visibleLcRows, activeLcStage)}
        />}
      >
        <AnalysisTabs
          rows={financeAnalysis.data?.lcLifecycleStages ?? []}
          active={activeLcStage}
          onSelect={setActiveLcStage}
        />
        <DashboardDataTable
          rows={visibleLcRows}
          minWidthClassName="min-w-[1180px]"
          defaultSort={{ columnId: 'piDate', direction: 'desc' }}
          initialRowCount={20}
          expansionKey={activeLcStage}
          rowKey={row => row.piSystemId}
          columns={[
            { id: 'customer', header: 'Customer', sortValue: row => row.customerName, render: row => <p className="font-semibold text-slate-900">{row.customerName || '—'}</p> },
            { id: 'piNumber', header: 'PI number', sortValue: row => row.piNumber, render: row => row.piNumber || '—' },
            { id: 'piDate', header: 'PI date', sortValue: row => row.piDate, render: row => displayDate(row.piDate) },
            { id: 'piAmount', header: 'PI amount', align: 'right', sortValue: row => row.piAmount, render: row => <span className="font-semibold">{amount(row.piAmount)}</span> },
            { id: 'currency', header: 'Currency', sortValue: row => row.currency, render: row => row.currency || '—' },
            { id: 'lcNumber', header: 'LC number', sortValue: row => row.lcNumber, render: row => row.lcNumber || '—' },
            { id: 'lcDate', header: 'LC date', sortValue: row => row.lcDate, render: row => displayDate(row.lcDate) },
            { id: 'paymentTerms', header: 'Payment terms', sortValue: row => row.paymentTerms, render: row => row.paymentTerms || '—' },
            { id: 'stage', header: 'Lifecycle stage', align: 'right', sortValue: row => row.lifecycleStage, render: row => <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">{row.lifecycleStage}</span> },
          ]}
        />
      </Section>

      <Section
        title="Upcoming Cheques — Next 3 Days"
        detail={`${displayDate(financeAnalysis.data?.asOfDate)} through ${displayDate(financeAnalysis.data?.upcomingChequeEndDate)} · Pending, On Hold and Swap only`}
        href="/cheques"
        action={<DashboardExcelButton
          disabled={!upcomingChequeRows.length}
          onExport={() => exportCheques(upcomingChequeRows, 'Upcoming Cheques Next 3 Days', 'Pending + On Hold + Swap')}
        />}
      >
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <MiniMetric label="Cheques" value={String(upcomingChequeRows.length)} />
          <MiniMetric label="Total amount" value={amount(upcomingChequeRows.reduce((sum, row) => sum + row.amount, 0))} />
          <MiniMetric label="Window" value="3 days" />
        </div>
        <DashboardDataTable
          rows={upcomingChequeRows}
          minWidthClassName="min-w-[1040px]"
          defaultSort={{ columnId: 'chequeDate', direction: 'asc' }}
          initialRowCount={20}
          rowKey={row => row.chequeInfoId}
          emptyMessage="No Pending, On Hold or Swap cheques are dated within the next 3 days."
          columns={[
            { id: 'customer', header: 'Customer', sortValue: row => row.customerName, render: row => <p className="font-semibold text-slate-900">{row.customerName || '—'}</p> },
            { id: 'chequeNumber', header: 'Cheque no.', sortValue: row => row.chequeNumber, render: row => row.chequeNumber || '—' },
            { id: 'amount', header: 'Amount', align: 'right', sortValue: row => row.amount, render: row => <span className="font-semibold">{amount(row.amount)}</span> },
            { id: 'chequeDate', header: 'Cheque date', sortValue: row => row.chequeDate, render: row => displayDate(row.chequeDate) },
            { id: 'bank', header: 'Bank', sortValue: row => row.bankName, render: row => row.bankName || '—' },
            { id: 'collector', header: 'Collector', sortValue: row => row.collectorName, render: row => row.collectorName || '—' },
            { id: 'status', header: 'Current status', sortValue: row => row.statusName, render: row => <ChequeStatusBadge status={row.statusName} /> },
            { id: 'daysRemaining', header: 'Days remaining', align: 'right', sortValue: row => row.daysRemaining, render: row => row.daysRemaining === 0 ? 'Today' : row.daysRemaining === 1 ? 'Tomorrow' : `${row.daysRemaining ?? '—'} days` },
          ]}
        />
      </Section>

      <Section
        title="Cheque Status Analysis"
        detail="Current cheque-module position grouped by present status"
        href="/cheques"
        action={<DashboardExcelButton
          disabled={!visibleChequeRows.length}
          onExport={() => exportCheques(visibleChequeRows, 'Cheque Status Analysis', activeChequeStatus)}
        />}
      >
        <AnalysisTabs
          rows={financeAnalysis.data?.chequeStatuses ?? []}
          active={activeChequeStatus}
          onSelect={setActiveChequeStatus}
        />
        <DashboardDataTable
          rows={visibleChequeRows}
          minWidthClassName="min-w-[1040px]"
          defaultSort={{ columnId: 'chequeDate', direction: 'desc' }}
          initialRowCount={20}
          expansionKey={activeChequeStatus}
          rowKey={row => row.chequeInfoId}
          columns={[
            { id: 'customer', header: 'Customer', sortValue: row => row.customerName, render: row => <p className="font-semibold text-slate-900">{row.customerName || '—'}</p> },
            { id: 'chequeNumber', header: 'Cheque no.', sortValue: row => row.chequeNumber, render: row => row.chequeNumber || '—' },
            { id: 'amount', header: 'Amount', align: 'right', sortValue: row => row.amount, render: row => amount(row.amount) },
            { id: 'chequeDate', header: 'Cheque date', sortValue: row => row.chequeDate, render: row => displayDate(row.chequeDate) },
            { id: 'bank', header: 'Bank', sortValue: row => row.bankName, render: row => row.bankName || '—' },
            { id: 'collector', header: 'Collector', sortValue: row => row.collectorName, render: row => row.collectorName || '—' },
            { id: 'status', header: 'Status', align: 'right', sortValue: row => row.statusName, render: row => <ChequeStatusBadge status={row.statusName} /> },
          ]}
        />
      </Section>

      <Section
        title="Tax & AIT Company Analysis"
        detail={`Tax year ${taxYearLabel || 'loading'} · 1 July to 30 June · current and previous years are retained because submission may continue for 6 months`}
        href="/reports/tax-ait-summary"
        action={<div className="flex flex-wrap items-center justify-end gap-2">
          <label className="sr-only" htmlFor="dashboard-tax-year">Tax year</label>
          <select
            id="dashboard-tax-year"
            value={taxYearLabel}
            onChange={event => {
              setActiveTaxYear(event.target.value)
              setActiveTaxStatus('All')
            }}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700"
          >
            {taxYears.map(year => <option key={year.label} value={year.label}>
              {year.label}{year.isCurrent ? ' · Current' : ' · Previous'}
            </option>)}
          </select>
          <DashboardExcelButton
            disabled={!visibleTaxAitCompanies.length}
            onExport={() => exportTaxAitCompanies(visibleTaxAitCompanies, taxYearLabel, activeTaxStatus)}
          />
        </div>}
      >
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          <MiniMetric label="Taxable companies" value={String(taxAitCompanies.length)} />
          <MiniMetric label="Total payable" value={amount(taxAitTotals.payable)} />
          <MiniMetric label="Total paid" value={amount(taxAitTotals.paid)} />
          <MiniMetric label="Pending" value={amount(taxAitTotals.pending)} danger={taxAitTotals.pending > 0} />
          <MiniMetric label="Paid / Pending" value={`${taxAitTotals.paidCompanies} / ${taxAitTotals.pendingCompanies}`} />
        </div>
        <AnalysisTabs
          rows={[
            { name: 'Paid', count: taxAitTotals.paidCompanies, amount: taxAitCompanies.filter(row => row.status === 'Paid').reduce((sum, row) => sum + row.totalPaid, 0), quantity: 0 },
            { name: 'Pending', count: taxAitTotals.pendingCompanies, amount: taxAitTotals.pending, quantity: 0 },
          ]}
          active={activeTaxStatus}
          onSelect={setActiveTaxStatus}
          showAmount={false}
        />
        <DashboardDataTable
          rows={visibleTaxAitCompanies}
          minWidthClassName="min-w-[1480px]"
          defaultSort={{ columnId: 'pending', direction: 'desc' }}
          initialRowCount={20}
          expansionKey={`${taxYearLabel}-${activeTaxStatus}`}
          rowKey={row => row.customerId}
          columns={[
            { id: 'company', header: 'Company', sortValue: row => row.companyName, render: row => <div><p className="font-semibold text-slate-900">{row.companyName || '—'}</p>{row.companyAddress && <p className="mt-0.5 max-w-64 truncate text-xs text-slate-400">{row.companyAddress}</p>}</div> },
            { id: 'invoices', header: 'Invoices', align: 'right', sortValue: row => row.invoiceCount, render: row => row.invoiceCount },
            { id: 'taxableBase', header: 'Taxable base', align: 'right', sortValue: row => row.taxableBase, render: row => amount(row.taxableBase) },
            { id: 'vatPayable', header: 'VAT payable', align: 'right', sortValue: row => row.vatPayable, render: row => amount(row.vatPayable) },
            { id: 'aitPayable', header: 'AIT payable', align: 'right', sortValue: row => row.aitPayable, render: row => amount(row.aitPayable) },
            { id: 'vatPaid', header: 'VAT paid', align: 'right', sortValue: row => row.vatPaid, render: row => amount(row.vatPaid) },
            { id: 'aitPaid', header: 'AIT paid', align: 'right', sortValue: row => row.aitPaid, render: row => amount(row.aitPaid) },
            { id: 'totalPayable', header: 'Total payable', align: 'right', sortValue: row => row.totalPayable, render: row => amount(row.totalPayable) },
            { id: 'totalPaid', header: 'Total paid', align: 'right', sortValue: row => row.totalPaid, render: row => amount(row.totalPaid) },
            { id: 'pending', header: 'Pending', align: 'right', sortValue: row => row.pendingAmount, render: row => <span className={row.pendingAmount > 0 ? 'font-semibold text-red-700' : 'text-slate-500'}>{amount(row.pendingAmount)}</span> },
            { id: 'status', header: 'Status', align: 'right', sortValue: row => row.status, render: row => <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{row.status}</span> },
          ]}
        />
      </Section>

      {financeAnalysis.isLoading && <p className="py-8 text-center text-sm text-slate-500">Loading finance analysis…</p>}
      {financeAnalysis.isError && <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">Finance-analysis API is unavailable. Deploy the included backend files and refresh.</p>}
    </>}

    {activeTab === 'attention' && <><Section title="Management Action Center" detail="Consolidated risks requiring Super Admin follow-up">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Attention label="Critical customer due" value={amount(creditRisk.data?.daysOver90 ?? 0)} href="/reports/customer-credit" />
        <Attention label="Orders still pending" value={String(attentionOperations.data?.pendingOrders ?? pendingRows.length)} href="/reports/pending-cancel" />
        <Attention label="Overdue cheques" value={String(attentionOperations.data?.overdueCheques ?? 0)} href="/cheques" />
        <Attention label="Delayed LC" value={String(attentionOperations.data?.delayedLcCount ?? 0)} href="/lc/status" />
        <Attention label="Missing stock prices" value={String(stockSummary.data?.missingPriceCount ?? 0)} href="/reports/purchase-price-history" />
        <Attention label="Negative stock" value={String(stockSummary.data?.negativeStockCount ?? 0)} href="/reports/current-stock" />
        <Attention label="Pending allowances" value={String(attentionOperations.data?.allowance.pending ?? 0)} href="/reports/allowance-checking" />
        <Attention label="Tax & AIT pending" value={amount(taxAitPending)} href="/reports/tax-ait-summary" />
      </div>
      {attentionOperations.isError && <p className="mt-4 text-center text-sm text-red-600">Operations API is unavailable. Deploy the cumulative backend package and refresh.</p>}
    </Section>
    <DeliveryAuditAttention onOpenMaps={openDeliveryAudit} />
    <InvoiceChallanPairReport /></>}

    {activeTab === 'maps' && <DashboardMapsTab initialSection={searchParams.get('mapSection') === 'audit' ? 'audit' : 'customers'} />}

    {activeTab === 'sales-recovery' && <Section title="Marketing Performance — Sales vs Recovery" detail={`${marketingStartDate} to ${marketingEndDate}${marketingCredit.isFetching ? ' · Loading…' : ''}`} href="/reports/monthly-credit" action={<div className="flex items-center gap-2"><CompactDateRange startDate={marketingStartDate} endDate={marketingEndDate} onApply={(start, end) => { setSelectedMarketingName(null); setMarketingStartDate(start); setMarketingEndDate(end) }} /><DashboardExcelButton disabled={!performance.length} onExport={() => exportMarketingPerformance(performance, marketingStartDate, marketingEndDate)} /></div>}>
        <DashboardDataTable
          rows={visiblePerformance}
          minWidthClassName="min-w-[860px]"
          defaultSort={{ columnId: 'recoveryRate', direction: 'desc' }}
          rowKey={row => row.name}
          columns={[
            { id: 'marketing', header: 'Rank / Marketing', sortValue: row => row.name, render: (row, index) => <button type="button" onClick={() => setSelectedMarketingName(row.name)} className="group inline-flex items-center font-medium text-slate-900 hover:text-blue-700" title={`View ${row.name}'s customer details`}><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs group-hover:bg-blue-100">{index + 1}</span><span className="border-b border-dashed border-slate-300 group-hover:border-blue-500">{row.name}</span></button> },
            { id: 'customers', header: 'Customers', align: 'right', sortValue: row => row.customers, render: row => row.customers },
            { id: 'sales', header: 'Sales', align: 'right', sortValue: row => row.sales, render: row => amount(row.sales) },
            { id: 'recovery', header: 'Recovery', align: 'right', sortValue: row => row.recovery, render: row => <span className="font-semibold text-emerald-700">{amount(row.recovery)}</span> },
            { id: 'outstanding', header: 'Outstanding', align: 'right', sortValue: row => row.outstanding, render: row => <span className="text-red-700">{amount(row.outstanding)}</span> },
            { id: 'recoveryRate', header: 'Recovery rate', align: 'right', sortValue: row => row.rate, render: row => <div className="ml-auto flex min-w-52 items-center gap-2"><div className="h-2 flex-1 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${row.rate >= 80 ? 'bg-emerald-500' : row.rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(row.rate, 100)}%` }} /></div><span className="w-14 text-right font-semibold">{row.rate.toFixed(1)}%</span></div> },
          ]}
        />
        {performance.length > 11 && <div className="mt-3 flex justify-center border-t border-slate-100 pt-3"><button type="button" onClick={() => setShowAllMarketing(value => !value)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">{showAllMarketing ? 'Show top 11' : `Show all (${performance.length})`}</button></div>}
      </Section>}

    {activeTab === 'sales-recovery' && <Section
      title="Customers Covering 80% of Credit Universe"
      detail="Positive closing balances ranked highest first until cumulative outstanding reaches at least 80%"
      action={<DashboardExcelButton
        disabled={!creditUniverseRows.length}
        onExport={() => exportCreditUniverse(creditUniverseRows, marketingStartDate, marketingEndDate)}
      />}
    >
      <DashboardDataTable
        rows={creditUniverseRows}
        minWidthClassName="min-w-[1180px]"
        defaultSort={{ columnId: 'closing', direction: 'desc' }}
        initialRowCount={20}
        rowKey={(row, index) => `${row.marketingName}-${row.customerName}-${index}`}
        columns={[
          { id: 'customer', header: 'Customer', sortValue: row => row.customerName, render: row => <span className="font-semibold text-slate-900">{row.customerName}</span> },
          { id: 'marketing', header: 'Marketing', sortValue: row => row.marketingName, render: row => row.marketingName },
          { id: 'opening', header: 'Opening', align: 'right', sortValue: row => row.opening, render: row => amount(row.opening) },
          { id: 'sales', header: 'Sales', align: 'right', sortValue: row => row.sales, render: row => amount(row.sales) },
          { id: 'recovery', header: 'Recovery', align: 'right', sortValue: row => row.payment, render: row => <span className="text-emerald-700">{amount(row.payment)}</span> },
          { id: 'closing', header: 'Closing balance', align: 'right', sortValue: row => row.closing, render: row => <span className="font-semibold text-red-700">{amount(row.closing)}</span> },
          { id: 'share', header: '% of total credit', align: 'right', sortValue: row => row.creditShare, render: row => `${row.creditShare.toFixed(2)}%` },
          { id: 'cumulative', header: 'Cumulative %', align: 'right', sortValue: row => row.cumulativeShare, render: row => <span className="font-semibold">{row.cumulativeShare.toFixed(2)}%</span> },
        ]}
      />
    </Section>}

    {activeTab === 'charts' && <DashboardChartsTab
      enabled
      creditRisk={creditRisk.data}
      stockMovement={stockMovement.data}
    />}

    {activeTab === 'order-operations' && <Section title="Operational Attention" detail="Orders requiring management follow-up" href="/reports/pending-cancel"><div className="space-y-3">{pendingRows.slice(0, 7).map(x => <Link key={x.soSystemId ?? x.soSystemNo} to="/reports/pending-cancel" className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 hover:bg-amber-50"><div className="min-w-0"><p className="truncate font-semibold">{x.customerName || 'Unknown customer'}</p><p className="truncate text-xs text-slate-500">{x.soSystemNo || `Order #${x.soSystemId}`} · {x.soSystemPending || x.soDecesionPending || 'Pending'}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${(x.daysPending ?? 0) > 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{x.daysPending ?? 0} days</span></Link>)}</div></Section>}

    {drilldownKind && <OverviewDrilldownModal
      kind={drilldownKind}
      startDate={overviewRange.start}
      endDate={overviewRange.end}
      creditRows={overviewCreditRows}
      purchaseRows={purchaseDetails.data?.suppliers ?? []}
      pendingOrderRows={pendingOrderRows}
      stockRows={stockSummary.data?.products ?? []}
      isLoading={drilldownKind === 'purchases'
        ? purchaseDetails.isLoading
        : drilldownKind === 'pending-orders'
          ? overviewOperations.isLoading
          : drilldownKind === 'stock-value'
            ? stockSummary.isLoading
            : overviewCredit.isLoading}
      isError={drilldownKind === 'purchases'
        ? purchaseDetails.isError
        : drilldownKind === 'pending-orders'
          ? overviewOperations.isError
          : drilldownKind === 'stock-value'
            ? stockSummary.isError
            : overviewCredit.isError}
      onClose={() => setDrilldownKind(null)}
    />}

    {creditAgingBucket && <CreditAgingDrilldownModal
      bucket={creditAgingBucket}
      asOfDate={creditPeriod.end}
      customers={creditRisk.data?.topCustomers ?? []}
      accountingRows={creditRows}
      isLoading={creditRisk.isLoading || creditBehaviour.isLoading}
      isError={creditRisk.isError || creditBehaviour.isError}
      onClose={() => setCreditAgingBucket(null)}
    />}

    {activeTab === 'sales-recovery' && selectedMarketingName && <MarketingPerformanceDrilldownModal
      marketingName={selectedMarketingName}
      startDate={marketingStartDate}
      endDate={marketingEndDate}
      rows={selectedMarketingCustomers}
      isLoading={marketingCredit.isLoading}
      isError={marketingCredit.isError}
      onClose={() => setSelectedMarketingName(null)}
    />}
  </div>
}

function Info({ icon: Icon, text }: { icon: typeof TrendingUp; text: string }) {
  return <div className="flex items-center gap-3"><div className="rounded-xl bg-slate-100 p-3 text-slate-700"><Icon size={20} /></div><p className="font-semibold text-slate-900">{text}</p></div>
}

function MiniMetric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return <div className={`rounded-xl border p-3 ${danger ? 'border-red-100 bg-red-50/40' : 'border-slate-100 bg-slate-50/50'}`}><p className="text-xs font-medium text-slate-500">{label}</p><p className={`mt-1 text-lg font-bold ${danger ? 'text-red-700' : 'text-slate-950'}`}>{value}</p></div>
}

function AnalysisTabs({
  rows,
  active,
  onSelect,
  showAmount = true,
}: {
  rows: NamedAmount[]
  active: string
  onSelect: (value: string) => void
  showAmount?: boolean
}) {
  const tabs: NamedAmount[] = [
    {
      name: 'All',
      count: rows.reduce((sum, row) => sum + row.count, 0),
      amount: rows.reduce((sum, row) => sum + row.amount, 0),
      quantity: 0,
    },
    ...rows,
  ]

  return <div className="mb-4 overflow-x-auto border-b border-slate-200">
    <div className="flex min-w-max gap-1" role="tablist">
      {tabs.map(tab => {
        const selected = active === tab.name
        return <button
          key={tab.name}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => onSelect(tab.name)}
          className={`border-b-2 px-3 py-2.5 text-left text-sm font-semibold transition-colors ${selected ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'}`}
        >
          <span>{tab.name}</span>
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${selected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{tab.count}</span>
          {showAmount && <span className="ml-2 text-xs font-medium text-slate-400">{amount(tab.amount)}</span>}
        </button>
      })}
    </div>
  </div>
}

function ChequeStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const tone = normalized.includes('clear') || normalized.includes('paid')
    ? 'bg-emerald-100 text-emerald-700'
    : normalized.includes('pending')
      ? 'bg-amber-100 text-amber-700'
      : normalized.includes('hold') || normalized.includes('swap')
        ? 'bg-blue-100 text-blue-700'
        : normalized.includes('bounce') || normalized.includes('return') || normalized.includes('expire')
          ? 'bg-red-100 text-red-700'
          : 'bg-slate-100 text-slate-700'

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tone}`}>{status || 'Unknown'}</span>
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
