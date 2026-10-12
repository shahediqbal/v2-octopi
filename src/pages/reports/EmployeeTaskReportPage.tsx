import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, ClipboardList, Database, FileSpreadsheet, Loader2, RefreshCw, Search } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { useEmployeeTaskSummary, useEmployeeTaskDetails } from '@/hooks/useEmployeeTask'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { EmployeeTaskFilters, EmployeeTaskDetailFlat } from '@/types/employeeTask'

function todayStr() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}
function firstDayOfMonth() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), '01'].join('-')
}
function fmtDateTime(value: string | null) {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtDateShort(value: string) {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
function fmtNum(value: number | null, decimals = 2) {
  if (value == null) return '-'
  return value.toLocaleString('en-BD', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

const SUMMARY_EXCEL_COLUMNS = [
  { key: 'employeeId', header: 'Employee ID', format: 'integer' as const },
  { key: 'employeeCode', header: 'Code' },
  { key: 'employeeFullName', header: 'Name' },
  { key: 'totalTasksAssigned', header: 'Total Assigned', format: 'integer' as const },
  { key: 'completedTasks', header: 'Completed', format: 'integer' as const },
  { key: 'pendingTasks', header: 'Pending', format: 'integer' as const },
  { key: 'completionRatePercentage', header: 'Completion %', format: 'number' as const },
  { key: 'eveningTaskCount', header: 'Evening Tasks', format: 'integer' as const },
  { key: 'eveningTaskPercentage', header: 'Evening %', format: 'number' as const },
  { key: 'avgAssignToStartMinutes', header: 'Avg Assign→Start (min)', format: 'number' as const },
  { key: 'avgTaskDurationMinutes', header: 'Avg Duration (min)', format: 'number' as const },
  { key: 'distinctTransportCount', header: 'Distinct Transport', format: 'integer' as const },
] as const

const DETAIL_EXCEL_COLUMNS = [
  { key: 'employeeId', header: 'Employee ID', format: 'integer' as const },
  { key: 'employeeCode', header: 'Code' },
  { key: 'employeeFullName', header: 'Name' },
  { key: 'taskId', header: 'Task ID', format: 'integer' as const },
  { key: 'taskDestination', header: 'Destination' },
  { key: 'soSystemNo', header: 'Invoice No' },
  { key: 'taskAssignTime', header: 'Assign Time', format: 'datetime' as const },
  { key: 'taskStartTime', header: 'Start Time', format: 'datetime' as const },
  { key: 'taskEndTime', header: 'End Time', format: 'datetime' as const },
  { key: 'movementTransportName', header: 'Transport' },
  { key: 'taskAssignToStartMinutes', header: 'Assign→Start (min)', format: 'number' as const },
  { key: 'taskDurationMinutes', header: 'Duration (min)', format: 'number' as const },
  { key: 'isCompleted', header: 'Completed' },
] as const

export function EmployeeTaskReportPage() {
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary')
  const [fromDate, setFromDate] = useState(firstDayOfMonth)
  const [toDate, setToDate] = useState(todayStr)
  const [employeeId, setEmployeeId] = useState<number | null>(null)
  const [employeeLabel, setEmployeeLabel] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadRequested, setLoadRequested] = useState(false)

  const filters: EmployeeTaskFilters = useMemo(
    () => ({ startDate: fromDate, endDate: toDate, employeeId: employeeId ?? 0 }),
    [fromDate, toDate, employeeId],
  )

  const {
    data: summaryData = [],
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErr,
    refetch: refetchSummary,
  } = useEmployeeTaskSummary(filters, loadRequested)

  const {
    data: detailsRaw = [],
    isLoading: detailsLoading,
    isError: detailsError,
    error: detailsErr,
    refetch: refetchDetails,
  } = useEmployeeTaskDetails(filters, loadRequested)

  // Flatten nested tasks
  const detailsData = useMemo<EmployeeTaskDetailFlat[]>(
    () =>
      detailsRaw.flatMap((emp) =>
        (emp.tasks ?? emp.Tasks ?? []).map((task) => ({
          ...task,
          employeeId: emp.employeeId,
          employeeCode: emp.employeeCode,
          employeeFullName: emp.employeeFullName,
        })),
      ),
    [detailsRaw],
  )

  useEffect(() => {
    if (activeTab === 'summary' && summaryData.length === 0 && detailsData.length > 0) {
      setActiveTab('details')
    }
  }, [activeTab, detailsData.length, summaryData.length])

  const dateError = useMemo(() => {
    if (!fromDate || !toDate) return 'Both dates are required'
    if (new Date(fromDate) > new Date(toDate)) return "'From' date cannot be after 'To' date"
    return ''
  }, [fromDate, toDate])

  const filteredSummary = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return summaryData
    return summaryData.filter(
      (item) =>
        item.employeeFullName?.toLowerCase().includes(q) ||
        item.employeeCode?.toLowerCase().includes(q),
    )
  }, [summaryData, searchTerm])

  const filteredDetails = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return detailsData
    return detailsData.filter(
      (item) =>
        item.employeeFullName?.toLowerCase().includes(q) ||
        item.taskDestination?.toLowerCase().includes(q) ||
        item.soSystemNo?.toLowerCase().includes(q) ||
        item.movementTransportName?.toLowerCase().includes(q),
    )
  }, [detailsData, searchTerm])

  // Summary stats
  const totalAssigned = useMemo(() => summaryData.reduce((s, i) => s + (i.totalTasksAssigned ?? 0), 0), [summaryData])
  const totalCompleted = useMemo(() => summaryData.reduce((s, i) => s + (i.completedTasks ?? 0), 0), [summaryData])
  const totalPending = useMemo(() => summaryData.reduce((s, i) => s + (i.pendingTasks ?? 0), 0), [summaryData])
  const avgCompletion = useMemo(() => {
    const rates = summaryData.map((i) => i.completionRatePercentage ?? 0)
    return rates.length > 0 ? rates.reduce((s, r) => s + r, 0) / rates.length : 0
  }, [summaryData])

  // Detail stats
  const detailCompleted = useMemo(() => detailsData.filter((i) => i.isCompleted === true).length, [detailsData])
  const detailPending = useMemo(() => detailsData.filter((i) => i.isCompleted !== true).length, [detailsData])
  const durations = useMemo(() => detailsData.map((i) => i.taskDurationMinutes ?? 0).filter((d) => d > 0), [detailsData])
  const avgDuration = useMemo(() => (durations.length > 0 ? durations.reduce((s, d) => s + d, 0) / durations.length : 0), [durations])

  const handleLoad = useCallback(() => {
    if (dateError) return
    setLoadRequested(true)
    void refetchSummary()
    void refetchDetails()
  }, [dateError, refetchSummary, refetchDetails])

  const handleExportSummary = useCallback(async () => {
    if (filteredSummary.length === 0) return
    await exportExcelOnDemand({
      fileName: `Employee_Task_Summary_${fromDate}_to_${toDate}`,
      title: 'Employee Task Summary',
      subtitle: `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
      sheetName: 'Summary',
      columns: [...SUMMARY_EXCEL_COLUMNS],
      data: filteredSummary as unknown as Record<string, unknown>[],
      filters: [
        ['Date Range', `${fmtDateShort(fromDate)} – ${fmtDateShort(toDate)}`],
        ['Employee', employeeLabel || 'All'],
      ],
      summaryCards: [
        ['Total Employees', summaryData.length],
        ['Total Assigned', totalAssigned],
        ['Total Completed', totalCompleted],
        ['Total Pending', totalPending],
        ['Avg Completion %', fmtNum(avgCompletion)],
      ],
    })
  }, [filteredSummary, fromDate, toDate, employeeLabel, summaryData.length, totalAssigned, totalCompleted, totalPending, avgCompletion])

  const handleExportDetails = useCallback(async () => {
    if (filteredDetails.length === 0) return
    await exportExcelOnDemand({
      fileName: `Employee_Task_Details_${fromDate}_to_${toDate}`,
      title: 'Employee Task Details',
      subtitle: `${fmtDateShort(fromDate)} to ${fmtDateShort(toDate)}`,
      sheetName: 'Details',
      columns: [...DETAIL_EXCEL_COLUMNS],
      data: filteredDetails as unknown as Record<string, unknown>[],
      filters: [
        ['Date Range', `${fmtDateShort(fromDate)} – ${fmtDateShort(toDate)}`],
        ['Employee', employeeLabel || 'All'],
      ],
      summaryCards: [
        ['Total Records', detailsData.length],
        ['Completed', detailCompleted],
        ['Pending', detailPending],
        ['Avg Duration (min)', fmtNum(avgDuration)],
      ],
    })
  }, [filteredDetails, fromDate, toDate, employeeLabel, detailsData.length, detailCompleted, detailPending, avgDuration])

  const isLoading = summaryLoading || detailsLoading
  const summaryNoData = summaryData.length === 0
  const hasAnyData = summaryData.length > 0 || detailsData.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Task Report</h1>
        <p className="mt-1 text-sm text-gray-500">View employee task assignments, completion rates, and detailed activity.</p>
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
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Employee</label>
            <PaginatedCombobox type="employee" value={employeeId} onValueChange={(v, l) => { setEmployeeId(v); setEmployeeLabel(l ?? null); setLoadRequested(false) }} placeholder="All Employees" />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Employee, destination…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputCls} pl-8`} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!hasAnyData ? (
              <button onClick={handleLoad} disabled={isLoading || !!dateError} className="action-report inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? 'Loading…' : 'Load Data'}
              </button>
            ) : (
              <>
                <button
                  onClick={activeTab === 'summary' ? handleExportSummary : handleExportDetails}
                  disabled={activeTab === 'summary' ? filteredSummary.length === 0 : filteredDetails.length === 0}
                  className="action-report inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
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
        {summaryError && <div className="mx-4 my-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"><AlertCircle size={14} /> {(summaryErr as Error)?.message ?? 'Failed to load summary'}</div>}
        {detailsError && <div className="mx-4 my-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"><AlertCircle size={14} /> {(detailsErr as Error)?.message ?? 'Failed to load details'}</div>}

        {!isLoading && !hasAnyData && !loadRequested && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"><ClipboardList size={28} /></div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Loaded</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">Select filters and click Load Data.</p>
          </div>
        )}
        {!isLoading && loadRequested && !hasAnyData && !summaryError && !detailsError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"><Database size={28} /></div>
            <h2 className="text-lg font-semibold text-gray-900">No Records Found</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">No employee task records found for the selected filters.</p>
          </div>
        )}

        {hasAnyData && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-4">
              <button
                onClick={() => setActiveTab('summary')}
                className={`mr-4 border-b-2 py-2.5 text-sm font-medium transition-colors ${activeTab === 'summary' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Summary ({summaryData.length})
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`mr-4 border-b-2 py-2.5 text-sm font-medium transition-colors ${activeTab === 'details' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Details ({detailsData.length})
              </button>
            </div>

            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <>
                {summaryData.length > 0 && (
                  <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                      <StatCard label="Total Employees" value={String(summaryData.length)} />
                      <StatCard label="Total Assigned" value={String(totalAssigned)} />
                      <StatCard label="Completed" value={String(totalCompleted)} />
                      <StatCard label="Pending" value={String(totalPending)} />
                      <StatCard label="Avg Completion %" value={`${fmtNum(avgCompletion, 1)}%`} accent />
                    </div>
                  </div>
                )}
                <div className="max-h-[calc(100vh-420px)] overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Employee</th>
                        <th className="px-4 py-3 font-semibold text-right">Assigned</th>
                        <th className="px-4 py-3 font-semibold text-right">Completed</th>
                        <th className="px-4 py-3 font-semibold text-right">Pending</th>
                        <th className="px-4 py-3 font-semibold text-right">Completion %</th>
                        <th className="px-4 py-3 font-semibold text-right">Evening</th>
                        <th className="px-4 py-3 font-semibold text-right">Avg Start (min)</th>
                        <th className="px-4 py-3 font-semibold text-right">Avg Duration (min)</th>
                        <th className="px-4 py-3 font-semibold text-right">Transport</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSummary.length === 0 ? (
                        <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">No records match your search</td></tr>
                      ) : (
                        filteredSummary.map((item, idx) => (
                          <tr key={idx} className="transition-colors hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-700">
                              <div className="font-medium">{item.employeeFullName || '-'}</div>
                              {item.employeeCode && <div className="text-xs text-gray-400">{item.employeeCode}</div>}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">{item.totalTasksAssigned ?? '-'}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">{item.completedTasks ?? '-'}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-amber-700">{item.pendingTasks ?? '-'}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-gray-900">
                              {item.completionRatePercentage != null ? `${fmtNum(item.completionRatePercentage, 1)}%` : '-'}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{item.eveningTaskCount ?? '-'}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{item.avgAssignToStartMinutes != null ? fmtNum(item.avgAssignToStartMinutes, 1) : '-'}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{item.avgTaskDurationMinutes != null ? fmtNum(item.avgTaskDurationMinutes, 1) : '-'}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{item.distinctTransportCount ?? '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <>
                {detailsData.length > 0 && (
                  <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <StatCard label="Total Records" value={String(detailsData.length)} />
                      <StatCard label="Completed" value={String(detailCompleted)} />
                      <StatCard label="Pending" value={String(detailPending)} />
                      <StatCard label="Avg Duration (min)" value={fmtNum(avgDuration, 1)} accent />
                    </div>
                  </div>
                )}
                <div className="max-h-[calc(100vh-420px)] overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Employee</th>
                        <th className="px-4 py-3 font-semibold">Task ID</th>
                        <th className="px-4 py-3 font-semibold">Destination</th>
                        <th className="px-4 py-3 font-semibold">Invoice No</th>
                        <th className="px-4 py-3 font-semibold">Assign Time</th>
                        <th className="px-4 py-3 font-semibold">Start Time</th>
                        <th className="px-4 py-3 font-semibold">End Time</th>
                        <th className="px-4 py-3 font-semibold">Transport</th>
                        <th className="px-4 py-3 font-semibold text-right">Start (min)</th>
                        <th className="px-4 py-3 font-semibold text-right">Duration (min)</th>
                        <th className="px-4 py-3 font-semibold">Done?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredDetails.length === 0 ? (
                        <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400">No records match your search</td></tr>
                      ) : (
                        filteredDetails.map((item, idx) => (
                          <tr key={idx} className="transition-colors hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-700">
                              <div className="font-medium">{item.employeeFullName}</div>
                              {item.employeeCode && <div className="text-xs text-gray-400">{item.employeeCode}</div>}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums text-gray-600">{item.taskId ?? '-'}</td>
                            <td className="px-4 py-2.5 text-gray-700">{item.taskDestination || '-'}</td>
                            <td className="px-4 py-2.5 text-gray-600">{item.soSystemNo || '-'}</td>
                            <td className="px-4 py-2.5 text-xs text-gray-500">{fmtDateTime(item.taskAssignTime)}</td>
                            <td className="px-4 py-2.5 text-xs text-gray-500">{fmtDateTime(item.taskStartTime)}</td>
                            <td className="px-4 py-2.5 text-xs text-gray-500">{fmtDateTime(item.taskEndTime)}</td>
                            <td className="px-4 py-2.5 text-gray-600">{item.movementTransportName || '-'}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{item.taskAssignToStartMinutes != null ? fmtNum(item.taskAssignToStartMinutes, 0) : '-'}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{item.taskDurationMinutes != null ? fmtNum(item.taskDurationMinutes, 0) : '-'}</td>
                            <td className="px-4 py-2.5">
                              {item.isCompleted === true ? (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Yes</span>
                              ) : (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">No</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
              <p className="text-xs text-gray-500">
                {activeTab === 'summary'
                  ? `Showing ${filteredSummary.length} of ${summaryData.length} employees`
                  : `Showing ${filteredDetails.length} of ${detailsData.length} task records`}
              </p>
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
