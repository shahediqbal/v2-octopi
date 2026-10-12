import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, Database, FileSpreadsheet, FileText, Loader2, RefreshCw, Search, Truck } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { useDeliveryConveyance } from '@/hooks/useDeliveryConveyance'
import { DeliveryConveyancePrintModal } from '@/pages/reports/DeliveryConveyancePrintModal'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { DeliveryConveyanceFilters } from '@/types/deliveryConveyance'

function todayStr() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}
function firstDayOfMonth() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), '01'].join('-')
}
function fmtDateShort(value: string) {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
function fmtDateTime(value?: string | null) {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}
function fmtCurrency(value: number | null) {
  if (value == null) return '-'
  return value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function resolveInvoiceNo(item: { invoiceNo: string | null; soSystemNo?: string | null }) {
  return item.soSystemNo ?? item.invoiceNo ?? '-'
}

function resolveDescription(item: { taskDescription: string | null; description?: string | null }) {
  return item.taskDescription ?? item.description ?? '-'
}

function resolveStartLocation(item: { startLocation: string | null; taskTransportationStartLocation?: string | null }) {
  return item.taskTransportationStartLocation ?? item.startLocation ?? '-'
}

function resolveEndLocation(item: { endLocation: string | null; taskTransportationEndLocation?: string | null }) {
  return item.taskTransportationEndLocation ?? item.endLocation ?? '-'
}

function resolveEmployeeId(item: { employeeId: number | null; taskAssignedTo?: number | null }) {
  return item.employeeId ?? item.taskAssignedTo ?? null
}

function resolveEmployeeName(item: { employeeName: string | null; billBy?: string | null }) {
  return item.employeeName?.trim() || item.billBy?.trim() || '-'
}

const EXCEL_COLUMNS = [
  { key: 'taskId', header: 'Task ID', format: 'integer' as const },
  { key: 'taskName', header: 'Task Name' },
  { key: 'taskDescription', header: 'Description', width: 28 },
  { key: 'taskDestination', header: 'Destination' },
  { key: 'vehicleName', header: 'Vehicle' },
  { key: 'taskTransportationCost', header: 'Transport Cost', format: 'number' as const },
  { key: 'startLocation', header: 'Start Location' },
  { key: 'endLocation', header: 'End Location' },
  { key: 'employeeId', header: 'Employee ID', format: 'integer' as const },
  { key: 'employeeName', header: 'Employee Name' },
  { key: 'insertedAt', header: 'Insert Time', width: 22 },
  { key: 'invoiceNo', header: 'Invoice No' },
] as const

export function DeliveryConveyanceReportPage() {
  const [fromDate, setFromDate] = useState(firstDayOfMonth)
  const [toDate, setToDate] = useState(todayStr)
  const [employeeId, setEmployeeId] = useState<number | null>(null)
  const [employeeLabel, setEmployeeLabel] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedFilters, setAppliedFilters] = useState<DeliveryConveyanceFilters | null>(null)
  const [appliedEmployeeLabel, setAppliedEmployeeLabel] = useState<string | null>(null)
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false)

  const draftFilters: DeliveryConveyanceFilters = useMemo(
    () => ({ startDate: fromDate, endDate: toDate, employeeId: employeeId ?? 0 }),
    [fromDate, toDate, employeeId],
  )

  const activeFilters = appliedFilters ?? draftFilters
  const hasLoaded = appliedFilters !== null

  const {
    data: reportData = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useDeliveryConveyance(activeFilters, hasLoaded)

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
        item.taskName?.toLowerCase().includes(q) ||
        item.taskDescription?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.taskDestination?.toLowerCase().includes(q) ||
        item.vehicleName?.toLowerCase().includes(q) ||
        resolveEmployeeName(item).toLowerCase().includes(q) ||
        item.invoiceNo?.toLowerCase().includes(q) ||
        item.soSystemNo?.toLowerCase().includes(q),
    )
  }, [reportData, searchTerm])

  const uniqueEmployees = useMemo(
    () => new Set(reportData.map(resolveEmployeeId).filter((id) => id != null)).size,
    [reportData],
  )
  const uniqueInvoices = useMemo(
    () => new Set(reportData.map((item) => resolveInvoiceNo(item)).filter((value) => value !== '-')).size,
    [reportData],
  )
  const visibleTransportCost = useMemo(
    () => filteredData.reduce((sum, item) => sum + Number(item.taskTransportationCost ?? 0), 0),
    [filteredData],
  )

  const handleLoad = useCallback(() => {
    if (dateError) return
    const nextFilters = { ...draftFilters }
    const sameFilters =
      appliedFilters?.startDate === nextFilters.startDate &&
      appliedFilters?.endDate === nextFilters.endDate &&
      appliedFilters?.employeeId === nextFilters.employeeId

    setAppliedFilters(nextFilters)
    setAppliedEmployeeLabel(employeeLabel)
    setIsPrintPreviewOpen(false)

    if (sameFilters) {
      void refetch()
    }
  }, [appliedFilters, dateError, draftFilters, employeeLabel, refetch])

  const handleExport = useCallback(async () => {
    if (filteredData.length === 0) return
    await exportExcelOnDemand({
      fileName: `Delivery_Conveyance_${activeFilters.startDate}_to_${activeFilters.endDate}`,
      title: 'Delivery Conveyance Report',
      subtitle: `${fmtDateShort(activeFilters.startDate)} to ${fmtDateShort(activeFilters.endDate)}`,
      sheetName: 'Conveyance',
      columns: [...EXCEL_COLUMNS],
      data: filteredData.map((item) => ({
        ...item,
        taskDescription: resolveDescription(item),
        startLocation: resolveStartLocation(item),
        endLocation: resolveEndLocation(item),
        employeeId: resolveEmployeeId(item),
        employeeName: resolveEmployeeName(item),
        insertedAt: fmtDateTime(item.insertedAt),
        invoiceNo: resolveInvoiceNo(item),
      })) as unknown as Record<string, unknown>[],
      filters: [
        ['Date Range', `${fmtDateShort(activeFilters.startDate)} – ${fmtDateShort(activeFilters.endDate)}`],
        ['Employee', appliedEmployeeLabel || 'All'],
      ],
      summaryCards: [
        ['Total Records', reportData.length],
        ['Filtered', filteredData.length],
        ['Unique Employees', uniqueEmployees],
        ['Unique Invoices', uniqueInvoices],
      ],
    })
  }, [activeFilters.endDate, activeFilters.startDate, appliedEmployeeLabel, filteredData, reportData.length, uniqueEmployees, uniqueInvoices])

  const handlePdfExport = useCallback(async () => {
    if (filteredData.length === 0) return
    setIsPrintPreviewOpen(true)
  }, [filteredData.length])

  const noData = hasLoaded && reportData.length === 0
  const showResults = hasLoaded && reportData.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery Conveyance Report</h1>
        <p className="mt-1 text-sm text-gray-500">
          View delivery task conveyance records with transport costs and routes.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 px-4 py-4">
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setIsPrintPreviewOpen(false) }}
              className={inputCls}
            />
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setIsPrintPreviewOpen(false) }}
              className={inputCls}
            />
          </div>
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Employee</label>
            <PaginatedCombobox
              type="employee"
              value={employeeId}
              onValueChange={(v) => { setEmployeeId(v); setIsPrintPreviewOpen(false) }}
              onLabelChange={setEmployeeLabel}
              placeholder="All Employees"
            />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Task, destination, vehicle…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!hasLoaded ? (
              <button
                onClick={handleLoad}
                disabled={isLoading || !!dateError}
                className="action-report inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? 'Loading…' : 'Load Data'}
              </button>
            ) : (
              <>
                <button
                  onClick={handleExport}
                  disabled={filteredData.length === 0}
                  className="action-report inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileSpreadsheet size={14} />
                  Excel
                </button>
                <button
                  onClick={handlePdfExport}
                  disabled={filteredData.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileText size={14} />
                  PDF
                </button>
                <button
                  onClick={handleLoad}
                  disabled={isLoading || !!dateError}
                  className="action-report inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
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
            <AlertCircle size={14} /> {(error as Error)?.message ?? 'Failed to load data'}
          </div>
        )}

        {!isLoading && !isError && !hasLoaded && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Truck size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Loaded</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">Select filters and click Load Data to view conveyance records.</p>
          </div>
        )}

        {!isLoading && hasLoaded && noData && !isError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Database size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Records Found</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">No conveyance records match the selected filters.</p>
          </div>
        )}

        {showResults && (
          <>
            {/* Stats */}
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Total Records" value={String(reportData.length)} />
                <StatCard label="Filtered" value={String(filteredData.length)} />
                <StatCard label="Unique Employees" value={String(uniqueEmployees)} />
                <StatCard label="Unique Invoices" value={String(uniqueInvoices)} />
              </div>
            </div>

            {/* Table */}
            <div className="max-h-[calc(100vh-400px)] overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Task ID</th>
                    <th className="px-4 py-3 font-semibold">Task Name</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold">Destination</th>
                    <th className="px-4 py-3 font-semibold">Vehicle</th>
                    <th className="px-4 py-3 font-semibold text-right">Transport Cost</th>
                    <th className="px-4 py-3 font-semibold">Start Location</th>
                    <th className="px-4 py-3 font-semibold">End Location</th>
                    <th className="px-4 py-3 font-semibold">Employee</th>
                    <th className="px-4 py-3 font-semibold">Invoice No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                        No records match your search
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-gray-50">
                        <td className="px-4 py-2.5 tabular-nums text-gray-600">{item.taskId ?? '-'}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{item.taskName || '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{resolveDescription(item)}</td>
                        <td className="px-4 py-2.5 text-gray-700">{item.taskDestination || '-'}</td>
                        <td className="px-4 py-2.5 text-gray-700">{item.vehicleName || '-'}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">{fmtCurrency(item.taskTransportationCost)}</td>
                        <td className="px-4 py-2.5 text-gray-600">{resolveStartLocation(item)}</td>
                        <td className="px-4 py-2.5 text-gray-600">{resolveEndLocation(item)}</td>
                        <td className="px-4 py-2.5 text-gray-700">{item.employeeName || '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{resolveInvoiceNo(item)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="border-t border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                  <tr>
                    <td colSpan={5} className="px-4 py-2">Total</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtCurrency(visibleTransportCost)}</td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
              <p className="text-xs text-gray-500">
                Showing {filteredData.length} of {reportData.length} records
              </p>
            </div>
          </>
        )}
      </div>

      <DeliveryConveyancePrintModal
        isOpen={isPrintPreviewOpen}
        rows={filteredData}
        startDate={activeFilters.startDate}
        endDate={activeFilters.endDate}
        employeeLabel={appliedEmployeeLabel}
        onClose={() => setIsPrintPreviewOpen(false)}
      />
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
