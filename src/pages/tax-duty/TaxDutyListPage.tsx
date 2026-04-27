import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Pencil, Trash2, Plus, Receipt } from 'lucide-react'
import { useTaxDutyList, useDeleteTaxDuty } from '@/hooks/useTaxAndDuty'
import { useToastStore } from '@/stores/toastStore'

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString()
  } catch {
    return 'N/A'
  }
}

export function TaxDutyListPage() {
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const { data: rows = [], isLoading, isError } = useTaxDutyList()
  const deleteMutation = useDeleteTaxDuty()

  function handleDeleteConfirm() {
    if (confirmId == null) return
    deleteMutation.mutate(confirmId, {
      onSuccess: () => {
        showToast({ message: 'Record deleted', type: 'success' })
        setConfirmId(null)
      },
      onError: () => {
        showToast({ message: 'Failed to delete record', type: 'error' })
        setConfirmId(null)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
              <Receipt size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Tax &amp; Duty</h2>
              <p className="mt-1 text-sm text-gray-500">Customer-specific AIT and VAT percentages.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/tax-duty/add')}
            className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            <Plus size={15} />
            Add Tax &amp; Duty
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-gray-400" />
            <span className="ml-3 text-sm text-gray-500">Loading…</span>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-red-500">
            <AlertCircle size={16} />
            Failed to load tax &amp; duty records.
          </div>
        )}

        {!isLoading && !isError && rows.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">No records found.</div>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3 text-right">AIT %</th>
                  <th className="px-4 py-3 text-right">VAT %</th>
                  <th className="px-4 py-3">Effective Date</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.customerTaxDutyId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{row.customerTaxDutyId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.customerName}</td>
                    <td className="px-4 py-3 text-gray-500">{row.customerAddress}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.customerAitPercentage}%</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.customerVatPercentage}%</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(row.effectiveDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/tax-duty/${row.customerTaxDutyId}/edit`)}
                          className="text-gray-400 hover:text-gray-700"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(row.customerTaxDutyId)}
                          className="text-gray-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      {confirmId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900">Delete Record</h3>
            <p className="mt-2 text-sm text-gray-500">Are you sure you want to delete this tax &amp; duty record? This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
