import { useCallback, useMemo, useState } from 'react'
import {
  AlertCircle,
  Eye,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  Tags,
} from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { usePackingPrintGrid } from '@/hooks/usePackingPrint'
import { usePackagingDetail, useStockOutDetail } from '@/hooks/useStockOut'
import { KarjadeshView } from '@/pages/sales-orders/KarjadeshView'
import { SalesOrderChalaanModal } from '@/pages/sales-orders/SalesOrderChalaanModal'
import { SalesOrderInternalModal } from '@/pages/sales-orders/SalesOrderInternalModal'
import { SalesOrderStickerModal } from '@/pages/sales-orders/SalesOrderStickerModal'
import type { PackingPrintFilters } from '@/types/packingPrint'

/* ─── Helpers ─── */
function todayStr() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}
function fmtDate(v: string | null) {
  if (!v) return '-'
  const d = new Date(v)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

type ModalKind = 'view' | 'sticker' | 'packing' | 'karjadesh' | null

export function PackingPrintPanelPage() {
  const [fromDate, setFromDate] = useState(todayStr)
  const [toDate, setToDate] = useState(todayStr)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [activeModal, setActiveModal] = useState<ModalKind>(null)

  const filters: PackingPrintFilters = useMemo(
    () => ({ currentStatus: 3, startDate: fromDate, endDate: toDate, customerId: customerId ?? 0 }),
    [fromDate, toDate, customerId],
  )

  const dateError = useMemo(() => {
    if (!fromDate || !toDate) return 'Both dates are required.'
    if (fromDate > toDate) return 'From date must be before To date.'
    return null
  }, [fromDate, toDate])

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
    refetch,
  } = usePackingPrintGrid(filters, true)

  /* Load detail data only when a modal is open */
  const detailEnabled = selectedId != null
  const { data: orderDetail, isLoading: detailLoading, error: detailError } = useStockOutDetail(
    detailEnabled ? (selectedId ?? undefined) : undefined,
  )
  const { data: packagingDetail, isLoading: packLoading, error: packError } = usePackagingDetail(
    detailEnabled ? (selectedId ?? undefined) : undefined,
  )

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(
      (r) =>
        r.soSystemNo?.toLowerCase().includes(q) ||
        r.customerName?.toLowerCase().includes(q) ||
        r.supplierName?.toLowerCase().includes(q),
    )
  }, [rows, search])

  const handleLoad = useCallback(() => {
    if (dateError) return
    void refetch()
  }, [dateError, refetch])

  const openModal = (id: number, kind: ModalKind) => {
    setSelectedId(id)
    setActiveModal(kind)
  }
  const closeModal = () => {
    setActiveModal(null)
    setSelectedId(null)
  }

  const modalLoading = detailLoading || packLoading
  const modalError =
    detailError
      ? (detailError as Error).message
      : packError
        ? (packError as Error).message
        : undefined

  return (
    <div className="space-y-6">
      {/* ── Header + Filters ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
          <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
            <Printer size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Packing Print Panel</h2>
            <p className="mt-1 text-sm text-gray-500">
              Browse packed orders and print invoice, sticker, chalaan, or packing list.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value) }}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value) }}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className="text-xs font-medium text-gray-500">Customer</label>
            <PaginatedCombobox
              type="customer"
              value={customerId}
              onValueChange={(id) => { setCustomerId(id) }}
              placeholder="All Customers"
            />
          </div>
          <button
            type="button"
            onClick={handleLoad}
            disabled={!!dateError}
            className="action-report inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Search
          </button>
          <button
            type="button"
            onClick={() => { setFromDate(todayStr()); setToDate(todayStr()); setCustomerId(null); setSearch('') }}
            className="action-report inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={15} /> Reset
          </button>
        </div>
        {dateError && <p className="mt-2 text-xs text-red-600">{dateError}</p>}
      </div>

      {/* ── Error ── */}
      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={16} />
          {(error as Error)?.message ?? 'Failed to load data.'}
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading orders…</span>
        </div>
      )}

      {/* ── Results ── */}
      {!isLoading && !isError && (
        <div className="space-y-3">
          {/* Search + count */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
            <p className="text-xs text-gray-500">{filteredRows.length} of {rows.length} orders</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            {filteredRows.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">No orders found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">Order No</th>
                    <th className="px-4 py-3">Order Date</th>
                    <th className="px-4 py-3">Customer / Supplier</th>
                    <th className="px-4 py-3">Address</th>
                    <th className="px-4 py-3">Order Type</th>
                    <th className="px-4 py-3">Order From</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRows.map((row, i) => {
                    const partner = row.customerName ?? row.supplierName ?? '-'
                    const address = row.customerAddress ?? row.supplierAddress ?? '-'
                    const id = row.soSystemId ?? 0
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{row.soSystemNo ?? '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{fmtDate(row.invoiceDate)}</td>
                        <td className="px-4 py-2.5 text-gray-900">{partner}</td>
                        <td className="px-4 py-2.5 max-w-[160px] truncate text-gray-600">{address}</td>
                        <td className="px-4 py-2.5 text-gray-600">{row.jobType ?? '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{row.soOrderFrom ?? '-'}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <ActionBtn
                              icon={<Eye size={13} />}
                              title="View Invoice"
                              onClick={() => openModal(id, 'view')}
                            />
                            <ActionBtn
                              icon={<Tags size={13} />}
                              title="Sticker"
                              onClick={() => openModal(id, 'sticker')}
                            />
                            <ActionBtn
                              icon={<FileText size={13} />}
                              title="Packing List"
                              onClick={() => openModal(id, 'packing')}
                            />
                            <ActionBtn
                              icon={<Printer size={13} />}
                              title="Karjadesh"
                              onClick={() => openModal(id, 'karjadesh')}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <SalesOrderInternalModal
        isOpen={activeModal === 'view'}
        detail={orderDetail}
        isLoading={activeModal === 'view' && modalLoading}
        errorMessage={activeModal === 'view' ? modalError : undefined}
        onClose={closeModal}
      />
      <SalesOrderStickerModal
        isOpen={activeModal === 'sticker'}
        packagingDetail={packagingDetail}
        orderDetail={orderDetail}
        isLoading={activeModal === 'sticker' && modalLoading}
        errorMessage={activeModal === 'sticker' ? modalError : undefined}
        onClose={closeModal}
      />
      <SalesOrderChalaanModal
        isOpen={activeModal === 'packing'}
        packagingDetail={packagingDetail}
        orderDetail={orderDetail}
        isLoading={activeModal === 'packing' && modalLoading}
        errorMessage={activeModal === 'packing' ? modalError : undefined}
        onClose={closeModal}
      />
      <KarjadeshView
        isOpen={activeModal === 'karjadesh'}
        detail={orderDetail}
        isLoading={activeModal === 'karjadesh' && modalLoading}
        errorMessage={activeModal === 'karjadesh' ? modalError : undefined}
        onClose={closeModal}
      />
    </div>
  )
}

/* ─── Shared helpers ─── */
const inputCls =
  'block rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none'

function ActionBtn({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    >
      {icon}
    </button>
  )
}
