import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Loader2, AlertCircle, Eye, Pencil, Trash2, ArrowRight } from 'lucide-react'
import { usePiList, useDeletePi, useEscalatePi } from '@/hooks/useLcTracking'
import { useToastStore } from '@/stores/toastStore'
import { formatDate } from '@/lib/utils'
import { PiDetailModal } from './PiDetailModal'
import type { ProformaInvoice } from '@/types/lcTracking'

const STATUS_LABELS: Record<number, { label: string; cls: string }> = {
  0: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
  1: { label: 'Submitted', cls: 'bg-amber-100 text-amber-700' },
  2: { label: 'LC Created', cls: 'bg-emerald-100 text-emerald-700' },
  3: { label: 'Payment Done', cls: 'bg-gray-100 text-gray-500' },
}

export function PiListPage() {
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)
  const [viewId, setViewId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const { data: piList = [], isLoading, isError } = usePiList()
  const deleteMutation = useDeletePi()
  const escalateMutation = useEscalatePi()

  const filtered = piList.filter(
    (pi) =>
      pi.piNumber?.toLowerCase().includes(search.toLowerCase()) ||
      pi.customerName?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleDelete = (pi: ProformaInvoice) => {
    deleteMutation.mutate(pi.piSystemId, {
      onSuccess: (res) => {
        if (res.errMsg) showToast({ message: res.errMsg, type: 'error' })
        else showToast({ message: 'PI deleted', type: 'success' })
        setConfirmDeleteId(null)
      },
      onError: () => {
        showToast({ message: 'Failed to delete PI', type: 'error' })
        setConfirmDeleteId(null)
      },
    })
  }

  const handleEscalate = (pi: ProformaInvoice) => {
    const nextStatus = (pi.piStatus ?? 0) + 1
    escalateMutation.mutate(
      { piId: pi.piSystemId, status: nextStatus },
      {
        onSuccess: (res) => {
          if (res.errMsg) showToast({ message: res.errMsg, type: 'error' })
          else showToast({ message: 'PI status updated', type: 'success' })
        },
        onError: () => showToast({ message: 'Failed to escalate PI', type: 'error' }),
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Proforma Invoices</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage all PI documents for LC tracking</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/lc/pi/create')}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
        >
          <Plus size={15} /> New PI
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Search by PI number or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={26} className="animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="flex items-start gap-3 p-6">
            <AlertCircle size={18} className="mt-0.5 text-red-500" />
            <p className="text-sm text-red-700">Failed to load proforma invoices.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3 text-left">PI Number</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Currency</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                      {search ? 'No matching proforma invoices.' : 'No proforma invoices yet.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((pi) => {
                    const statusInfo = STATUS_LABELS[pi.piStatus ?? 0] ?? STATUS_LABELS[0]
                    return (
                      <tr key={pi.piSystemId} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 font-medium text-gray-900">{pi.piNumber}</td>
                        <td className="px-5 py-3 text-gray-700">{pi.customerName}</td>
                        <td className="px-5 py-3 text-gray-500">{pi.piDate ? formatDate(pi.piDate) : '—'}</td>
                        <td className="px-5 py-3 text-gray-600">{pi.piCurrency}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.cls}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewId(pi.piSystemId)}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                              <Eye size={12} /> View
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/lc/pi/${pi.piSystemId}/edit`)}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            {(pi.piStatus ?? 0) < 3 && (
                              <button
                                type="button"
                                onClick={() => handleEscalate(pi)}
                                disabled={escalateMutation.isPending}
                                className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
                              >
                                <ArrowRight size={12} /> Escalate
                              </button>
                            )}
                            {(pi.piStatus ?? 0) === 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  confirmDeleteId === pi.piSystemId
                                    ? handleDelete(pi)
                                    : setConfirmDeleteId(pi.piSystemId)
                                }
                                disabled={deleteMutation.isPending}
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                              >
                                <Trash2 size={12} />
                                {confirmDeleteId === pi.piSystemId ? 'Confirm?' : 'Delete'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewId !== null && (
        <PiDetailModal piId={viewId} onClose={() => setViewId(null)} />
      )}
    </div>
  )
}
