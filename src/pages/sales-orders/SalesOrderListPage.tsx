import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2, Plus, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { PaginatedCombobox } from '@/components/dropdowns'
import { LIST_MODE_CONFIG, getStatusLabel } from '@/features/stock-out/modes'
import { useDebounce } from '@/hooks/useDebounce'
import { useBulkEscalate, usePackagingDetail, useStockOutDetail, useStockOutList } from '@/hooks/useStockOut'
import { KarjadeshView } from '@/pages/sales-orders/KarjadeshView'
import { SalesOrderChalaanModal } from '@/pages/sales-orders/SalesOrderChalaanModal'
import { SalesOrderInternalModal } from '@/pages/sales-orders/SalesOrderInternalModal'
import { SalesOrderStickerModal } from '@/pages/sales-orders/SalesOrderStickerModal'
import type { ListMode } from '@/types/stockOut'

type PackageDoneModalKind = 'invoice' | 'chalaan' | 'packing' | 'sticker'
type ActiveRowModal = { orderId: number; kind: 'view' | PackageDoneModalKind }

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

function formatOrderDate(value: string | null | undefined) {
  if (!value) return '—'

  const dateOnly = value.slice(0, 10)
  return dateOnly || '—'
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
  onPackageDoneAction?: (salesOrderId: number, action: PackageDoneModalKind) => void,
) {
  const returnTo = getListPath(mode)
  const normalizedStatus = String(currentStatus ?? '0')
  const viewButton = (
    <button
      type="button"
      onClick={() => onView(salesOrderId)}
      className={mode === 'package-done'
        ? 'action-view inline-flex items-center rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100'
        : 'action-view inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50'}
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
            className="action-update inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Edit
          </Link>
          <Link
            to={`/sales-orders/${salesOrderId}/review`}
            className="action-view inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Review
          </Link>
          <button
            type="button"
            onClick={() => onEscalate?.(salesOrderId)}
            className="action-select inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
              className="action-view inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Invoice
            </Link>
            <Link
              to={`/sales-orders/${salesOrderId}/package`}
              className="action-select inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
            className="action-view inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
              className="action-update inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Edit Pack
            </Link>
            <Link
              to={`/sales-orders/packing-print?orderId=${salesOrderId}`}
              className="action-view inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
            className="action-view inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Invoice
          </Link>
          <Link
            to={`/sales-orders/${salesOrderId}/package`}
            className="action-select inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Package
          </Link>
          {viewButton}
        </>
      )
    case 'package-done':
      return (
        <>
          {viewButton}
          <button
            type="button"
            onClick={() => onPackageDoneAction?.(salesOrderId, 'invoice')}
            className="inline-flex items-center rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100"
          >
            Invoice
          </button>
          <button
            type="button"
            onClick={() => onPackageDoneAction?.(salesOrderId, 'chalaan')}
            className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
          >
            Chalaan
          </button>
          <button
            type="button"
            onClick={() => onPackageDoneAction?.(salesOrderId, 'packing')}
            className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            Packing
          </button>
          <button
            type="button"
            onClick={() => onPackageDoneAction?.(salesOrderId, 'sticker')}
            className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
          >
            Sticker
          </button>
          <Link
            to={`/sales-orders/packing-print?orderId=${salesOrderId}`}
            className="action-view inline-flex items-center rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100"
          >
            Print
          </Link>
        </>
      )
    case 'admin-general':
      return (
        <>
          <Link
            to={`/sales-orders/admin/${salesOrderId}/edit`}
            state={{ returnTo }}
            className="action-update inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Sales
          </Link>
          <Link
            to={`/sales-orders/admin/${salesOrderId}/price-edit`}
            state={{ returnTo }}
            className="action-update inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Invoice
          </Link>
          <Link
            to={`/sales-orders/admin/packages/done/${salesOrderId}/edit`}
            state={{ returnTo }}
            className="action-update inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Package
          </Link>
        </>
      )
    case 'admin-pending-price':
      return (
        <Link
          to={`/sales-orders/admin/${salesOrderId}/price-edit`}
          state={{ returnTo }}
          className="action-update inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Invoice
        </Link>
      )
    case 'admin-limited-edit':
      return (
        <>
          <Link
            to={`/sales-orders/admin/${salesOrderId}/invoice-edit`}
            state={{ returnTo }}
            className="action-update inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
    case 'admin-general':
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
  const [activeModal, setActiveModal] = useState<ActiveRowModal | null>(null)
  const debouncedSearch = useDebounce(search, 300)
  const requiresSearch = mode === 'admin-general'
  const [hasSearched, setHasSearched] = useState(!requiresSearch)
  const { data, isLoading, isError, error } = useStockOutList(mode, {
    status,
    startDate,
    endDate,
    customerId,
  }, hasSearched)
  const activeModalKind = activeModal?.kind ?? null
  const activeOrderId = activeModal?.orderId ?? undefined
  const needsPackagingDetail = activeModalKind === 'chalaan' || activeModalKind === 'sticker'
  const { data: modalOrderDetail, isLoading: loadingModalOrder, error: modalOrderError } = useStockOutDetail(activeOrderId)
  const { data: packagingDetail, isLoading: loadingPackagingDetail, error: packagingDetailError } = usePackagingDetail(
    needsPackagingDetail ? activeOrderId : undefined,
  )
  const activeListRow = useMemo(
    () => (data ?? []).find((row) => row.soSystemId === activeOrderId),
    [activeOrderId, data],
  )
  const resolvedModalOrderDetail = useMemo(() => {
    if (!modalOrderDetail) return modalOrderDetail

    const general = modalOrderDetail.stockOutGeneralData
    const preferText = (
      primary: string | null | undefined,
      fallback: string | null | undefined,
    ) => primary?.trim() || fallback?.trim() || null

    return {
      ...modalOrderDetail,
      stockOutGeneralData: {
        ...general,
        customerName: preferText(general.customerName, activeListRow?.customerName),
        customerAddress: preferText(general.customerAddress, activeListRow?.customerAddress),
        supplierName: preferText(general.supplierName, activeListRow?.supplierName),
        supplierAddress: preferText(general.supplierAddress, activeListRow?.supplierAddress),
      },
    }
  }, [activeListRow, modalOrderDetail])

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
    setActiveModal(null)
    setSelectedIds(new Set())
    setConfirmEscalateId(null)
    setHasSearched(mode !== 'admin-general')
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps
  const showCheckboxes = mode === 'standard' && status === '0'

  const showCreateAction = mode === 'standard'
  const showActionColumn = true
  const showStatusColumn = mode !== 'admin-general' && mode !== 'admin-pending-price'
  const showFinalBillColumn = mode !== 'admin-general' && mode !== 'admin-pending-price' && mode !== 'package-done'
  const showOrderFromColumn = mode === 'admin-pending-price'

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

  const handleViewOrder = useCallback((id: number) => {
    setActiveModal({ orderId: id, kind: 'view' })
  }, [])

  const handlePackageDoneAction = useCallback((id: number, kind: PackageDoneModalKind) => {
    setActiveModal({ orderId: id, kind })
  }, [])

  const closeActiveModal = useCallback(() => {
    setActiveModal(null)
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
                className="action-select inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
              >
                {bulkEscalate.isPending && <Loader2 size={16} className="animate-spin" />}
                Escalate Selected ({selectedIds.size})
              </button>
            )}
            <Link to="/sales-orders/create" className="action-insert inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700">
              <Plus size={16} /> Create Sales Order
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_16rem_12rem_12rem]">
        {!requiresSearch && (
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
        )}

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

        {requiresSearch && (
          <button
            type="button"
            onClick={() => setHasSearched(true)}
            className="action-report inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 text-sm font-semibold text-white transition-colors hover:bg-gray-700 lg:col-span-1"
          >
            <Search size={15} />
            Search
          </button>
        )}
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
                  <th className={mode === 'package-done' ? 'px-4 py-3' : 'px-5 py-3'}>Order Date</th>
                  <th className="px-5 py-3">Partner</th>
                  <th className={mode === 'package-done' ? 'px-3 py-3' : 'px-5 py-3'}>Address</th>
                  <th className={mode === 'package-done' ? 'px-3 py-3' : 'px-5 py-3'}>Type</th>
                  {showOrderFromColumn && <th className="px-5 py-3">Order From</th>}
                  {showStatusColumn && <th className={mode === 'package-done' ? 'px-3 py-3' : 'px-5 py-3'}>Status</th>}
                  {showFinalBillColumn && <th className="px-5 py-3 text-right">Final Bill</th>}
                  {showActionColumn && <th className={mode === 'package-done' ? 'px-3 py-3 text-center' : 'px-5 py-3 text-center'}>Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5 + (showStatusColumn ? 1 : 0) + (showFinalBillColumn ? 1 : 0) + (showOrderFromColumn ? 1 : 0) + (showActionColumn ? 1 : 0) + (showCheckboxes ? 1 : 0)} className="px-5 py-12 text-center text-gray-400">
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
                      <td className={mode === 'package-done' ? 'px-4 py-3 whitespace-nowrap text-gray-700' : 'px-5 py-3 text-gray-700'}>
                        {formatOrderDate(row.invoiceDate)}
                      </td>
                      <td className="px-5 py-3 text-gray-700">{row.customerName ?? row.supplierName ?? '—'}</td>
                      <td className={mode === 'package-done' ? 'px-3 py-3 text-gray-600' : 'px-5 py-3 text-gray-600'}>
                        <span className={mode === 'package-done' ? 'block max-w-[10rem] whitespace-normal break-words text-xs leading-5' : undefined}>
                          {row.customerAddress ?? row.supplierAddress ?? '—'}
                        </span>
                      </td>
                      <td className={mode === 'package-done' ? 'px-3 py-3 text-xs text-gray-700' : 'px-5 py-3 text-gray-700'}>
                        <span className={mode === 'package-done' ? 'block max-w-[6.5rem] break-words leading-5' : undefined}>
                          {row.jobType ?? row.jobTypeName ?? '—'}
                        </span>
                      </td>
                      {showOrderFromColumn && <td className="px-5 py-3 text-gray-700">{row.soOrderFrom ?? '—'}</td>}
                      {showStatusColumn && (
                        <td className={mode === 'package-done' ? 'px-3 py-3' : 'px-5 py-3'}>
                          <span className={mode === 'package-done'
                            ? 'inline-flex max-w-[6.5rem] rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold leading-4 text-gray-700'
                            : 'inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700'}>
                            {row.currentStatusName ?? getStatusLabel(row.soCurrentStatus ?? row.currentStatus)}
                          </span>
                        </td>
                      )}
                      {showFinalBillColumn && <td className="px-5 py-3 text-right text-gray-700">{toCurrency(row.finalBill ?? row.calculatedBill)}</td>}
                      {showActionColumn && (
                        <td className={mode === 'package-done' ? 'px-3 py-3' : 'px-5 py-3'}>
                          <div className={mode === 'package-done' ? 'flex flex-wrap items-center justify-center gap-1.5' : 'flex items-center justify-center gap-2'}>
                            {renderRowActions(
                              mode,
                              row.soSystemId,
                              row.soCurrentStatus ?? row.currentStatus,
                              handleViewOrder,
                              handleRowEscalate,
                              handlePackageDoneAction,
                            )}
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
        isOpen={activeModalKind === 'view'}
        detail={resolvedModalOrderDetail}
        isLoading={loadingModalOrder}
        errorMessage={(modalOrderError as Error | undefined)?.message}
        showItemMetadata={mode === 'packaging' || mode === 'package-done'}
        onClose={closeActiveModal}
      />

      <SalesOrderInternalModal
        isOpen={activeModalKind === 'invoice'}
        detail={resolvedModalOrderDetail}
        isLoading={loadingModalOrder}
        errorMessage={(modalOrderError as Error | undefined)?.message}
        title="Invoice / Detail"
        viewVariant="packing-print"
        onClose={closeActiveModal}
      />

      <KarjadeshView
        isOpen={activeModalKind === 'packing'}
        detail={resolvedModalOrderDetail}
        isLoading={loadingModalOrder}
        errorMessage={(modalOrderError as Error | undefined)?.message}
        onClose={closeActiveModal}
      />

      <SalesOrderChalaanModal
        isOpen={activeModalKind === 'chalaan'}
        packagingDetail={packagingDetail}
        orderDetail={resolvedModalOrderDetail}
        isLoading={loadingModalOrder || loadingPackagingDetail}
        errorMessage={(packagingDetailError as Error | undefined)?.message ?? (modalOrderError as Error | undefined)?.message}
        onClose={closeActiveModal}
      />

      <SalesOrderStickerModal
        isOpen={activeModalKind === 'sticker'}
        packagingDetail={packagingDetail}
        orderDetail={resolvedModalOrderDetail}
        isLoading={loadingModalOrder || loadingPackagingDetail}
        errorMessage={(packagingDetailError as Error | undefined)?.message ?? (modalOrderError as Error | undefined)?.message}
        onClose={closeActiveModal}
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
                className="action-select inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
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
