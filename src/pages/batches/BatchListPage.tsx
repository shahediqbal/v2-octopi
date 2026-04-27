import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, Pencil, Layers } from 'lucide-react'
import { useBatchList, useBatchDetail, useUpdateBatch } from '@/hooks/useBatches'
import { useToastStore } from '@/stores/toastStore'

const STATUS_OPTIONS = [
  { value: '1', label: 'Active Batches' },
  { value: '2', label: 'Inactive Batches' },
  { value: '3', label: 'Paused Batches' },
]

const BATCH_STATUS_LABELS: Record<string, string> = {
  '1': 'Active',
  '2': 'Inactive',
  '3': 'Paused',
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return [
      String(d.getDate()).padStart(2, '0'),
      d.toLocaleString('default', { month: 'short' }),
      d.getFullYear(),
    ].join('-')
  } catch {
    return '—'
  }
}

function toInputDate(iso: string) {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return ''
  }
}

// ─── Edit Batch Modal ───────────────────────────────────────────────────────

interface EditBatchModalProps {
  batchId: number
  onClose: () => void
}

function EditBatchModal({ batchId, onClose }: EditBatchModalProps) {
  const showToast = useToastStore((s) => s.showToast)
  const { data: detail, isLoading } = useBatchDetail(batchId)
  const updateMutation = useUpdateBatch()

  const [productionDate, setProductionDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [status, setStatus] = useState('1')

  useEffect(() => {
    if (!detail) return
    setProductionDate(toInputDate(detail.batchProductionDate))
    setExpiryDate(toInputDate(detail.batchExpiryDate))
    setStatus(String(detail.batchCurrentStatus))
  }, [detail])

  function handleSubmit() {
    if (!productionDate || !expiryDate) {
      showToast({ message: 'Please fill in both dates.', type: 'error' })
      return
    }
    updateMutation.mutate(
      {
        batchId,
        batchProductionDateInText: productionDate,
        batchExpiryDateInText: expiryDate,
        batchCurrentStatus: status,
      },
      {
        onSuccess: () => {
          showToast({ message: 'Batch updated successfully', type: 'success' })
          onClose()
        },
        onError: () => {
          showToast({ message: 'Failed to update batch', type: 'error' })
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-gray-900">Update Batch Info</h3>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading…</span>
          </div>
        )}

        {!isLoading && detail && (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500">Batch No</p>
              <p className="text-sm text-gray-800">{detail.batchNo}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Product</p>
              <p className="text-sm text-gray-800">{detail.productName}</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Production Date</label>
              <input
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
              <div className="flex gap-5">
                {[
                  { value: '1', label: 'Active' },
                  { value: '2', label: 'Inactive' },
                  { value: '3', label: 'Pause' },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="radio"
                      name="batchStatus"
                      value={opt.value}
                      checked={status === opt.value}
                      onChange={() => setStatus(opt.value)}
                      className="accent-gray-800"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={updateMutation.isPending || isLoading}
            className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {updateMutation.isPending && <Loader2 size={13} className="animate-spin" />}
            Update
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Batch List Page ────────────────────────────────────────────────────────

export function BatchListPage() {
  const [statusFilter, setStatusFilter] = useState('1')
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState<number | null>(null)

  const { data: batches = [], isLoading, isError } = useBatchList(statusFilter)

  const filtered = search.trim()
    ? batches.filter(
        (b) =>
          b.batchNo.toLowerCase().includes(search.toLowerCase()) ||
          b.productName.toLowerCase().includes(search.toLowerCase()),
      )
    : batches

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
          <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Batch Control</h2>
            <p className="mt-1 text-sm text-gray-500">View and update batch production/expiry dates and status.</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search batch no / product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-gray-400" />
            <span className="ml-3 text-sm text-gray-500">Loading batches…</span>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-red-500">
            <AlertCircle size={16} />
            Failed to load batches.
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">No batches found.</div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3 text-center">Edit</th>
                  <th className="px-4 py-3">Batch No</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Production Date</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((batch) => (
                  <tr key={batch.batchId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setEditId(batch.batchId)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        title="Edit"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{batch.batchNo}</td>
                    <td className="px-4 py-3 text-gray-700">{batch.productName}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(batch.batchProductionDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(batch.batchExpiryDate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          String(batch.batchCurrentStatus) === '1'
                            ? 'bg-emerald-50 text-emerald-700'
                            : String(batch.batchCurrentStatus) === '3'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {BATCH_STATUS_LABELS[String(batch.batchCurrentStatus)] ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editId != null && (
        <EditBatchModal batchId={editId} onClose={() => setEditId(null)} />
      )}
    </div>
  )
}
