import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Edit2, Loader2, RefreshCw, Search } from 'lucide-react'
import { useAssignedTaskList } from '@/hooks/useTask'
import type { AssignedTaskListRow } from '@/types/task'

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export function AssignedTaskListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAssignedTaskList()

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row: AssignedTaskListRow) =>
      [
        String(row.taskId),
        row.taskName,
        row.empFirstName,
        row.empLastName,
        `${row.empFirstName ?? ''} ${row.empLastName ?? ''}`,
        row.taskDestination,
        row.taskDestinationAddress,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [rows, search])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assigned Tasks</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and edit tasks that have been assigned to employees.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by task, employee, destination…"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error instanceof Error ? error.message : 'Failed to load assigned tasks. Please refresh.'}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Task ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Task Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Assigned To
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Destination
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Address
                </th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading assigned tasks…
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                    {search ? 'No tasks match your search.' : 'No assigned tasks found.'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row: AssignedTaskListRow) => (
                  <tr key={row.taskId} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">
                      {row.taskId}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.taskName ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {row.empFirstName || row.empLastName
                        ? `${row.empFirstName ?? ''} ${row.empLastName ?? ''}`.trim()
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.taskDestination ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{row.taskDestinationAddress ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/sales-orders/tasks/${row.taskId}/edit`)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer row count */}
        {!isLoading && filteredRows.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
            {filteredRows.length} task{filteredRows.length !== 1 ? 's' : ''}
            {search && rows.length !== filteredRows.length && ` (filtered from ${rows.length})`}
          </div>
        )}
      </div>
    </div>
  )
}
