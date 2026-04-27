import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, Boxes, Database, FileSpreadsheet, Loader2, RefreshCw, Search } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { useRepackingPackedByReport } from '@/hooks/useRepackingPackedByReport'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type {
  RepackingPackedByReportFilters,
  RepackingPackedByReportItem,
} from '@/types/repackingPackedByReport'

function todayStr() {
  const date = new Date()
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function firstDayOfMonth() {
  const date = new Date()
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), '01'].join('-')
}

function fmtDate(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateShort(value: string) {
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function fmtNumber(value: number | null) {
  if (value == null) return '-'
  return value.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function getPackedByName(item: RepackingPackedByReportItem) {
  return [item.empFirstName, item.empLastName].filter(Boolean).join(' ').trim() || '-'
}

const EXCEL_COLUMNS = [
  { key: 'soSystemId', header: 'System Id', format: 'integer' as const },
  { key: 'soSystemNo', header: 'Invoice No' },
  { key: 'customerName', header: 'Customer' },
  { key: 'productName', header: 'Product' },
  { key: 'sopProductQty', header: 'Quantity', format: 'number' as const },
  { key: 'packTypeName', header: 'Pack Type' },
  { key: 'sopPackSize', header: 'Pack Size', format: 'number' as const },
  { key: 'sopNoPack', header: 'No Of Packs', format: 'number' as const },
  { key: 'packedBy', header: 'Packed By' },
  { key: 'entryDate', header: 'Entry Date', format: 'date' as const },
] as const

export function RepackingPackedByReportPage() {
  const [fromDate, setFromDate] = useState(firstDayOfMonth)
  const [toDate, setToDate] = useState(todayStr)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [employeeId, setEmployeeId] = useState<number | null>(null)
  const [productId, setProductId] = useState<number | null>(null)
  const [systemId, setSystemId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loadRequested, setLoadRequested] = useState(false)

  const filters: RepackingPackedByReportFilters = useMemo(
    () => ({
      startDate: fromDate,
      endDate: toDate,
      customerId: customerId ?? 0,
      employeeId: employeeId ?? 0,
      soSystemId: systemId,
      productId: productId ?? 0,
    }),
    [customerId, employeeId, fromDate, productId, systemId, toDate],
  )

  const {
    data: reportData = [],
    isLoading: loadingReport,
    isError,
    error,
    refetch,
  } = useRepackingPackedByReport(filters, loadRequested)

  const dateError = useMemo(() => {
    if (!fromDate || !toDate) return 'Both dates are required'
    if (new Date(fromDate) > new Date(toDate)) return "'From' date cannot be after 'To' date"
    return ''
  }, [fromDate, toDate])

  const filteredData = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return reportData.filter((item) => {
      if (!query) return true
      return (
        item.customerName?.toLowerCase().includes(query) ||
        item.productName?.toLowerCase().includes(query) ||
        item.soSystemNo?.toLowerCase().includes(query) ||
        String(item.soSystemId ?? '').includes(query) ||
        item.packTypeName?.toLowerCase().includes(query) ||
        getPackedByName(item).toLowerCase().includes(query) ||
        item.entryDate?.toLowerCase().includes(query)
      )
    })
  }, [reportData, searchTerm])

  const totalQuantity = useMemo(
    () => filteredData.reduce((sum, item) => sum + (item.sopProductQty ?? 0), 0),
    [filteredData],
  )
  const totalPacks = useMemo(
    () => filteredData.reduce((sum, item) => sum + (item.sopNoPack ?? 0), 0),
    [filteredData],
  )
  const uniqueCustomers = useMemo(() => new Set(filteredData.map((item) => item.customerName)).size, [filteredData])
  const uniqueEmployees = useMemo(() => new Set(filteredData.map((item) => getPackedByName(item))).size, [filteredData])

  const selectedCustomerLabel = useMemo(() => {
    if (customerId === null) return null
    return reportData.find((item) => item.customerName)?.customerName ?? `Customer #${customerId}`
  }, [customerId, reportData])

  const selectedEmployeeLabel = useMemo(() => {
    if (employeeId === null) return null
    const match = reportData.find((item) => getPackedByName(item) !== '-')
    return match ? getPackedByName(match) : `Employee #${employeeId}`
  }, [employeeId, reportData])

  const selectedProductLabel = useMemo(() => {
    if (productId === null) return null
    return reportData.find((item) => item.productName)?.productName ?? `Product #${productId}`
  }, [productId, reportData])

  const exportData = useMemo(
    () => filteredData.map((item) => ({ ...item, packedBy: getPackedByName(item) })),
    [filteredData],
  )

  const handleLoad = useCallback(() => {
    if (dateError) return
    setLoadRequested(true)
    void refetch()
  }, [dateError, refetch])

  const handleExport = useCallback(async () => {
    if (exportData.length === 0) return

    await exportExcelOnDemand({
      fileName: `Repacking_Packed_By_Report_${fromDate}_to_${toDate}`,
      title: 'Repacking Packed By Report',
      subtitle: `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
      sheetName: 'Repacking Packed By',
      columns: [...EXCEL_COLUMNS],
      data: exportData as unknown as Record<string, unknown>[],
      filters: [
        ['Date Range', `${fmtDateShort(fromDate)} – ${fmtDateShort(toDate)}`],
        ['Customer', selectedCustomerLabel || 'All'],
        ['Employee', selectedEmployeeLabel || 'All'],
        ['Product', selectedProductLabel || 'All'],
        ['System Id', systemId.trim() || 'All'],
      ],
      summaryCards: [
        ['Total Records', reportData.length],
        ['Filtered Records', filteredData.length],
        ['Total Quantity', fmtNumber(totalQuantity)],
        ['Total Packs', fmtNumber(totalPacks)],
      ],
    })
  }, [exportData, filteredData.length, fromDate, reportData.length, selectedCustomerLabel, selectedEmployeeLabel, selectedProductLabel, systemId, toDate, totalPacks, totalQuantity])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Repacking Packed By Report</h1>
        <p className="mt-1 text-sm text-gray-500">
          Load repacking activity by date range, customer, employee, system id, and product, then export the result to Excel.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 px-4 py-4">
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value)
                setLoadRequested(false)
              }}
              className={inputCls}
            />
          </div>

          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value)
                setLoadRequested(false)
              }}
              className={inputCls}
            />
          </div>

          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Customer</label>
            <PaginatedCombobox
              type="customer"
              value={customerId}
              onValueChange={(value) => {
                setCustomerId(value)
                setLoadRequested(false)
              }}
              placeholder="All Customers"
            />
          </div>

          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Employee</label>
            <PaginatedCombobox
              type="employee"
              value={employeeId}
              onValueChange={(value) => {
                setEmployeeId(value)
                setLoadRequested(false)
              }}
              placeholder="All Employees"
            />
          </div>

          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Product</label>
            <PaginatedCombobox
              type="product"
              value={productId}
              onValueChange={(value) => {
                setProductId(value)
                setLoadRequested(false)
              }}
              placeholder="All Products"
            />
          </div>

          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">System Id</label>
            <input
              type="number"
              placeholder="All System Ids"
              value={systemId}
              onChange={(event) => {
                setSystemId(event.target.value)
                setLoadRequested(false)
              }}
              className={inputCls}
            />
          </div>

          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Invoice, customer, product, pack type…"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {reportData.length === 0 ? (
              <button
                onClick={handleLoad}
                disabled={loadingReport || !!dateError}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingReport && <Loader2 size={14} className="animate-spin" />}
                {loadingReport ? 'Loading…' : 'Load Data'}
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
                  disabled={loadingReport || !!dateError}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loadingReport ? 'animate-spin' : ''} />
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

        {loadingReport && (
          <div className="h-1 w-full overflow-hidden bg-gray-100">
            <div className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] rounded bg-gray-400" />
          </div>
        )}

        {isError && !dateError && (
          <div className="mx-4 my-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            <AlertCircle size={14} /> {(error as Error)?.message ?? 'Failed to load repacking report data'}
          </div>
        )}

        {!loadingReport && !isError && !dateError && reportData.length === 0 && !loadRequested && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Boxes size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Loaded</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Select a date range and click Load Data to fetch repacking activity.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Selected: {fmtDateShort(fromDate)} to {fmtDateShort(toDate)}
            </p>
          </div>
        )}

        {!loadingReport && loadRequested && reportData.length === 0 && !isError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Database size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Found</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              No repacking report data found for the selected filters.
            </p>
          </div>
        )}

        {!loadingReport && !isError && reportData.length > 0 && (
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
            <p className="mb-2 text-sm font-semibold text-gray-700">
              Report Summary ({fmtDateShort(fromDate)} to {fmtDateShort(toDate)})
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total Records" value={String(reportData.length)} />
              <StatCard label="Filtered Records" value={String(filteredData.length)} accent />
              <StatCard label="Unique Customers" value={String(uniqueCustomers)} />
              <StatCard label="Unique Employees" value={String(uniqueEmployees)} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard label="Total Quantity" value={fmtNumber(totalQuantity)} />
              <StatCard label="Total Packs" value={fmtNumber(totalPacks)} />
            </div>
          </div>
        )}

        {reportData.length > 0 && (
          <div className="max-h-[calc(100vh-420px)] overflow-x-auto overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">System Id</th>
                  <th className="px-4 py-3 font-semibold">Invoice No</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                  <th className="px-4 py-3 font-semibold">Pack Type</th>
                  <th className="px-4 py-3 font-semibold text-right">Pack Size</th>
                  <th className="px-4 py-3 font-semibold text-right">No Of Packs</th>
                  <th className="px-4 py-3 font-semibold">Packed By</th>
                  <th className="px-4 py-3 font-semibold">Entry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                      No data found matching your search
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={`${item.soSystemId ?? 'repacking'}-${index}`} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {item.soSystemId ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{item.soSystemNo || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-700">{item.customerName || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-700">{item.productName || '-'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtNumber(item.sopProductQty)}</td>
                      <td className="px-4 py-2.5 text-gray-700">{item.packTypeName || '-'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtNumber(item.sopPackSize)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtNumber(item.sopNoPack)}</td>
                      <td className="px-4 py-2.5 text-gray-700">{getPackedByName(item)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{fmtDate(item.entryDate)}</td>
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
              &nbsp;·&nbsp; Date range: {fmtDateShort(fromDate)} to {fmtDateShort(toDate)}
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