import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, ArrowLeftRight, Database, FileSpreadsheet, Loader2, RefreshCw, Search } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { useStockOutSalesReturnReport } from '@/hooks/useStockOutSalesReturnReport'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { StockOutSalesReturnFilters } from '@/types/stockOutSalesReturnReport'

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
function fmtQty(value: number | null) {
  if (value == null) return '-'
  return value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const EXCEL_COLUMNS = [
  { key: 'customerId', header: 'Customer ID', format: 'integer' as const },
  { key: 'customerName', header: 'Customer Name' },
  { key: 'productName', header: 'Product Name' },
  { key: 'invoiceNo', header: 'Invoice No' },
  { key: 'invoiceDate', header: 'Invoice Date', format: 'date' as const },
  { key: 'stockOutQty', header: 'Stock Out Qty', format: 'number' as const },
  { key: 'returnQty', header: 'Return Qty', format: 'number' as const },
  { key: 'netQty', header: 'Net Qty', format: 'number' as const },
  { key: 'stockOutAmount', header: 'Stock Out Amount', format: 'number' as const },
  { key: 'returnAmount', header: 'Return Amount', format: 'number' as const },
  { key: 'netAmount', header: 'Net Amount', format: 'number' as const },
  { key: 'remarks', header: 'Remarks' },
] as const

export function StockOutSalesReturnReportPage() {
  const [fromDate, setFromDate] = useState(firstDayOfMonth)
  const [toDate, setToDate] = useState(todayStr)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [customerLabel, setCustomerLabel] = useState<string | null>(null)
  const [productId, setProductId] = useState<number | null>(null)
  const [productLabel, setProductLabel] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadRequested, setLoadRequested] = useState(false)

  const filters: StockOutSalesReturnFilters = useMemo(
    () => ({
      customerId: customerId ?? 0,
      productId: productId ?? 0,
      startDate: fromDate,
      endDate: toDate,
    }),
    [customerId, productId, fromDate, toDate],
  )

  const { data: reportData = [], isLoading, isError, error, refetch } = useStockOutSalesReturnReport(filters, loadRequested)

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
        item.invoiceNo?.toLowerCase().includes(q) ||
        item.customerName?.toLowerCase().includes(q) ||
        item.productName?.toLowerCase().includes(q),
    )
  }, [reportData, searchTerm])

  const uniqueCustomers = useMemo(() => new Set(filteredData.map((i) => i.customerId)).size, [filteredData])
  const uniqueProducts = useMemo(() => new Set(filteredData.map((i) => i.productId)).size, [filteredData])
  const totalStockOut = useMemo(() => filteredData.reduce((s, i) => s + (i.stockOutQty ?? 0), 0), [filteredData])
  const totalReturn = useMemo(() => filteredData.reduce((s, i) => s + (i.returnQty ?? 0), 0), [filteredData])

  const handleLoad = useCallback(() => {
    if (dateError) return
    setLoadRequested(true)
    void refetch()
  }, [dateError, refetch])

  const handleExport = useCallback(async () => {
    if (filteredData.length === 0) return
    await exportExcelOnDemand({
      fileName: `StockOut_SalesReturn_${fromDate}_to_${toDate}`,
      title: 'StockOut With Sales Return Report',
      subtitle: `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
      sheetName: 'StockOut Return',
      columns: [...EXCEL_COLUMNS],
      data: filteredData as unknown as Record<string, unknown>[],
      filters: [
        ['Date Range', `${fmtDateShort(fromDate)} – ${fmtDateShort(toDate)}`],
        ['Customer', customerLabel || 'All'],
        ['Product', productLabel || 'All'],
      ],
      summaryCards: [
        ['Total Records', reportData.length],
        ['Filtered Records', filteredData.length],
        ['Unique Customers', uniqueCustomers],
        ['Unique Products', uniqueProducts],
      ],
    })
  }, [filteredData, fromDate, toDate, customerLabel, productLabel, reportData.length, uniqueCustomers, uniqueProducts])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">StockOut With Sales Return</h1>
        <p className="mt-1 text-sm text-gray-500">
          View stock-out records alongside sales return quantities by customer and product.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* ── Filters ── */}
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 px-4 py-4">
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setLoadRequested(false) }}
              className={inputCls}
            />
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setLoadRequested(false) }}
              className={inputCls}
            />
          </div>
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Customer</label>
            <PaginatedCombobox
              type="customer"
              value={customerId}
              onValueChange={(v, label) => {
                setCustomerId(v)
                setCustomerLabel(label ?? null)
                setLoadRequested(false)
              }}
              placeholder="All Customers"
            />
          </div>
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Product</label>
            <PaginatedCombobox
              type="product"
              value={productId}
              onValueChange={(v, label) => {
                setProductId(v)
                setProductLabel(label ?? null)
                setLoadRequested(false)
              }}
              placeholder="All Products"
            />
          </div>
          <div className="min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Invoice, customer, product…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {reportData.length === 0 ? (
              <button
                onClick={handleLoad}
                disabled={isLoading || !!dateError}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? 'Loading…' : 'Load Data'}
              </button>
            ) : (
              <>
                <button
                  onClick={handleExport}
                  disabled={filteredData.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileSpreadsheet size={14} />
                  Excel
                </button>
                <button
                  onClick={handleLoad}
                  disabled={isLoading || !!dateError}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </>
            )}
          </div>
        </div>

        {dateError && (
          <div className="mx-4 my-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            <AlertCircle size={14} /> {dateError}
          </div>
        )}
        {isLoading && (
          <div className="h-1 w-full overflow-hidden bg-gray-100">
            <div className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] rounded bg-gray-400" />
          </div>
        )}
        {isError && (
          <div className="mx-4 my-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            <AlertCircle size={14} /> {(error as Error)?.message ?? 'Failed to load report data'}
          </div>
        )}

        {!isLoading && !isError && reportData.length === 0 && !loadRequested && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <ArrowLeftRight size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Loaded</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Select filters and click Load Data to fetch stock-out with sales return records.
            </p>
          </div>
        )}

        {!isLoading && loadRequested && reportData.length === 0 && !isError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Database size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Found</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">No records found for the selected filters.</p>
          </div>
        )}

        {/* ── Summary stats ── */}
        {!isLoading && !isError && reportData.length > 0 && (
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
            <p className="mb-2 text-sm font-semibold text-gray-700">
              Report Summary ({fmtDateShort(fromDate)} to {fmtDateShort(toDate)})
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total Records" value={String(reportData.length)} />
              <StatCard label="Filtered Records" value={String(filteredData.length)} accent />
              <StatCard label="Total Stock Out Qty" value={fmtQty(totalStockOut)} />
              <StatCard label="Total Return Qty" value={fmtQty(totalReturn)} />
            </div>
          </div>
        )}

        {/* ── Data table ── */}
        {reportData.length > 0 && (
          <div className="max-h-[calc(100vh-420px)] overflow-x-auto overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Invoice No</th>
                  <th className="px-4 py-3 font-semibold">Invoice Date</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold text-right">Stock Out Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">Return Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">Net Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">Net Amount</th>
                  <th className="px-4 py-3 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                      No records match your search
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <tr key={`${item.invoiceNo ?? 'sr'}-${idx}`} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{item.invoiceNo || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{fmtDate(item.invoiceDate)}</td>
                      <td className="px-4 py-2.5 text-gray-700">{item.customerName || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-700">{item.productName || '-'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtQty(item.stockOutQty)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-amber-700">{fmtQty(item.returnQty)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-gray-900">{fmtQty(item.netQty)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtQty(item.netAmount)}</td>
                      <td className="px-4 py-2.5 text-gray-500">{item.remarks || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {filteredData.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
            <p className="text-xs text-gray-500">
              Showing {filteredData.length} of {reportData.length} records
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-gray-800' : 'text-gray-700'}`}>{value}</p>
    </div>
  )
}
