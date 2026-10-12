// ============================================================
// Stock-In — Shared List Page (standard / confirm-qty / admin-approved / price-update)
// ============================================================
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Eye, Loader2, Plus, Search, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStockInList, useEscalateStockIn } from '@/hooks/useStockIn'
import { LIST_MODE_CONFIG } from '@/features/stock-in/modes'
import { ConfirmDialog } from '@/pages/stock-in/ConfirmDialog'
import { StockInViewModal } from '@/pages/stock-in/StockInViewModal'
import type { StockInListMode, StockInListRow } from '@/types/stockIn'

interface StockInListPageProps {
  mode?: StockInListMode
}

function getEditPath(mode: StockInListMode, id: number): string {
  switch (mode) {
    case 'price-update':
      return `/stock-in/${id}/price-edit`
    case 'admin-approved':
      return `/stock-in/admin/${id}/revert`
    case 'confirm-qty':
      return `/stock-in/${id}/confirm-qty`
    default:
      return `/stock-in/${id}/edit`
  }
}

function getEditLabel(mode: StockInListMode): string {
  switch (mode) {
    case 'price-update':
      return 'Update Price'
    case 'admin-approved':
      return 'Revert'
    case 'confirm-qty':
      return 'Confirm Qty'
    default:
      return 'Edit'
  }
}

function filterRows(rows: StockInListRow[], search: string): StockInListRow[] {
  if (!search.trim()) return rows
  const q = search.toLowerCase()
  return rows.filter(
    (r) =>
      r.siSystemNo?.toLowerCase().includes(q) ||
      r.siInvoiceNo?.toLowerCase().includes(q) ||
      r.supplierName?.toLowerCase().includes(q) ||
      r.customerName?.toLowerCase().includes(q) ||
      r.jobTypeName?.toLowerCase().includes(q) ||
      r.jobType?.toLowerCase().includes(q),
  )
}

function sortRowsNewestFirst(rows: StockInListRow[]): StockInListRow[] {
  return [...rows].sort((left, right) => {
    const systemIdDelta = Number(right.siSystemId ?? 0) - Number(left.siSystemId ?? 0)
    if (systemIdDelta !== 0) {
      return systemIdDelta
    }

    const rightDate = Date.parse(right.siInvoiceDate ?? '')
    const leftDate = Date.parse(left.siInvoiceDate ?? '')
    const safeRightDate = Number.isFinite(rightDate) ? rightDate : 0
    const safeLeftDate = Number.isFinite(leftDate) ? leftDate : 0
    if (safeRightDate !== safeLeftDate) {
      return safeRightDate - safeLeftDate
    }

    return (right.siSystemNo ?? '').localeCompare(left.siSystemNo ?? '')
  })
}

export function StockInListPage({ mode = 'standard' }: StockInListPageProps) {
  const config = LIST_MODE_CONFIG[mode]

  const [search, setSearch] = useState('')
  const listQuery = useStockInList(mode)
  const rows = listQuery.data ?? []

  const sortedRows = useMemo(
    () => sortRowsNewestFirst(rows ?? []),
    [rows],
  )

  const isLoading = listQuery.isLoading
  const isError = listQuery.isError
  function refetch() {
    void listQuery.refetch()
  }

  const escalateMutation = useEscalateStockIn()

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showEscalateConfirm, setShowEscalateConfirm] = useState(false)
  const [viewStockInId, setViewStockInId] = useState<number | null>(null)
  const [mutationError, setMutationError] = useState<string>()

  // Reset search when navigating between stock-in modes (e.g. standard → admin-approved)
  // Without this, a stale search term from a previous route causes "No orders found"
  // (same pattern as SalesOrderListPage)
  useEffect(() => {
    setSearch('')
    setSelectedIds(new Set())
    setViewStockInId(null)
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = filterRows(sortedRows, search)

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.siSystemId)))
    }
  }

  async function handleEscalate() {
    setMutationError(undefined)
    try {
      const ids = Array.from(selectedIds)
      const response = await escalateMutation.mutateAsync(ids)
      if ((response as { errMsg?: string })?.errMsg) {
        setMutationError((response as { errMsg: string }).errMsg)
        return
      }
      setSelectedIds(new Set())
      setShowEscalateConfirm(false)
      void refetch()
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Escalation failed.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{config.description}</p>
        </div>
        {mode === 'standard' && (
          <Link
            to="/stock-in/create"
            className="action-insert inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            <Plus className="h-4 w-4" />
            New Stock-In
          </Link>
        )}
      </div>

      {/* Search & Bulk Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SI no., invoice, supplier, customer…"
            className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
        {mode === 'standard' && (
          <button
            type="button"
            disabled={selectedIds.size === 0}
            onClick={() => setShowEscalateConfirm(true)}
            className="action-select inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            title={selectedIds.size === 0 ? 'Select one or more orders to escalate' : `Escalate ${selectedIds.size} order(s)`}
          >
            <Send className="h-4 w-4" />
            Escalate
            {selectedIds.size > 0 && (
              <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-semibold text-gray-700">
                {selectedIds.size}
              </span>
            )}
          </button>
        )}
      </div>

      {mutationError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {mutationError}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : isError ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <p className="text-sm font-medium">Failed to load orders.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="text-xs text-gray-500 underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  {mode === 'standard' && (
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && selectedIds.size === filtered.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3">SI No.</th>
                  <th className="px-4 py-3">Invoice No.</th>
                  <th className="px-4 py-3">Invoice Date</th>
                  <th className="px-4 py-3">Partner</th>
                  <th className="px-4 py-3">Order Type</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3 text-right">Final Bill</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={mode === 'standard' ? 9 : 8}
                      className="px-4 py-8 text-center text-sm text-gray-400"
                    >
                      No orders found.
                    </td>
                  </tr>
                )}
                {filtered.map((row) => (
                  <tr key={row.siSystemId} className="hover:bg-gray-50">
                    {mode === 'standard' && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.siSystemId)}
                          onChange={() => toggleSelect(row.siSystemId)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.siSystemNo ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.siInvoiceNo ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.siInvoiceDate?.slice(0, 10) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.supplierName ?? row.customerName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.jobTypeName ?? row.jobType ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.sourceChannelName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {row.sidFinalAmount != null ? row.sidFinalAmount.toFixed(4) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewStockInId(row.siSystemId)}
                          className="action-view inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        <Link
                          to={getEditPath(mode, row.siSystemId)}
                          className="action-update inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {getEditLabel(mode)}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Escalate Confirm Dialog */}
      <ConfirmDialog
        open={showEscalateConfirm}
        title="Escalate Stock-In Orders"
        message={`Submit ${selectedIds.size} selected order(s) to the operation team for quantity verification?`}
        confirmLabel="Yes, Escalate"
        cancelLabel="Cancel"
        onConfirm={handleEscalate}
        onCancel={() => setShowEscalateConfirm(false)}
        isLoading={escalateMutation.isPending}
      />

      <StockInViewModal stockInId={viewStockInId} onClose={() => setViewStockInId(null)} />
    </div>
  )
}
