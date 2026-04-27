import { useState, useMemo, useCallback } from 'react'
import { Search, FileSpreadsheet, RefreshCw, Loader2, AlertCircle, Database } from 'lucide-react'
import { useSalesReport } from '@/hooks/useSalesReport'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import { PaginatedCombobox } from '@/components/dropdowns'
import type { SalesReportFilters } from '@/types/salesReport'

/* ─── helpers ─── */
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

/** Excel column definitions for the sales report */
const EXCEL_COLUMNS = [
  { key: 'soSystemId', header: 'System Id', format: 'integer' as const },
  { key: 'soSystemNo', header: 'Invoice No' },
  { key: 'invoiceDate', header: 'Invoice Date', format: 'date' as const },
  { key: 'entityName', header: 'Entity Name' },
  { key: 'entityAddress', header: 'Entity Address' },
  { key: 'sobFinalBill', header: 'Invoice Amount', format: 'number' as const },
  { key: 'jobType', header: 'Type Of Sales' },
  { key: 'lifecycleName', header: 'Current Status' },
  { key: 'soOrderFrom', header: 'Generated From' },
  { key: 'orderStatus', header: 'Order Status' },
  { key: 'atEscalation', header: 'Order Escalation At', format: 'datetime' as const },
  { key: 'atInvoicing', header: 'Invoicing At', format: 'datetime' as const },
  { key: 'atPacking', header: 'Packing At', format: 'datetime' as const },
  { key: 'atAssign', header: 'Assign At', format: 'datetime' as const },
  { key: 'atDelivery', header: 'Delivery Started At', format: 'datetime' as const },
  { key: 'delivered', header: 'Delivered At', format: 'datetime' as const },
  { key: 'deliveredBy', header: 'Delivered By' },
  { key: 'actionTakenRemarks', header: 'Remarks' },
  { key: 'soCustomerReferance', header: 'Customer Referance' },
]

/* ─── component ─── */
export function SalesReportPage() {
  /* filter state */
  const [fromDate, setFromDate] = useState(firstDayOfMonth)
  const [toDate, setToDate] = useState(todayStr)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadRequested, setLoadRequested] = useState(false)

  /* filters object (stable for query key) */
  const filters: SalesReportFilters = useMemo(
    () => ({ startDate: fromDate, endDate: toDate, partnerId: customerId ?? 0 }),
    [fromDate, toDate, customerId],
  )

  /* report query — only runs after "Load Data" */
  const {
    data: reportData = [],
    isLoading: loadingReport,
    isError,
    error,
    refetch,
  } = useSalesReport(filters, loadRequested)

  /* date validation */
  const dateError = useMemo(() => {
    if (!fromDate || !toDate) return 'Both dates are required'
    if (new Date(fromDate) > new Date(toDate)) return "'From' date cannot be after 'To' date"
    return ''
  }, [fromDate, toDate])

  /* client-side search filter */
  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return reportData.filter((item) => {
      if (!q) return true
      return (
        item.entityName?.toLowerCase().includes(q) ||
        item.soSystemNo?.toLowerCase().includes(q) ||
        item.invoiceDate?.toLowerCase().includes(q) ||
        item.lifecycleName?.toLowerCase().includes(q) ||
        item.jobType?.toLowerCase().includes(q) ||
        item.deliveredBy?.toLowerCase().includes(q)
      )
    })
  }, [reportData, searchTerm])

  /* stats */
  const uniqueCustomers = useMemo(() => new Set(filteredData.map((i) => i.entityName)).size, [filteredData])
  const uniqueStatuses = useMemo(() => new Set(filteredData.map((i) => i.lifecycleName)).size, [filteredData])

  const selectedCustomerLabel = useMemo(() => {
    if (customerId === null) return null
    const found = reportData.find((r) => r.entityName)
    return found?.entityName ?? `Customer #${customerId}`
  }, [customerId, reportData])

  const handleLoad = useCallback(() => {
    if (dateError) return
    setLoadRequested(true)
    refetch()
  }, [dateError, refetch])

  const handleExport = useCallback(async () => {
    if (filteredData.length === 0) return
    await exportExcelOnDemand({
      fileName: `Sales_Report_${fromDate}_to_${toDate}`,
      title: 'Sales Report',
      subtitle: `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
      sheetName: 'Sales Report',
      columns: EXCEL_COLUMNS,
      data: filteredData as unknown as Record<string, unknown>[],
      filters: [
        ['Date Range', `${fmtDateShort(fromDate)} – ${fmtDateShort(toDate)}`],
        ['Customer', selectedCustomerLabel || 'All'],
      ],
      summaryCards: [
        ['Total Records', reportData.length],
        ['Filtered Records', filteredData.length],
        ['Unique Customers', uniqueCustomers],
        ['Unique Statuses', uniqueStatuses],
      ],
    })
  }, [filteredData, fromDate, toDate, reportData.length, uniqueCustomers, uniqueStatuses, selectedCustomerLabel])

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
        <p className="text-sm text-gray-500 mt-1">Load data to view and export sales reports with date range and customer filters.</p>
      </div>

      {/* filters card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 px-4 py-4">
          {/* from date */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setLoadRequested(false) }}
              className={inputCls}
            />
          </div>

          {/* to date */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setLoadRequested(false) }}
              className={inputCls}
            />
          </div>

          {/* customer */}
          <div className="min-w-[220px] flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer</label>
            <PaginatedCombobox
              type="customer"
              value={customerId}
              onValueChange={(v) => { setCustomerId(v); setLoadRequested(false) }}
              placeholder="All Customers"
            />
          </div>

          {/* search */}
          <div className="min-w-[180px] flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Invoice, customer, status…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>

          {/* actions */}
          <div className="flex items-center gap-2">
            {reportData.length === 0 ? (
              <button
                onClick={handleLoad}
                disabled={loadingReport || !!dateError}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingReport && <Loader2 size={14} className="animate-spin" />}
                {loadingReport ? 'Loading…' : 'Load Data'}
              </button>
            ) : (
              <>
                <button
                  onClick={handleExport}
                  disabled={filteredData.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FileSpreadsheet size={14} />
                  Excel
                </button>
                <button
                  onClick={handleLoad}
                  disabled={loadingReport || !!dateError}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw size={14} className={loadingReport ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </>
            )}
          </div>
        </div>

        {/* date error */}
        {dateError && (
          <div className="mx-4 my-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle size={14} /> {dateError}
          </div>
        )}

        {/* loading bar */}
        {loadingReport && (
          <div className="h-1 w-full overflow-hidden bg-gray-100">
            <div className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] rounded bg-gray-400" />
          </div>
        )}

        {/* error state */}
        {isError && !dateError && (
          <div className="mx-4 my-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle size={14} /> {(error as Error)?.message ?? 'Failed to load report data'}
          </div>
        )}

        {/* empty state (before load) */}
        {!loadingReport && !isError && !dateError && reportData.length === 0 && !loadRequested && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-4">
              <Database size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Loaded</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Select a date range and click "Load Data" to fetch sales report data.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Selected: {fmtDateShort(fromDate)} to {fmtDateShort(toDate)}
            </p>
          </div>
        )}

        {/* empty state (after load, no results) */}
        {!loadingReport && loadRequested && reportData.length === 0 && !isError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-4">
              <Database size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Found</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              No sales report data found for the selected date range.
            </p>
          </div>
        )}

        {/* summary bar */}
        {!loadingReport && !isError && reportData.length > 0 && (
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Report Summary ({fmtDateShort(fromDate)} to {fmtDateShort(toDate)})
              {selectedCustomerLabel && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  – Filtered by: {selectedCustomerLabel}
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total Records" value={reportData.length} />
              <StatCard label="Filtered Records" value={filteredData.length} accent />
              <StatCard label="Unique Customers" value={uniqueCustomers} />
              <StatCard label="Unique Statuses" value={uniqueStatuses} />
            </div>
          </div>
        )}

        {/* data table */}
        {reportData.length > 0 && (
          <div className="overflow-x-auto max-h-[calc(100vh-420px)] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">System Id</th>
                  <th className="px-4 py-3 font-semibold">Invoice No</th>
                  <th className="px-4 py-3 font-semibold">Invoice Date</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Delivered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                      No data found matching your search
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {item.soSystemId ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{item.soSystemNo || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{fmtDate(item.invoiceDate)}</td>
                      <td className="px-4 py-2.5 text-gray-700">{item.entityName || '-'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtAmount(item.sobFinalBill)}</td>
                      <td className="px-4 py-2.5 text-gray-700">{item.lifecycleName || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-700">{item.jobType || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{fmtDate(item.delivered)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* footer */}
        {filteredData.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
            <p className="text-xs text-gray-500">
              Showing {filteredData.length} of {reportData.length} records
              &nbsp;·&nbsp; Date range: {fmtDateShort(fromDate)} to {fmtDateShort(toDate)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── shared helpers ─── */
const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-gray-800' : 'text-gray-700'}`}>{value}</p>
    </div>
  )
}
