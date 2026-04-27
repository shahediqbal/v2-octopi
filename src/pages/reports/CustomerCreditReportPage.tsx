import { useCallback, useMemo, useState } from 'react'
import {
  AlertCircle,
  CreditCard,
  Database,
  FileSpreadsheet,
  Loader2,
  Printer,
  RefreshCw,
  Search,
} from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import {
  useCustomerCreditHistory,
  useCustomerCreditSummary,
} from '@/hooks/useCustomerCreditReport'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { CustomerCreditFilters } from '@/types/customerCreditReport'

/* ─── Helpers ─── */
function todayStr() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}
function firstDayOfMonth() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), '01'].join('-')
}
function fmtDate(v: string | null) {
  if (!v) return '-'
  const d = new Date(v)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateShort(v: string) {
  const d = new Date(v)
  if (isNaN(d.getTime())) return v
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
function fmtAmount(v: number | null) {
  if (v == null) return '-'
  return v.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/* ─── Excel column definitions ─── */
const HISTORY_EXCEL_COLUMNS = [
  { key: 'serial_no', header: 'Serial No', format: 'integer' as const },
  { key: 'date', header: 'Date', format: 'date' as const },
  { key: 'job_type', header: 'Transaction Type' },
  { key: 'transaction_number', header: 'Transaction No' },
  { key: 'payable_amount', header: 'Sales Value', format: 'number' as const },
  { key: 'paid_amount', header: 'Payment Received', format: 'number' as const },
  { key: 'returned_amount', header: 'Adjustment', format: 'number' as const },
  { key: 'linq_calculated_due_amount', header: 'Current Balance', format: 'number' as const },
] as const

const SUMMARY_EXCEL_COLUMNS = [
  { key: 'customerId', header: 'Customer ID', format: 'integer' as const },
  { key: 'customerName', header: 'Customer Name' },
  { key: 'customerAddress', header: 'Address', width: 28 },
  { key: 'marketingName', header: 'Marketing' },
  { key: 'openingCredit', header: 'Opening Credit', format: 'number' as const },
  { key: 'totalSale', header: 'Total Sale', format: 'number' as const },
  { key: 'totalPaid', header: 'Total Paid', format: 'number' as const },
  { key: 'totalAdjustment', header: 'Total Adjustment', format: 'number' as const },
  { key: 'totalDue', header: 'Total Due', format: 'number' as const },
] as const

type TabKey = 'history' | 'summary'

export function CustomerCreditReportPage() {
  const [fromDate, setFromDate] = useState(firstDayOfMonth)
  const [toDate, setToDate] = useState(todayStr)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [customerLabel, setCustomerLabel] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('history')
  const [historySearch, setHistorySearch] = useState('')
  const [summarySearch, setSummarySearch] = useState('')
  const [loadRequested, setLoadRequested] = useState(false)

  const filters: CustomerCreditFilters = useMemo(
    () => ({ startDate: fromDate, endDate: toDate, customerId: customerId ?? 0 }),
    [fromDate, toDate, customerId],
  )

  const dateError = useMemo(() => {
    if (!fromDate || !toDate) return 'Both dates are required.'
    if (fromDate > toDate) return 'From date must be before To date.'
    return null
  }, [fromDate, toDate])

  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
    error: historyErr,
    refetch: refetchHistory,
  } = useCustomerCreditHistory(filters, loadRequested)

  const {
    data: summaryData = [],
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErr,
    refetch: refetchSummary,
  } = useCustomerCreditSummary(filters, loadRequested)

  const transactions = historyData?.transctionInfo ?? []
  const customerInfo = historyData?.customerInfo ?? null

  const filteredTransactions = useMemo(() => {
    if (!historySearch.trim()) return transactions
    const q = historySearch.toLowerCase()
    return transactions.filter(
      (t) =>
        t.job_type?.toLowerCase().includes(q) ||
        t.transaction_number?.toLowerCase().includes(q),
    )
  }, [transactions, historySearch])

  const filteredSummary = useMemo(() => {
    if (!summarySearch.trim()) return summaryData
    const q = summarySearch.toLowerCase()
    return summaryData.filter(
      (s) =>
        s.customerName?.toLowerCase().includes(q) ||
        s.marketingName?.toLowerCase().includes(q),
    )
  }, [summaryData, summarySearch])

  const handleLoad = useCallback(() => {
    if (dateError) return
    if (loadRequested) {
      void refetchHistory()
      void refetchSummary()
    } else {
      setLoadRequested(true)
    }
  }, [dateError, loadRequested, refetchHistory, refetchSummary])

  const handleExportHistory = useCallback(async () => {
    const rows = filteredTransactions.map((t) => ({ ...t }))
    await exportExcelOnDemand({
      fileName: `Customer_Credit_History_${fromDate}_to_${toDate}`,
      title: 'Customer Credit Transaction History',
      subtitle: customerInfo
        ? `${customerInfo.customerName} | ${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`
        : `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
      sheetName: 'Credit History',
      columns: [...HISTORY_EXCEL_COLUMNS],
      data: rows as unknown as Record<string, unknown>[],
      filters: [
        ['Date Range', `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`],
        ['Customer', customerLabel || 'All'],
      ],
      summaryCards: [['Total Transactions', filteredTransactions.length]],
    })
  }, [filteredTransactions, fromDate, toDate, customerInfo, customerLabel])

  const handleExportSummary = useCallback(async () => {
    await exportExcelOnDemand({
      fileName: `Customer_Credit_Summary_${fromDate}_to_${toDate}`,
      title: 'Customer Credit Sale Summary',
      subtitle: `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
      sheetName: 'Credit Summary',
      columns: [...SUMMARY_EXCEL_COLUMNS],
      data: filteredSummary as unknown as Record<string, unknown>[],
      filters: [
        ['Date Range', `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`],
        ['Customer', customerLabel || 'All'],
      ],
      summaryCards: [
        ['Total Customers', filteredSummary.length],
        [
          'Total Due',
          filteredSummary.reduce((s, r) => s + (r.totalDue ?? 0), 0).toLocaleString('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        ],
      ],
    })
  }, [filteredSummary, fromDate, toDate, customerLabel])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const isLoading = historyLoading || summaryLoading
  const isError = historyError || summaryError
  const errMsg = (historyErr as Error)?.message || (summaryErr as Error)?.message || 'Failed to load data.'

  return (
    <div className="space-y-6">
      {/* ── Print-only area ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
        }
        .print-only { display: none; }
      `}</style>

      {/* ── Header ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm no-print">
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
          <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
            <CreditCard size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Customer Credit Report</h2>
            <p className="mt-1 text-sm text-gray-500">
              Transaction history and credit summary per customer.
            </p>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setLoadRequested(false) }}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setLoadRequested(false) }}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className="text-xs font-medium text-gray-500">Customer</label>
            <PaginatedCombobox
              type="customer"
              value={customerId}
              onChange={(id, label) => {
                setCustomerId(id)
                setCustomerLabel(label ?? '')
                setLoadRequested(false)
              }}
              placeholder="All Customers"
            />
          </div>
          <button
            type="button"
            onClick={handleLoad}
            disabled={!!dateError}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Database size={15} />}
            {loadRequested ? 'Refresh' : 'Load Data'}
          </button>
          {loadRequested && (
            <button
              type="button"
              onClick={() => { setLoadRequested(false); setFromDate(firstDayOfMonth()); setToDate(todayStr()); setCustomerId(null); setCustomerLabel('') }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw size={15} /> Reset
            </button>
          )}
        </div>
        {dateError && <p className="mt-2 text-xs text-red-600">{dateError}</p>}
      </div>

      {/* ── Tabs ── */}
      {loadRequested && (
        <div className="no-print">
          <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
            {(['history', 'summary'] as TabKey[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'history' ? 'Transaction History' : 'Credit Summary'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {loadRequested && isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 no-print">
          <AlertCircle size={16} />
          {errMsg}
        </div>
      )}

      {/* ── Loading ── */}
      {loadRequested && isLoading && (
        <div className="flex items-center justify-center py-16 no-print">
          <Loader2 size={24} className="animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading report…</span>
        </div>
      )}

      {/* ════════════════ HISTORY TAB ════════════════ */}
      {loadRequested && !isLoading && !isError && activeTab === 'history' && (
        <div className="space-y-4">
          {/* Customer info card */}
          {customerInfo && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm no-print">
              <p className="text-sm font-semibold text-gray-900">{customerInfo.customerName}</p>
              <p className="text-xs text-gray-500">{customerInfo.customerAddress}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 no-print">
            <StatCard label="Total Transactions" value={String(transactions.length)} />
            <StatCard label="Filtered" value={String(filteredTransactions.length)} />
            <StatCard
              label="Total Sales"
              value={fmtAmount(transactions.reduce((s, t) => s + (t.payable_amount ?? 0), 0))}
            />
            <StatCard
              label="Total Paid"
              value={fmtAmount(transactions.reduce((s, t) => s + (t.paid_amount ?? 0), 0))}
            />
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions…"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <Printer size={15} /> Print
              </button>
              <button
                type="button"
                onClick={() => { void handleExportHistory() }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <FileSpreadsheet size={15} /> Export Excel
              </button>
            </div>
          </div>

          {/* Print header */}
          <div className="print-only mb-4">
            <h1 className="text-xl font-bold">Customer Credit Transaction History</h1>
            {customerInfo && <p className="text-sm">{customerInfo.customerName} — {customerInfo.customerAddress}</p>}
            <p className="text-sm text-gray-500">{fmtDateShort(fromDate)} to {fmtDateShort(toDate)}</p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            {filteredTransactions.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400 no-print">No transactions found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Transaction Type</th>
                    <th className="px-4 py-3">Transaction No</th>
                    <th className="px-4 py-3 text-right">Sales Value</th>
                    <th className="px-4 py-3 text-right">Payment Received</th>
                    <th className="px-4 py-3 text-right">Adjustment</th>
                    <th className="px-4 py-3 text-right">Current Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((t, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-500">{t.serial_no ?? i + 1}</td>
                      <td className="px-4 py-2.5 text-gray-600">{fmtDate(t.date)}</td>
                      <td className="px-4 py-2.5 text-gray-900">{t.job_type ?? '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{t.transaction_number ?? '-'}</td>
                      <td className="px-4 py-2.5 text-right text-gray-900">{fmtAmount(t.payable_amount)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-900">{fmtAmount(t.paid_amount)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{fmtAmount(t.returned_amount)}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                        {fmtAmount(t.linq_calculated_due_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ SUMMARY TAB ════════════════ */}
      {loadRequested && !isLoading && !isError && activeTab === 'summary' && (
        <div className="space-y-4 no-print">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total Customers" value={String(summaryData.length)} />
            <StatCard label="Filtered" value={String(filteredSummary.length)} />
            <StatCard
              label="Total Sale"
              value={fmtAmount(filteredSummary.reduce((s, r) => s + (r.totalSale ?? 0), 0))}
            />
            <StatCard
              label="Total Due"
              value={fmtAmount(filteredSummary.reduce((s, r) => s + (r.totalDue ?? 0), 0))}
              accent
            />
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers…"
                value={summarySearch}
                onChange={(e) => setSummarySearch(e.target.value)}
                className="rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => { void handleExportSummary() }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <FileSpreadsheet size={15} /> Export Excel
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            {filteredSummary.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">No summary data found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Customer Name</th>
                    <th className="px-4 py-3">Address</th>
                    <th className="px-4 py-3">Marketing</th>
                    <th className="px-4 py-3 text-right">Opening Credit</th>
                    <th className="px-4 py-3 text-right">Total Sale</th>
                    <th className="px-4 py-3 text-right">Total Paid</th>
                    <th className="px-4 py-3 text-right">Adjustment</th>
                    <th className="px-4 py-3 text-right">Total Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSummary.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-500">{s.customerId ?? '-'}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{s.customerName ?? '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{s.customerAddress ?? '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{s.marketingName ?? '-'}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{fmtAmount(s.openingCredit)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-900">{fmtAmount(s.totalSale)}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-700">{fmtAmount(s.totalPaid)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{fmtAmount(s.totalAdjustment)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-red-600">{fmtAmount(s.totalDue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loadRequested && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center no-print">
          <CreditCard size={32} className="text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">Set filters and click Load Data</p>
          <p className="text-xs text-gray-400">Supports all customers or a specific customer</p>
        </div>
      )}
    </div>
  )
}

/* ─── Shared helpers ─── */
const inputCls =
  'block rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none'

function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
