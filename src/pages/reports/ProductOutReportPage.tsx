import { useState, useMemo, useCallback } from 'react'
import { Search, FileSpreadsheet, RefreshCw, Loader2, AlertCircle, Database } from 'lucide-react'
import { useProductOutReport } from '@/hooks/useProductOutReport'
import type { ProductOutReportFilters } from '@/hooks/useProductOutReport'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import { PaginatedCombobox } from '@/components/dropdowns'

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

/* ─── Excel columns matching legacy heading_with_title ─── */
const EXCEL_COLUMNS = [
  { key: 'soSystemId', header: 'System Id', format: 'integer' as const },
  { key: 'soSystemNo', header: 'Invoice No' },
  { key: 'invoiceDate', header: 'Invoice Date', format: 'date' as const },
  { key: 'soCustomerId', header: 'Customer Id', format: 'integer' as const },
  { key: 'customerName', header: 'Customer Name' },
  { key: 'customerAddress', header: 'Customer Address' },
  { key: 'jobType', header: 'Type Of Sales' },
  { key: 'sodProductId', header: 'Product Id', format: 'integer' as const },
  { key: 'productName', header: 'Product Name' },
  { key: 'sodConfirmedQty', header: 'Sold Quantity', format: 'number' as const },
  { key: 'sodConfirmedUnitPrice', header: 'Unit Price', format: 'number' as const },
  { key: 'soCurrentStatus', header: 'Work Pending Id', format: 'integer' as const },
  { key: 'lifecycleName', header: 'Work Pending Name' },
  { key: 'soAssociateCurrentStatus', header: 'Decession Id', format: 'integer' as const },
  { key: 'decessionPending', header: 'Pending Name' },
  { key: 'soRemarks', header: 'Remarks' },
  { key: 'soCustomerReferance', header: 'Customer Ref' },
  { key: 'soRelatedLcId', header: 'LC Ref' },
  { key: 'soVatRefNo', header: 'Vat Ref' },
  { key: 'soVatSystemInvoiceNo', header: 'Vat System Invoice' },
]

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'

/* ─── component ─── */
export function ProductOutReportPage() {
  const [fromDate, setFromDate] = useState(firstDayOfMonth)
  const [toDate, setToDate] = useState(todayStr)
  const [productId, setProductId] = useState<number | null>(null)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadRequested, setLoadRequested] = useState(false)

  const filters: ProductOutReportFilters = useMemo(
    () => ({
      startDate: fromDate,
      endDate: toDate,
      productId: productId ?? 0,
      customerId: customerId ?? 0,
    }),
    [fromDate, toDate, productId, customerId],
  )

  const {
    data: reportData = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useProductOutReport(filters, loadRequested)

  const dateError = useMemo(() => {
    if (!fromDate || !toDate) return 'Both dates are required'
    if (new Date(fromDate) > new Date(toDate)) return "'From' date cannot be after 'To' date"
    return ''
  }, [fromDate, toDate])

  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return reportData.filter((item) => {
      if (!q) return true
      return (
        item.customerName?.toLowerCase().includes(q) ||
        item.productName?.toLowerCase().includes(q) ||
        item.soSystemNo?.toLowerCase().includes(q) ||
        item.invoiceDate?.toLowerCase().includes(q) ||
        item.jobType?.toLowerCase().includes(q)
      )
    })
  }, [reportData, searchTerm])

  const uniqueCustomers = useMemo(() => new Set(filteredData.map((i) => i.customerName)).size, [filteredData])
  const uniqueProducts = useMemo(() => new Set(filteredData.map((i) => i.productName)).size, [filteredData])

  const handleLoad = useCallback(() => {
    if (dateError) return
    setLoadRequested(true)
    refetch()
  }, [dateError, refetch])

  const handleExport = useCallback(async () => {
    if (filteredData.length === 0) return
    await exportExcelOnDemand({
      fileName: `Product_Stock_Out_Report_${fromDate}_to_${toDate}`,
      title: 'Product Out Report',
      subtitle: `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
      sheetName: 'Product Out Report',
      columns: EXCEL_COLUMNS,
      data: filteredData as unknown as Record<string, unknown>[],
      filters: [
        ['Date Range', `${fmtDateShort(fromDate)} – ${fmtDateShort(toDate)}`],
        ['Customer', customerId ? `ID: ${customerId}` : 'All'],
        ['Product', productId ? `ID: ${productId}` : 'All'],
      ],
      summaryCards: [
        ['Total Records', reportData.length],
        ['Filtered Records', filteredData.length],
        ['Unique Customers', uniqueCustomers],
        ['Unique Products', uniqueProducts],
      ],
    })
  }, [filteredData, fromDate, toDate, reportData.length, uniqueCustomers, uniqueProducts, customerId, productId])

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Out Report</h1>
        <p className="text-sm text-gray-500 mt-1">Generate product stock-out report by date range, product, and customer.</p>
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

          {/* product */}
          <div className="min-w-[200px] flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
            <PaginatedCombobox
              type="product"
              value={productId}
              onValueChange={(v) => { setProductId(v); setLoadRequested(false) }}
              placeholder="All Products"
            />
          </div>

          {/* customer */}
          <div className="min-w-[200px] flex-1">
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
                placeholder="Invoice, customer, product…"
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
                disabled={isLoading || !!dateError}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? 'Loading…' : 'Load Data'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => void handleExport()}
                  disabled={filteredData.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FileSpreadsheet size={14} />
                  Excel
                </button>
                <button
                  onClick={handleLoad}
                  disabled={isLoading || !!dateError}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
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
        {isLoading && (
          <div className="h-1 w-full overflow-hidden bg-gray-100">
            <div className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] rounded bg-gray-400" />
          </div>
        )}

        {/* api error */}
        {isError && !dateError && (
          <div className="mx-4 my-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle size={14} /> {(error as Error)?.message ?? 'Failed to load report data'}
          </div>
        )}

        {/* empty state — before load */}
        {!isLoading && !isError && !dateError && reportData.length === 0 && !loadRequested && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-4">
              <Database size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Loaded</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Select a date range and click "Load Data" to fetch product out report data.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Selected: {fmtDateShort(fromDate)} to {fmtDateShort(toDate)}
            </p>
          </div>
        )}

        {/* empty state — after load, no results */}
        {!isLoading && loadRequested && reportData.length === 0 && !isError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-4">
              <Database size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Found</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              No product out report data found for the selected filters.
            </p>
          </div>
        )}

        {/* summary bar */}
        {!isLoading && !isError && reportData.length > 0 && (
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Report Summary ({fmtDateShort(fromDate)} to {fmtDateShort(toDate)})
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total Records" value={reportData.length} />
              <StatCard label="Filtered Records" value={filteredData.length} accent />
              <StatCard label="Unique Customers" value={uniqueCustomers} />
              <StatCard label="Unique Products" value={uniqueProducts} />
            </div>
          </div>
        )}

        {/* data table */}
        {reportData.length > 0 && (
          <div className="overflow-x-auto max-h-[calc(100vh-440px)] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">System Id</th>
                  <th className="px-4 py-3 font-semibold">Invoice No</th>
                  <th className="px-4 py-3 font-semibold">Invoice Date</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold text-right">Sold Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
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
                      <td className="px-4 py-2.5 font-medium text-gray-900">{item.soSystemNo ?? '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{fmtDate(item.invoiceDate)}</td>
                      <td className="px-4 py-2.5 text-gray-700">{item.customerName ?? '-'}</td>
                      <td className="px-4 py-2.5 text-gray-700">{item.productName ?? '-'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{item.sodConfirmedQty ?? '-'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{item.sodConfirmedUnitPrice ?? '-'}</td>
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

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-gray-800' : 'text-gray-700'}`}>{value}</p>
    </div>
  )
}
