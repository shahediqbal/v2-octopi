import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Edit2, Loader2, RefreshCw, Search } from 'lucide-react'
import { useStockOutList } from '@/hooks/useStockOut'
import type { StockOutListRow } from '@/types/stockOut'

// ─────────────────────────────────────────────────────────────────────────────
// Order type tabs — mirrors legacy ORDER_TYPES in UnAssignedTask.js
// ─────────────────────────────────────────────────────────────────────────────

const ORDER_TABS = [
  { status: '3', label: 'Unassigned' },
  { status: '0', label: 'Incomplete' },
  { status: '2', label: 'Packaging' },
  { status: '1', label: 'Invoice' },
] as const

type TabStatus = (typeof ORDER_TABS)[number]['status']

export function TaskAssignListPage() {
  const navigate = useNavigate()
  const [selectedTab, setSelectedTab] = useState<TabStatus>('3')
  const [search, setSearch] = useState('')

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useStockOutList('standard', { status: selectedTab })

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) =>
      [
        row.soSystemNo,
        row.jobType ?? row.jobTypeName,
        row.customerName,
        row.supplierName,
        row.customerAddress,
        row.currentStatusName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [rows, search])

  function handleAssign(row: StockOutListRow) {
    navigate(`/sales-orders/${row.soSystemId}/assign-task`)
  }

  function handleEdit(row: StockOutListRow) {
    navigate(`/sales-orders/${row.soSystemId}/edit`)
  }

  /** Whether the active tab shows an action column */
  const hasActionCol = selectedTab === '3' || selectedTab === '0' || selectedTab === '2'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Task Assign</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review sales orders and assign tasks to employees. Switch between order types using the tabs below.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
        {ORDER_TABS.map((tab) => (
          <button
            key={tab.status}
            type="button"
            onClick={() => {
              setSelectedTab(tab.status)
              setSearch('')
            }}
            className={
              selectedTab === tab.status
                ? 'rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[14rem] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice, customer, status…"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error instanceof Error ? error.message : 'Failed to load orders. Please refresh.'}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {hasActionCol && (
                  <th className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Invoice No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Order Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Customer / Supplier
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={hasActionCol ? 7 : 6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-sm">Loading orders…</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={hasActionCol ? 7 : 6} className="py-16 text-center text-sm text-gray-400">
                    {search ? 'No orders match your search.' : 'No orders found.'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.soSystemId}
                    className="transition-colors hover:bg-gray-50"
                  >
                    {selectedTab === '3' && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleAssign(row)}
                          className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                          Assign
                        </button>
                      </td>
                    )}
                    {(selectedTab === '0' || selectedTab === '2') && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(row)}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </td>
                    )}
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {row.soSystemId}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.soSystemNo ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.jobType ?? row.jobTypeName ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {row.currentStatusName ? (
                        <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {row.currentStatusName}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.customerName ?? row.supplierName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.customerAddress ?? row.supplierAddress ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!isLoading && filteredRows.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
            {filteredRows.length} {filteredRows.length === 1 ? 'order' : 'orders'}
            {search && rows.length !== filteredRows.length && ` (filtered from ${rows.length})`}
          </div>
        )}
      </div>
    </div>
  )
}
