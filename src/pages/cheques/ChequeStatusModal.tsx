import { X } from 'lucide-react'
import { ChequeStatusContent } from './ChequeStatusContent'

interface ChequeStatusModalProps {
  chequeId: number
  onClose: () => void
}

export function ChequeStatusModal({ chequeId, onClose }: ChequeStatusModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Update Cheque Status</h2>
            <p className="mt-0.5 text-sm text-gray-500">Cheque #{chequeId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close status update"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <ChequeStatusContent chequeId={chequeId} onSuccess={onClose} />
        </div>
      </div>
    </div>
  )
}