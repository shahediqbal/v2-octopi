import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, Database, FileSpreadsheet, Loader2, Receipt, RefreshCw, Search } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { useTaxAitDetails } from '@/hooks/useTaxAitDetails'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { TaxAitDetailFilters } from '@/types/taxAitDetail'

function todayStr() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}
function firstDayOfMonth() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), '01'].join('-')
}
function fmtDate(value: string | null) {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateShort(value: string) {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
function fmtCurrency(value: number | null) {
  if (value == null) return '-'
  return value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtPct(value: number | null) {
  if (value == null) return '-'
  return `${value}%`
}

const EXCEL_COLUMNS = [
  { key: 'systemNo', header: 'Invoice No' },
  { key: 'invoiceDate', header: 'Date', format: 'date' as const },
  { key: 'customerName', header: 'Customer Name' },
  { key: 'customerAddress', header: 'Address', width: 28 },
  { key: 'monthName', header: 'Month' },
  { key: 'yearMonth', header: 'Period' },
  { key: 'taxableBase', header: 'Taxable Base', format: 'number' as const },
  { key: 'vatRatePct', header: 'VAT Rate %', format: 'number' as const },
  { key: 'aitRatePct', header: 'AIT Rate %', format: 'number' as const },
  { key: 'vatAmount', header: 'VAT Amount', format: 'number' as const },
  { key: 'aitAmount', header: 'AIT Amount', format: 'number' as const },
  { key: 'runningTaxableBaseByCustomer', header: 'Running Total', format: 'number' as const },
] as const

export function TaxAitDetailsReportPage() {
  const [fromDate, setFromDate] = useState(firstDayOfMonth)
  const [toDate, setToDate] = useState(todayStr)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [customerLabel, setCustomerLabel] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadRequested, setLoadRequested] = useState(false)

  const filters: TaxAitDetailFilters = useMemo(
    () => ({ startDate: fromDate, endDate: toDate, customerId: customerId ?? 0 }),
    [fromDate, toDate, customerId],
  )

  const {
    data: reportData = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTaxAitDetails(filters, loadRequested)

  const dateError = useMemo(() => {
    if (!fromDate || !toDate) return 'Both dates are required'
    if (new Date(fromDate) > new Date(toDate)) return "'From' date cannot be after 'To' date"
    return ''
  }, [fromDate, toDate])

  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return reportData
    return reportData.filter(
      (item) =>
        item.systemNo?.toLowerCase().includes(q) ||
        item.customerName?.toLowerCase().includes(q) ||
        item.monthName?.toLowerCase().includes(q),
    )
  }, [reportData, searchTerm])

  const totalTaxableBase = useMemo(() => reportData.reduce((s, i) => s + (i.taxableBase ?? 0), 0), [reportData])
  const totalVat = useMemo(() => reportData.reduce((s, i) => s + (i.vatAmount ?? 0), 0), [reportData])
  const totalAit = useMemo(() => reportData.reduce((s, i) => s + (i.aitAmount ?? 0), 0), [reportData])

  const handleLoad = useCallback(() => {
    if (dateError) return
    setLoadRequested(true)
    void refetch()
  }, [dateError, refetch])

  const handleExport = useCallback(async () => {
    if (filteredData.length === 0) return
    await exportExcelOnDemand({
      fileName: `Tax_AIT_Details_${fromDate}_to_${toDate}`,
      title: 'Tax AIT Details Report',
      subtitle: `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
      sheetName: 'Tax AIT Details',
      columns: [...EXCEL_COLUMNS],
      data: filteredData as unknown as Record<string, unknown>[],
      filters: [
        ['Date Range', `${fmtDateShort(fromDate)} – ${fmtDateShort(toDate)}`],
        ['Customer', customerLabel || 'All'],
      ],
      summaryCards: [
        ['Total Invoices', reportData.length],
        ['Total Taxable Base', fmtCurrency(totalTaxableBase)],
        ['Total VAT', fmtCurrency(totalVat)],
        ['Total AIT', fmtCurrency(totalAit)],
      ],
    })
  }, [filteredData, fromDate, toDate, customerLabel, reportData.length, totalTaxableBase, totalVat, totalAit])

  const noData = reportData.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax AIT Details Report</h1>
        <p className="mt-1 text-sm text-gray-500">View invoice-level tax (VAT &amp; AIT) details by customer and period.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 px-4 py-4">
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">From</label>
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setLoadRequested(false) }} className={inputCls} />
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">To</label>
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setLoadRequested(false) }} className={inputCls} />
          </div>
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Customer</label>
            <PaginatedCombobox type="customer" value={customerId} onValueChange={(v, l) => { setCustomerId(v); setCustomerLabel(l ?? null); setLoadRequested(false) }} placeholder="All Customers" />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Invoice, customer, month…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputCls} pl-8`} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {noData ? (
              <button onClick={handleLoad} disabled={isLoading || !!dateError} className="action-report inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? 'Loading…' : 'Load Data'}
              </button>
            ) : (
              <>
                <button onClick={handleExport} disabled={filteredData.length === 0} className="action-report inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
                  <FileSpreadsheet size={14} />Excel
                </button>
                <button onClick={handleLoad} disabled={isLoading || !!dateError} className="action-report inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />Refresh
                </button>
              </>
            )}
          </div>
        </div>

        {dateError && <div className="mx-4 my-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"><AlertCircle size={14} /> {dateError}</div>}
        {isLoading && <div className="h-1 w-full overflow-hidden bg-gray-100"><div className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] rounded bg-gray-400" /></div>}
        {isError && <div className="mx-4 my-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"><AlertCircle size={14} /> {(error as Error)?.message ?? 'Failed to load data'}</div>}

        {!isLoading && noData && !loadRequested && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"><Receipt size={28} /></div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Loaded</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">Select a date range and click Load Data.</p>
          </div>
        )}
        {!isLoading && loadRequested && noData && !isError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"><Database size={28} /></div>
            <h2 className="text-lg font-semibold text-gray-900">No Records Found</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">No tax AIT records match the selected filters.</p>
          </div>
        )}

        {!noData && (
          <>
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Total Invoices" value={String(reportData.length)} />
                <StatCard label="Total Taxable Base" value={fmtCurrency(totalTaxableBase)} />
                <StatCard label="Total VAT" value={fmtCurrency(totalVat)} />
                <StatCard label="Total AIT" value={fmtCurrency(totalAit)} accent />
              </div>
            </div>

            <div className="max-h-[calc(100vh-400px)] overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Invoice No</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Month</th>
                    <th className="px-4 py-3 font-semibold text-right">Taxable Base</th>
                    <th className="px-4 py-3 font-semibold text-right">VAT%</th>
                    <th className="px-4 py-3 font-semibold text-right">AIT%</th>
                    <th className="px-4 py-3 font-semibold text-right">VAT Amount</th>
                    <th className="px-4 py-3 font-semibold text-right">AIT Amount</th>
                    <th className="px-4 py-3 font-semibold text-right">Running Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.length === 0 ? (
                    <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">No records match your search</td></tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900">
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{item.systemNo || '-'}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{fmtDate(item.invoiceDate)}</td>
                        <td className="px-4 py-2.5 text-gray-700">
                          <div className="font-medium">{item.customerName || '-'}</div>
                          {item.customerAddress && <div className="text-xs text-gray-500">{item.customerAddress}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          <div>{item.monthName || '-'}</div>
                          {item.yearMonth && <div className="text-xs text-gray-400">{item.yearMonth}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtCurrency(item.taxableBase)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{fmtPct(item.vatRatePct)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{fmtPct(item.aitRatePct)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-amber-700">{fmtCurrency(item.vatAmount)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-amber-700">{fmtCurrency(item.aitAmount)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-gray-900">{fmtCurrency(item.runningTaxableBaseByCustomer)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="border-t border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                  <tr>
                    <td colSpan={4} className="px-4 py-2">Totals</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtCurrency(totalTaxableBase)}</td>
                    <td colSpan={2} />
                    <td className="px-4 py-2 text-right tabular-nums">{fmtCurrency(totalVat)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtCurrency(totalAit)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
              <p className="text-xs text-gray-500">Showing {filteredData.length} of {reportData.length} invoices</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const inputCls = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'
function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-gray-800' : 'text-gray-700'}`}>{value}</p>
    </div>
  )
}
