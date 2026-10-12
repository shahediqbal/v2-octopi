import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Trash2,
  Link,
  Package,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'
import { usePiList, useDeletePi, useEscalatePi } from '@/hooks/useLcTracking'
import { useToastStore } from '@/stores/toastStore'
import { formatDate } from '@/lib/utils'
import { PiDetailModal } from './PiDetailModal'

export function PiListPage() {
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)

  // Single-row checkbox selection (matches legacy behaviour)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Track escalated IDs locally so button disables immediately (matches legacy escalatedRows)
  const [escalatedIds, setEscalatedIds] = useState<Set<number>>(new Set())

  // Modals & dialogs
  const [viewId, setViewId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; piId: number | null }>({
    open: false,
    piId: null,
  })
  const [confirmEscalate, setConfirmEscalate] = useState<{ open: boolean; piId: number | null }>({
    open: false,
    piId: null,
  })
  const [errorPopup, setErrorPopup] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  })
  const [selectionError, setSelectionError] = useState(false)

  // Pagination (legacy: 10 / 25 / 50, default 25)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')

  const { data: piList = [], isLoading, isError } = usePiList()
  const deleteMutation = useDeletePi()
  const escalateMutation = useEscalatePi()

  /** True when any other PI lists this piSystemId as its piNumberMapped */
  const isBasePI = (piSystemId: number) =>
    piList.some(
      (pi) =>
        pi.piNumberMapped === String(piSystemId) ||
        (pi.piNumberMapped as unknown as number) === piSystemId,
    )

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return piList
    }

    return piList.filter((pi) => {
      const fields = [
        pi.piSystemId,
        pi.piNumber,
        pi.piRef,
        pi.piDate,
        pi.piDate ? formatDate(pi.piDate) : '',
        pi.piCustmomerId,
        pi.customerName,
      ]

      return fields.some((field) => String(field ?? '').toLowerCase().includes(query))
    })
  }, [piList, search])

  const totalRows = filteredRows.length
  const totalPages = Math.ceil(totalRows / pageSize) || 1
  const paginatedRows = useMemo(
    () => filteredRows.slice(page * pageSize, page * pageSize + pageSize),
    [filteredRows, page, pageSize],
  )

  useEffect(() => {
    const lastPage = Math.max(totalPages - 1, 0)
    if (page > lastPage) {
      setPage(lastPage)
    }
  }, [page, totalPages])

  useEffect(() => {
    if (selectedId !== null && !filteredRows.some((pi) => pi.piSystemId === selectedId)) {
      setSelectedId(null)
    }
  }, [filteredRows, selectedId])

  const handleToggleSelect = (id: number) =>
    setSelectedId((prev) => (prev === id ? null : id))

  const handleEdit = () => {
    if (selectedId === null) {
      setSelectionError(true)
      return
    }
    navigate(`/lc/pi/${selectedId}/edit`)
  }

  const handleDeleteClick = () => {
    if (selectedId === null) return
    setConfirmDelete({ open: true, piId: selectedId })
  }

  const handleDeleteConfirm = () => {
    if (confirmDelete.piId === null) return
    deleteMutation.mutate(confirmDelete.piId, {
      onSuccess: (res) => {
        const errMsg = (res as { errMsg?: string })?.errMsg
        if (errMsg) showToast({ message: errMsg, type: 'error' })
        else showToast({ message: 'Proforma Invoice deleted successfully', type: 'success' })
        setConfirmDelete({ open: false, piId: null })
        if (selectedId === confirmDelete.piId) setSelectedId(null)
      },
      onError: () => {
        showToast({ message: 'Failed to delete PI', type: 'error' })
        setConfirmDelete({ open: false, piId: null })
      },
    })
  }

  const handleEscalateConfirm = () => {
    if (confirmEscalate.piId === null) return
    const id = confirmEscalate.piId
    escalateMutation.mutate(
      { piId: id, status: 1 },
      {
        onSuccess: (res) => {
          setConfirmEscalate({ open: false, piId: null })
          const errMsg = (res as { errMsg?: string })?.errMsg
          if (errMsg) {
            setErrorPopup({ open: true, message: errMsg })
          } else {
            setEscalatedIds((prev) => new Set(prev).add(id))
            showToast({ message: `Proforma Invoice ${id} escalated successfully!`, type: 'success' })
          }
        },
        onError: (err: unknown) => {
          setConfirmEscalate({ open: false, piId: null })
          const msg =
            (err as { response?: { data?: { errMsg?: string } }; message?: string })?.response
              ?.data?.errMsg ??
            (err as { message?: string })?.message ??
            'An unknown error occurred'
          setErrorPopup({ open: true, message: msg })
        },
      },
    )
  }

  return (
    <div className="space-y-4">
      {/* Page header — mirrors legacy PageHeader */}
      <div className="flex items-center gap-3 px-1">
        <Plus size={22} className="text-gray-600" />
        <div>
          <h1 className="text-lg font-bold text-gray-900">Proforma Invoice List</h1>
          <p className="text-sm text-gray-500">Manage, edit, and escalate Proforma Invoices</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search across all columns..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(0)
            }}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
        {!isLoading && !isError && (
          <p className="text-xs text-gray-400">
            Total: {piList.length} • Filtered: {filteredRows.length}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* Toolbar — Add New / Edit / Delete */}
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate('/lc/pi/create')}
            className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={14} /> Add New
          </button>
          <button
            type="button"
            onClick={handleEdit}
            disabled={selectedId === null}
            className="inline-flex items-center gap-1.5 rounded bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={selectedId === null}
            className="inline-flex items-center gap-1.5 rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={26} className="animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="flex items-start gap-3 p-6">
            <AlertCircle size={18} className="mt-0.5 text-red-500" />
            <p className="text-sm text-red-700">Error loading data</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              {/* Dark header — exact match to legacy #4a4a4a */}
              <thead>
                <tr style={{ backgroundColor: '#4a4a4a' }}>
                  {/* checkbox column */}
                  <th className="w-10 px-3 py-3" />
                  <th className="px-4 py-3 text-center text-xs font-bold text-white">Actions</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-white">VIEW</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-white">
                    PI System Id
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-white">PI Number</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-white">PI Ref</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-white">PI Date</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-white">
                    Customer Id
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-white">
                    Customer Name
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-gray-400">
                      {search.trim() ? 'No matching proforma invoices found.' : 'No proforma invoices found.'}
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((pi) => {
                    const isSelected = selectedId === pi.piSystemId
                    const isEscalated =
                      escalatedIds.has(pi.piSystemId) ||
                      (pi.piStatus ?? 0) !== 0 ||
                      (pi as unknown as { activityStatus?: number }).activityStatus !== 0
                    const isRef = isBasePI(pi.piSystemId)

                    let escalateCls =
                      'bg-blue-600 hover:bg-blue-700 text-white'
                    if (isRef) escalateCls = 'bg-red-600 hover:bg-red-700 text-white'
                    else if (isEscalated) escalateCls = 'bg-green-600 text-white'

                    return (
                      <tr
                        key={pi.piSystemId}
                        className={isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                      >
                        {/* Checkbox — only one row stays selected */}
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(pi.piSystemId)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                        </td>

                        {/* Actions — Escalate button (per row) */}
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            title={isRef ? 'This PI is referenced by other PIs' : ''}
                            disabled={isEscalated || escalateMutation.isPending}
                            onClick={() =>
                              setConfirmEscalate({ open: true, piId: pi.piSystemId })
                            }
                            className={`inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-medium ${escalateCls} disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            {isRef && <Link size={12} />}
                            {isEscalated ? 'Escalated' : 'Escalate'}
                          </button>
                        </td>

                        {/* VIEW — opens PI detail / invoice modal */}
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => setViewId(pi.piSystemId)}
                            className="inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-medium text-green-700 hover:text-green-900"
                          >
                            <Package size={14} /> INVOICE
                          </button>
                        </td>

                        <td className="px-4 py-2 text-center text-gray-700">{pi.piSystemId}</td>
                        <td className="px-4 py-2 text-center text-gray-700">{pi.piNumber}</td>
                        <td className="px-4 py-2 text-center text-gray-700">{pi.piRef || '—'}</td>
                        <td className="px-4 py-2 text-center text-gray-600">
                          {pi.piDate ? formatDate(pi.piDate) : '—'}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-700">
                          {pi.piCustmomerId}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-700">{pi.customerName}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination row */}
        {!isLoading && !isError && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(0)
                }}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>
                {totalRows === 0
                  ? '0–0 of 0'
                  : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, totalRows)} of ${totalRows}`}
              </span>
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded p-1 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded p-1 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PI Detail / Invoice modal */}
      {viewId !== null && <PiDetailModal piId={viewId} onClose={() => setViewId(null)} />}

      {/* Escalate confirm */}
      {confirmEscalate.open && (
        <PiConfirmDialog
          title="Confirm Escalation"
          message="Are you sure you want to escalate this Proforma Invoice?"
          onConfirm={handleEscalateConfirm}
          onCancel={() => setConfirmEscalate({ open: false, piId: null })}
          loading={escalateMutation.isPending}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete.open && (
        <PiConfirmDialog
          title="Are you sure you want to delete this Proforma Invoice?"
          message="This action cannot be undone."
          confirmLabel="Delete"
          confirmCls="bg-red-600 hover:bg-red-700"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete({ open: false, piId: null })}
          loading={deleteMutation.isPending}
        />
      )}

      {/* Selection error */}
      {selectionError && (
        <PiConfirmDialog
          title="Selection Error"
          message="Please select a single row to edit"
          onConfirm={() => setSelectionError(false)}
          onCancel={() => setSelectionError(false)}
          hideCancel
          confirmLabel="OK"
        />
      )}

      {/* Escalation error */}
      {errorPopup.open && (
        <PiConfirmDialog
          title="Escalation Failed"
          message={errorPopup.message}
          onConfirm={() => setErrorPopup({ open: false, message: '' })}
          onCancel={() => setErrorPopup({ open: false, message: '' })}
          hideCancel
          confirmLabel="OK"
        />
      )}
    </div>
  )
}

// ── Reusable inline confirm dialog ──────────────────────────────────────────

interface PiConfirmDialogProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  confirmLabel?: string
  confirmCls?: string
  hideCancel?: boolean
}

function PiConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  loading,
  confirmLabel = 'Yes',
  confirmCls = 'bg-blue-600 hover:bg-blue-700',
  hideCancel,
}: PiConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="px-6 py-5">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{message}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          {!hideCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              No
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white ${confirmCls} disabled:opacity-60`}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
