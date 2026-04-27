import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, CalendarClock, Database, Eye, FileSpreadsheet, Loader2, RefreshCw, Search } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { useDailyInvoiceTracking } from '@/hooks/useDailyInvoiceTracking'
import { InvoiceDetailModal } from '@/components/reports/InvoiceDetailModal'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { DailyInvoiceTrackingFilters, DailyInvoiceTrackingItem } from '@/types/dailyInvoiceTracking'

function todayStr() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}
function firstDayOfMonth() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), '01'].join('-')
}
function fmtDate(value: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
function fmtDateShort(value: string) {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
function deliveredBy(item: DailyInvoiceTrackingItem) {
  const parts = [item.empFirstName, item.empLastName].filter(Boolean)
  return parts.join(' ') || '—'
}

const EXCEL_COLUMNS = [
  { key: 'lifecycleName', header: 'Life Cycle' },
  { key: 'customerName', header: 'Customer Name' },
  { key: 'soSystemId', header: 'Invoice ID', format: 'integer' as const },
  { key: 'invoiceDate', header: 'Invoice Date', format: 'date' as const },
  { key: 'orderDuration', header: 'Order Duration' },
  { key: 'deliveredBy', header: 'Delivered By' },
  { key: 'daysPending', header: 'Pending Duration', format: 'integer' as const },
  { key: 'channelName', header: 'Channel' },
] as const

export function DailyInvoiceTrackingPage() {
  const [fromDate, setFromDate] = useState(firstDayOfMonth)
  const [toDate, setToDate] = useState(todayStr)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [customerLabel, setCustomerLabel] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterLifecycle, setFilterLifecycle] = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [loadRequested, setLoadRequested] = useState(false)
  const [modalInvoiceId, setModalInvoiceId] = useState<number | null>(null)

  const filters: DailyInvoiceTrackingFilters = useMemo(
    () => ({ startDate: fromDate, endDate: toDate, partnerId: customerId ?? 0 }),
    [fromDate, toDate, customerId],
  )

  const {
    data: reportData = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useDailyInvoiceTracking(filters, loadRequested)

  const dateError = useMemo(() => {
    if (!fromDate || !toDate) return 'Both dates are required'
    if (new Date(fromDate) > new Date(toDate)) return "'From' date cannot be after 'To' date"
    return ''
  }, [fromDate, toDate])

  const lifecycleOptions = useMemo(
    () => [...new Set(reportData.map((i) => i.lifecycleName).filter(Boolean))].sort() as string[],
    [reportData],
  )
  const channelOptions = useMemo(
    () => [...new Set(reportData.map((i) => i.channelName).filter(Boolean))].sort() as string[],
    [reportData],
  )

  const filteredData = useMemo(() => {
    let data = reportData
    const q = search.trim().toLowerCase()
    if (q) {
      data = data.filter(
        (item) =>
          item.customerName?.toLowerCase().includes(q) ||
          String(item.soSystemId ?? '').includes(q),
      )
    }
    if (filterLifecycle) data = data.filter((i) => i.lifecycleName === filterLifecycle)
    if (filterChannel) data = data.filter((i) => i.channelName === filterChannel)
    return data
  }, [reportData, search, filterLifecycle, filterChannel])

  const uniqueCustomers = useMemo(() => new Set(filteredData.map((i) => i.customerName).filter(Boolean)).size, [filteredData])
  const uniqueChannels = useMemo(() => new Set(filteredData.map((i) => i.channelName).filter(Boolean)).size, [filteredData])
  const noData = reportData.length === 0

  const handleLoad = useCallback(() => {
    if (dateError) return
    setLoadRequested(true)
    void refetch()
  }, [dateError, refetch])

  const handleExport = useCallback(async () => {
    if (filteredData.length === 0) return
    const rows = filteredData.map((item) => ({ ...item, deliveredBy: deliveredBy(item) }))
    await exportExcelOnDemand({
      fileName: `Daily_Invoice_Tracking_${fromDate}_to_${toDate}`,
      title: 'Daily Invoice Tracking Report',
      subtitle: `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
      sheetName: 'Tracking',
      columns: [...EXCEL_COLUMNS],
      data: rows as unknown as Record<string, unknown>[],
      filters: [
        ['Date Range', `${fmtDateShort(fromDate)} – ${fmtDateShort(toDate)}`],
        ['Customer', customerLabel || 'All'],
      ],
      summaryCards: [
        ['Total Records', reportData.length],
        ['Filtered Records', filteredData.length],
        ['Unique Customers', uniqueCustomers],
        ['Unique Channels', uniqueChannels],
      ],
    })
  }, [filteredData, fromDate, toDate, customerLabel, reportData.length, uniqueCustomers, uniqueChannels])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Invoice Tracking</h1>
        <p className="mt-1 text-sm text-gray-500">Track daily invoice activity and turnaround times.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Filters */}
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
            <label className="mb-1 block text-xs font-medium text-gray-600">Customer</label>
            <PaginatedCombobox type="customer" value={customerId} onValueChange={(v, l) => { setCustomerId(v); setCustomerLabel(l ?? null); setLoadRequested(false) }} placeholder="All Customers" />
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Lifecycle</label>
            <select value={filterLifecycle} onChange={(e) => setFilterLifecycle(e.target.value)} className={inputCls}>
              <option value="">All</option>
              {lifecycleOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Channel</label>
            <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)} className={inputCls}>
              <option value="">All</option>
              {channelOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="min-w-[150px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Customer, invoice…" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} pl-8`} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {noData ? (
              <button onClick={handleLoad} disabled={isLoading || !!dateError} className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? 'Loading…' : 'Load Data'}
              </button>
            ) : (
              <>
                <button onClick={handleExport} disabled={filteredData.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50">
                  <FileSpreadsheet size={14} />Excel
                </button>
                <button onClick={handleLoad} disabled={isLoading || !!dateError} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
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
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"><CalendarClock size={28} /></div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Loaded</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">Select a date range and click Load Data.</p>
          </div>
        )}
        {!isLoading && loadRequested && noData && !isError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"><Database size={28} /></div>
            <h2 className="text-lg font-semibold text-gray-900">No Records Found</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">No invoice tracking data matched the selected filters.</p>
          </div>
        )}

        {!noData && (
          <>
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Total Records" value={String(reportData.length)} />
                <StatCard label="Filtered" value={String(filteredData.length)} />
                <StatCard label="Unique Customers" value={String(uniqueCustomers)} />
                <StatCard label="Unique Channels" value={String(uniqueChannels)} accent />
              </div>
            </div>

            <div className="max-h-[calc(100vh-420px)] overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Life Cycle</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Invoice ID</th>
                    <th className="px-4 py-3 font-semibold">View</th>
                    <th className="px-4 py-3 font-semibold">Invoice Date</th>
                    <th className="px-4 py-3 font-semibold">Order Duration</th>
                    <th className="px-4 py-3 font-semibold">Delivered By</th>
                    <th className="px-4 py-3 font-semibold text-right">Days Pending</th>
                    <th className="px-4 py-3 font-semibold">Channel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">No records match the active filters</td></tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          {item.lifecycleName ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{item.lifecycleName}</span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{item.customerName || '—'}</td>
                        <td className="px-4 py-2.5 tabular-nums text-gray-600">{item.soSystemId ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          {item.soSystemId != null && (
                            <button
                              onClick={() => setModalInvoiceId(item.soSystemId)}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                            >
                              <Eye size={12} /> View
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{fmtDate(item.invoiceDate)}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.orderDuration || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{deliveredBy(item)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {item.daysPending != null ? (
                            <span className={item.daysPending > 7 ? 'font-semibold text-red-600' : 'text-gray-900'}>
                              {item.daysPending}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{item.channelName || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
              <p className="text-xs text-gray-500">Showing {filteredData.length} of {reportData.length} records</p>
            </div>
          </>
        )}
      </div>

      {modalInvoiceId != null && (
        <InvoiceDetailModal soSystemId={modalInvoiceId} onClose={() => setModalInvoiceId(null)} />
      )}
    </div>
  )
}

const inputCls = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-gray-800' : 'text-gray-700'}`}>{value}</p>
    </div>
  )
}
