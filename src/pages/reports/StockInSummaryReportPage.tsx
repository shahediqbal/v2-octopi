import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, Database, FileSpreadsheet, Loader2, PackagePlus, RefreshCw, Search } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { useStockInSummary } from '@/hooks/useStockInSummary'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { StockInSummaryFilters } from '@/types/stockInSummary'

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
function fmtMoney(value: number | null) {
  if (value == null) return '-'
  return value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const EXCEL_COLUMNS = [
  { key: 'siInvoiceNo', header: 'Invoice No' },
  { key: 'siInvoiceDate', header: 'Invoice Date', format: 'date' as const },
  { key: 'jobType', header: 'Job Type' },
  { key: 'lifecycleName', header: 'Status' },
  { key: 'sourceChannelName', header: 'Source Channel' },
  { key: 'destinationChannelName', header: 'Destination Channel' },
  { key: 'partyName', header: 'Party Name' },
  { key: 'partyAddress', header: 'Party Address' },
  { key: 'sibFinalAmount', header: 'Final Amount', format: 'number' as const },
  { key: 'sibFinalConvertedBill', header: 'Converted Bill', format: 'number' as const },
  { key: 'sibCurrencyName', header: 'Currency' },
] as const

export function StockInSummaryReportPage() {
  const [fromDate, setFromDate] = useState(firstDayOfMonth)
  const [toDate, setToDate] = useState(todayStr)
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [supplierLabel, setSupplierLabel] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [customerLabel, setCustomerLabel] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadRequested, setLoadRequested] = useState(false)

  const filters: StockInSummaryFilters = useMemo(
    () => ({
      startDate: fromDate,
      endDate: toDate,
      statusId: 52,
      supplierId: supplierId ?? 0,
      customerId: customerId ?? 0,
    }),
    [fromDate, toDate, supplierId, customerId],
  )

  const {
    data: reportData = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useStockInSummary(filters, loadRequested)

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
        item.siInvoiceNo?.toLowerCase().includes(q) ||
        item.partyName?.toLowerCase().includes(q) ||
        item.jobType?.toLowerCase().includes(q) ||
        item.lifecycleName?.toLowerCase().includes(q) ||
        item.sourceChannelName?.toLowerCase().includes(q),
    )
  }, [reportData, searchTerm])

  const totalFinalAmount = useMemo(
    () => reportData.reduce((s, i) => s + (i.sibFinalAmount ?? 0), 0),
    [reportData],
  )
  const totalConvertedBill = useMemo(
    () => reportData.reduce((s, i) => s + (i.sibFinalConvertedBill ?? 0), 0),
    [reportData],
  )

  const handleLoad = useCallback(() => {
    if (dateError) return
    setLoadRequested(true)
    void refetch()
  }, [dateError, refetch])

  const handleExport = useCallback(async () => {
    if (filteredData.length === 0) return
    await exportExcelOnDemand({
      fileName: `StockIn_Summary_${fromDate}_to_${toDate}`,
      title: 'StockIn Summary Report',
      subtitle: `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
      sheetName: 'StockIn Summary',
      columns: [...EXCEL_COLUMNS],
      data: filteredData as unknown as Record<string, unknown>[],
      filters: [
        ['Date Range', `${fmtDateShort(fromDate)} – ${fmtDateShort(toDate)}`],
        ['Supplier', supplierLabel || 'All'],
        ['Customer', customerLabel || 'All'],
      ],
      summaryCards: [
        ['Total Records', reportData.length],
        ['Filtered', filteredData.length],
        ['Total Final Amount', fmtMoney(totalFinalAmount)],
        ['Total Converted Bill', fmtMoney(totalConvertedBill)],
      ],
    })
  }, [filteredData, fromDate, toDate, supplierLabel, customerLabel, reportData.length, totalFinalAmount, totalConvertedBill])

  const noData = reportData.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">StockIn Summary Report</h1>
        <p className="mt-1 text-sm text-gray-500">View summarized stock-in invoices by date range, supplier, or customer.</p>
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
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Supplier</label>
            <PaginatedCombobox type="supplier" value={supplierId} onValueChange={(v, l) => { setSupplierId(v); setSupplierLabel(l ?? null); setLoadRequested(false) }} placeholder="All Suppliers" />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Customer</label>
            <PaginatedCombobox type="customer" value={customerId} onValueChange={(v, l) => { setCustomerId(v); setCustomerLabel(l ?? null); setLoadRequested(false) }} placeholder="All Customers" />
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Invoice, party, status…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputCls} pl-8`} />
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
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"><PackagePlus size={28} /></div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Loaded</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">Select filters and click Load Data.</p>
          </div>
        )}
        {!isLoading && loadRequested && noData && !isError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"><Database size={28} /></div>
            <h2 className="text-lg font-semibold text-gray-900">No Records Found</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">No summary records match the selected filters.</p>
          </div>
        )}

        {!noData && (
          <>
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Total Records" value={String(reportData.length)} />
                <StatCard label="Filtered" value={String(filteredData.length)} />
                <StatCard label="Total Final Amount" value={fmtMoney(totalFinalAmount)} accent />
                <StatCard label="Total Converted Bill" value={fmtMoney(totalConvertedBill)} />
              </div>
            </div>

            <div className="max-h-[calc(100vh-400px)] overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Invoice No</th>
                    <th className="px-4 py-3 font-semibold">Invoice Date</th>
                    <th className="px-4 py-3 font-semibold">Job Type</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Source Channel</th>
                    <th className="px-4 py-3 font-semibold">Dest. Channel</th>
                    <th className="px-4 py-3 font-semibold">Party</th>
                    <th className="px-4 py-3 font-semibold text-right">Final Amount</th>
                    <th className="px-4 py-3 font-semibold text-right">Converted Bill</th>
                    <th className="px-4 py-3 font-semibold">Currency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.length === 0 ? (
                    <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">No records match your search</td></tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-700 font-medium">{item.siInvoiceNo || '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{fmtDate(item.siInvoiceDate)}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.jobType || '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.lifecycleName || '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.sourceChannelName || '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.destinationChannelName || '-'}</td>
                        <td className="px-4 py-2.5 text-gray-900 font-medium">{item.partyName || '-'}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-medium text-emerald-700">{fmtMoney(item.sibFinalAmount)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{fmtMoney(item.sibFinalConvertedBill)}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.sibCurrencyName || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredData.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
                      <td colSpan={7} className="px-4 py-2.5 text-xs uppercase tracking-wider text-gray-500">Total</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-emerald-800">{fmtMoney(filteredData.reduce((s, i) => s + (i.sibFinalAmount ?? 0), 0))}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtMoney(filteredData.reduce((s, i) => s + (i.sibFinalConvertedBill ?? 0), 0))}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
              <p className="text-xs text-gray-500">Showing {filteredData.length} of {reportData.length} records</p>
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
