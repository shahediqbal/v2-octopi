import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import type { StockOutLookupOption, StockOutPendingPopupItem } from '@/types/stockOut'

interface StatusUpdateModalProps {
  item: StockOutPendingPopupItem | null
  options: StockOutLookupOption[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (statusId: number, remarks: string) => void
}

export function StatusUpdateModal({ item, options, isSubmitting, onClose, onSubmit }: StatusUpdateModalProps) {
  const [selectedStatusId, setSelectedStatusId] = useState('')
  const [remarks, setRemarks] = useState('')
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    setSelectedStatusId(item?.soAssociateCurrentStatus != null ? String(item.soAssociateCurrentStatus) : '')
    setRemarks(item?.actionTakenRemarks ?? '')
    setValidationError('')
  }, [item])

  if (!item) {
    return null
  }

  const handleSubmit = () => {
    if (!selectedStatusId) {
      setValidationError('Please select a pending status.')
      return
    }

    setValidationError('')
    onSubmit(Number(selectedStatusId), remarks)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Update Pending Status</h2>
            <p className="mt-0.5 text-sm text-gray-500">{item.soSystemNo ?? `Invoice #${item.soSystemId}`}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close status update modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
            <SummaryField label="Invoice Date" value={item.invoiceDate ?? '—'} />
            <SummaryField label="Customer" value={item.customerName ?? '—'} />
            <SummaryField label="Sales Type" value={item.jobType ?? '—'} />
            <SummaryField label="Work Pending" value={item.soSystemPending ?? '—'} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Pending Status</label>
              <select
                value={selectedStatusId}
                onChange={(event) => setSelectedStatusId(event.target.value)}
                className="block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <option value="">Select status</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Decision Pending</label>
              <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">
                {item.soDecesionPending ?? 'No Status'}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Remarks</label>
            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows={4}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="Add a note for the next operational step"
            />
          </div>

          {validationError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {validationError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="action-update inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Update Status
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-800">{value}</p>
    </div>
  )
}