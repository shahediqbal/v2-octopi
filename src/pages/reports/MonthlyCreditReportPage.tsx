import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, CalendarRange, Database, FileSpreadsheet, Loader2, RefreshCw, Search } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { useMonthlyCreditReport } from '@/hooks/useMonthlyCreditReport'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { MonthlyCreditFilters } from '@/types/monthlyCreditReport'

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
function fmtAmount(value: number | null) {
  if (value == null) return '-'
  return value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function MonthlyCreditReportPage() {
  const [fromDate, setFromDate] = useState(firstDayOfMonth)
  const [toDate, setToDate] = useState(todayStr)
  const [employeeId, setEmployeeId] = useState<number | null>(null)
  const [employeeLabel, setEmployeeLabel] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadRequested, setLoadRequested] = useState(false)

  const filters: MonthlyCreditFilters = useMemo(
    () => ({ employeeId: employeeId ?? 0, startDate: fromDate, endDate: toDate }),
    [employeeId, fromDate, toDate],
  )

  const { data: reportData = [], isLoading, isError, error, refetch } = useMonthlyCreditReport(filters, loadRequested)

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
        item.employeeName?.toLowerCase().includes(q) ||
        item.monthName?.toLowerCase().includes(q) ||
        item.monthYear?.toLowerCase().includes(q),
    )
  }, [reportData, searchTerm])

  const uniqueEmployees = useMemo(() => new Set(filteredData.map((i) => i.employeeId)).size, [filteredData])
  const totalCredit = useMemo(() => filteredData.reduce((s, i) => s + (i.creditAmount ?? 0), 0), [filteredData])

  const handleLoad = useCallback(() => {
    if (dateError) return
    setLoadRequested(true)
    void refetch()
  }, [dateError, refetch])

  // Build dynamic Excel columns from first data row to handle unknown fields
  const excelColumns = useMemo(() => {
    if (reportData.length === 0) return []
    const firstRow = reportData[0]
    return Object.keys(firstRow)
      .filter((k) => k !== '__proto__')
      .map((key) => ({
        key,
        header: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
        ...(typeof firstRow[key] === 'number' ? { format: 'number' as const } : {}),
      }))
  }, [reportData])

  const handleExport = useCallback(async () => {
    if (filteredData.length === 0 || excelColumns.length === 0) return
    await exportExcelOnDemand({
      fileName: `Monthly_Credit_Report_${fromDate}_to_${toDate}`,
      title: 'Monthly Credit Report',
      subtitle: `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
      sheetName: 'Monthly Credit',
      columns: excelColumns,
      data: filteredData as unknown as Record<string, unknown>[],
      filters: [
        ['Date Range', `${fmtDateShort(fromDate)} – ${fmtDateShort(toDate)}`],
        ['Employee', employeeLabel || 'All'],
      ],
      summaryCards: [
        ['Total Records', reportData.length],
        ['Filtered Records', filteredData.length],
        ['Unique Employees', uniqueEmployees],
        ['Total Credit', fmtAmount(totalCredit)],
      ],
    })
  }, [filteredData, excelColumns, fromDate, toDate, employeeLabel, reportData.length, uniqueEmployees, totalCredit])

  // Table headers from first row
  const tableKeys = useMemo(() => {
    if (reportData.length === 0) return []
    return Object.keys(reportData[0]).filter((k) => k !== '__proto__')
  }, [reportData])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monthly Credit Report</h1>
        <p className="mt-1 text-sm text-gray-500">
          Credit summary by marketing employee for the selected period.
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
            <label className="mb-1 block text-xs font-medium text-gray-600">Employee</label>
            <PaginatedCombobox
              type="employee"
              value={employeeId}
              onValueChange={(v, label) => { setEmployeeId(v); setEmployeeLabel(label ?? null); setLoadRequested(false) }}
              placeholder="All Employees"
            />
          </div>
          <div className="min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Employee, month…"
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
            <AlertCircle size={14} /> {(error as Error)?.message ?? 'Failed to load monthly credit report'}
          </div>
        )}

        {!isLoading && !isError && reportData.length === 0 && !loadRequested && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <CalendarRange size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Loaded</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Select a date range and click Load Data to fetch monthly credit records.
            </p>
          </div>
        )}

        {!isLoading && loadRequested && reportData.length === 0 && !isError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Database size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Found</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">No credit records found for the selected filters.</p>
          </div>
        )}

        {/* ── Summary stats ── */}
        {!isLoading && !isError && reportData.length > 0 && (
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
            <p className="mb-2 text-sm font-semibold text-gray-700">
              Report Summary ({fmtDateShort(fromDate)} to {fmtDateShort(toDate)})
              {employeeLabel && <span className="ml-2 text-xs font-normal text-gray-500">– {employeeLabel}</span>}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total Records" value={String(reportData.length)} />
              <StatCard label="Filtered Records" value={String(filteredData.length)} accent />
              <StatCard label="Unique Employees" value={String(uniqueEmployees)} />
              <StatCard label="Total Credit" value={fmtAmount(totalCredit)} />
            </div>
          </div>
        )}

        {/* ── Data table (dynamic columns from API response) ── */}
        {reportData.length > 0 && tableKeys.length > 0 && (
          <div className="max-h-[calc(100vh-420px)] overflow-x-auto overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  {tableKeys.map((key) => (
                    <th key={key} className="px-4 py-3 font-semibold">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={tableKeys.length} className="px-4 py-10 text-center text-gray-400">
                      No records match your search
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <tr key={idx} className="transition-colors hover:bg-gray-50">
                      {tableKeys.map((key) => (
                        <td key={key} className="px-4 py-2.5 text-gray-700">
                          {item[key] != null ? String(item[key]) : '-'}
                        </td>
                      ))}
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
