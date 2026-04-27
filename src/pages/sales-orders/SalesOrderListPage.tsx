import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2, Plus, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { PaginatedCombobox } from '@/components/dropdowns'
import { LIST_MODE_CONFIG, getStatusLabel } from '@/features/stock-out/modes'
import { useDebounce } from '@/hooks/useDebounce'
import { useStockOutDetail, useStockOutList, useBulkEscalate } from '@/hooks/useStockOut'
import { SalesOrderInternalModal } from '@/pages/sales-orders/SalesOrderInternalModal'
import type { ListMode } from '@/types/stockOut'

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

function toCurrency(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0)
  if (Number.isNaN(numeric)) {
    return '0.0000'
  }

  return numeric.toFixed(4)
}

interface SalesOrderListPageProps {
  mode?: ListMode
}

function getListPath(mode: ListMode) {
  switch (mode) {
    case 'escalation':
      return '/sales-orders/escalations'
    case 'packaging':
      return '/sales-orders/packages'
    case 'package-done':
      return '/sales-orders/packages/done'
    case 'admin-general':
      return '/sales-orders/admin/general'
    case 'admin-pending-price':
      return '/sales-orders/admin/pending-price'
    case 'admin-limited-edit':
      return '/sales-orders/admin/limited-edit'
    default:
      return '/sales-orders'
  }
}

function renderRowActions(
  mode: ListMode,
  salesOrderId: number,
  currentStatus: number | string | null | undefined,
  onView: (salesOrderId: number) => void,
  onEscalate?: (salesOrderId: number) => void,
) {
  const returnTo = getListPath(mode)
  const normalizedStatus = String(currentStatus ?? '0')
  const viewButton = (
    <button
      type="button"
      onClick={() => onView(salesOrderId)}
      className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
    >
      View
    </button>
  )

  switch (mode) {
    case 'standard':
      return (
        <>
          <Link
            to={`/sales-orders/${salesOrderId}/edit`}
            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Edit
          </Link>
          <Link
            to={`/sales-orders/${salesOrderId}/review`}
            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Review
          </Link>
          <button
            type="button"
            onClick={() => onEscalate?.(salesOrderId)}
            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Escalate
          </button>
          {viewButton}
        </>
      )
    case 'escalation':
      if (normalizedStatus === '2') {
        return (
          <>
            <Link
              to={`/sales-orders/${salesOrderId}/escalate`}
              className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Invoice
            </Link>
            <Link
              to={`/sales-orders/${salesOrderId}/package`}
              className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Package
            </Link>
            {viewButton}
          </>
        )
      }
      return (
        <>
          <Link
            to={`/sales-orders/${salesOrderId}/escalate`}
            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Invoice
          </Link>
          {viewButton}
        </>
      )
    case 'packaging':
      if (normalizedStatus === '3') {
        return (
          <>
            <Link
              to={`/sales-orders/packages/done/${salesOrderId}/edit`}
              className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Edit Pack
            </Link>
            <Link
              to={`/sales-orders/packing-print?orderId=${salesOrderId}`}
              className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Print
            </Link>
            {viewButton}
          </>
        )
      }
      return (
        <>
          <Link
            to={`/sales-orders/${salesOrderId}/escalate`}
            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Invoice
          </Link>
          <Link
            to={`/sales-orders/${salesOrderId}/package`}
            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Package
          </Link>
          {viewButton}
        </>
      )
    case 'package-done':
      return (
        <>
          <Link
            to={`/sales-orders/packing-print?orderId=${salesOrderId}`}
            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Print
          </Link>
          {viewButton}
        </>
      )
    case 'admin-general':
      return (
        <>
          <Link
            to={`/sales-orders/admin/${salesOrderId}/edit`}
            state={{ returnTo }}
            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Sales
          </Link>
          <Link
            to={`/sales-orders/admin/${salesOrderId}/price-edit`}
            state={{ returnTo }}
            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Invoice
          </Link>
          {normalizedStatus === '3' && (
            <Link
              to={`/sales-orders/admin/packages/done/${salesOrderId}/edit`}
              state={{ returnTo }}
              className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Package
            </Link>
          )}
          {normalizedStatus === '3' && (
            <Link
              to={`/sales-orders/packing-print?orderId=${salesOrderId}`}
              className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Print
            </Link>
          )}
          {viewButton}
        </>
      )
    case 'admin-pending-price':
      return (
        <>
          <Link
            to={`/sales-orders/admin/${salesOrderId}/price-edit`}
            state={{ returnTo }}
            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Invoice
          </Link>
          {viewButton}
        </>
      )
    case 'admin-limited-edit':
      return (
        <>
          <Link
            to={`/sales-orders/admin/${salesOrderId}/invoice-edit`}
            state={{ returnTo }}
            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Invoice
          </Link>
          {viewButton}
        </>
      )
    default:
      return null
  }
}

function getInitialStatus(mode: ListMode) {
  switch (mode) {
    case 'escalation':
      return '1'
    case 'packaging':
      return '2'
    case 'package-done':
      return '3'
    default:
      return '0'
  }
}

function getInitialDate(mode: ListMode) {
  switch (mode) {
    case 'admin-general':
    case 'admin-limited-edit':
    case 'package-done':
      return todayInput()
    default:
      return ''
  }
}

export function SalesOrderListPage({ mode = 'standard' }: SalesOrderListPageProps) {
  const config = LIST_MODE_CONFIG[mode]
  const location = useLocation()
  const locationDefaultStatus = (location.state as { defaultStatus?: string } | null)?.defaultStatus
  const [status, setStatus] = useState(locationDefaultStatus ?? getInitialStatus(mode))
  const [search, setSearch] = useState('')
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [startDate, setStartDate] = useState(getInitialDate(mode))
  const [endDate, setEndDate] = useState(getInitialDate(mode))
  const [viewOrderId, setViewOrderId] = useState<number | null>(null)
  const debouncedSearch = useDebounce(search, 300)
  const { data, isLoading, isError, error } = useStockOutList(mode, {
    status,
    startDate,
    endDate,
    customerId,
  })
  const { data: viewDetail, isLoading: loadingView, error: viewError } = useStockOutDetail(viewOrderId ?? undefined)

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [confirmEscalateId, setConfirmEscalateId] = useState<number | null>(null)
  const bulkEscalate = useBulkEscalate()

  // React Router v6 reuses this component across sibling routes (same outlet position,
  // same component type). When the user navigates between /sales-orders,
  // /sales-orders/escalations, and /sales-orders/packages, React updates the `mode`
  // prop but does NOT reinitialize useState. This effect resets all filters to the
  // correct mode-specific defaults whenever `mode` changes.
  useEffect(() => {
    setStatus(getInitialStatus(mode))
    setSearch('')
    setCustomerId(null)
    setStartDate(getInitialDate(mode))
    setEndDate(getInitialDate(mode))
    setViewOrderId(null)
    setSelectedIds(new Set())
    setConfirmEscalateId(null)
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps
  const showCheckboxes = mode === 'standard' && status === '0'

  const showCreateAction = mode === 'standard'
  const showActionColumn = true

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback((allIds: number[]) => {
    setSelectedIds((prev) => {
      if (prev.size === allIds.length) return new Set()
      return new Set(allIds)
    })
  }, [])

  const handleRowEscalate = useCallback((id: number) => {
    setConfirmEscalateId(id)
  }, [])

  const handleConfirmEscalate = useCallback(async () => {
    if (confirmEscalateId === null) return
    try {
      await bulkEscalate.mutateAsync([confirmEscalateId])
      setConfirmEscalateId(null)
    } catch {
      // Error handled by TanStack Query
    }
  }, [confirmEscalateId, bulkEscalate])

  const handleBulkEscalate = useCallback(async () => {
    if (selectedIds.size === 0) return
    if (!window.confirm(`Are you sure you want to escalate ${selectedIds.size} order(s)? This data will be sent to the operation team.`)) return

    try {
      await bulkEscalate.mutateAsync(Array.from(selectedIds))
      setSelectedIds(new Set())
    } catch {
      // Error handled by TanStack Query
    }
  }, [selectedIds, bulkEscalate])

  const filteredRows = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    if (!query) {
      return data ?? []
    }

    return (data ?? []).filter((row) => {
      const haystack = [
        row.soSystemNo,
        row.customerName,
        row.supplierName,
        row.customerAddress,
        row.jobType,
        row.jobTypeName,
        row.soCustomerReferance,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [data, debouncedSearch])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{config.description}</p>
        </div>

        {showCreateAction && (
          <div className="flex items-center gap-3">
            {showCheckboxes && selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleBulkEscalate}
                disabled={bulkEscalate.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
              >
                {bulkEscalate.isPending && <Loader2 size={16} className="animate-spin" />}
                Escalate Selected ({selectedIds.size})
              </button>
            )}
            <Link to="/sales-orders/create" className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700">
              <Plus size={16} /> Create Sales Order
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_16rem_12rem_12rem]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order no, customer, supplier, type..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <PaginatedCombobox type="customer" value={customerId} onValueChange={setCustomerId} placeholder="Filter customer..." />

        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />

        <input
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      {config.tabs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {config.tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={status === tab.value
                ? 'rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50'}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading sales orders…</span>
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load sales orders</p>
            <p className="mt-1 text-xs text-red-600">{(error as Error)?.message}</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  {showCheckboxes && (
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                        checked={filteredRows.length > 0 && selectedIds.size === filteredRows.length}
                        onChange={() => toggleAll(filteredRows.map((r) => r.soSystemId))}
                      />
                    </th>
                  )}
                  <th className="px-5 py-3">Order No</th>
                  <th className="px-5 py-3">Order Date</th>
                  <th className="px-5 py-3">Partner</th>
                  <th className="px-5 py-3">Address</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Final Bill</th>
                  {showActionColumn && <th className="px-5 py-3 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={(showActionColumn ? 8 : 7) + (showCheckboxes ? 1 : 0)} className="px-5 py-12 text-center text-gray-400">
                      {debouncedSearch || customerId || startDate || endDate ? 'No matching sales orders found.' : 'No sales orders available for this status.'}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.soSystemId} className="transition-colors hover:bg-gray-50/60">
                      {showCheckboxes && (
                        <td className="w-10 px-3 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                            checked={selectedIds.has(row.soSystemId)}
                            onChange={() => toggleSelection(row.soSystemId)}
                          />
                        </td>
                      )}
                      <td className="px-5 py-3 font-medium text-gray-900">{row.soSystemNo ?? row.soSystemId}</td>
                      <td className="px-5 py-3 text-gray-700">{row.invoiceDate ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-700">{row.customerName ?? row.supplierName ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{row.customerAddress ?? row.supplierAddress ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-700">{row.jobType ?? row.jobTypeName ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                          {row.currentStatusName ?? getStatusLabel(row.soCurrentStatus ?? row.currentStatus)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">{toCurrency(row.finalBill ?? row.calculatedBill)}</td>
                      {showActionColumn && (
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {renderRowActions(mode, row.soSystemId, row.soCurrentStatus ?? row.currentStatus, setViewOrderId, handleRowEscalate)}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SalesOrderInternalModal
        isOpen={viewOrderId !== null}
        detail={viewDetail}
        isLoading={loadingView}
        errorMessage={(viewError as Error | undefined)?.message}
        onClose={() => setViewOrderId(null)}
      />

      {confirmEscalateId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-base font-semibold text-gray-900">Escalate Order</h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to escalate this order? This data will be sent to the operation team.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmEscalateId(null)}
                disabled={bulkEscalate.isPending}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEscalate}
                disabled={bulkEscalate.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
              >
                {bulkEscalate.isPending && <Loader2 size={14} className="animate-spin" />}
                Escalate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}