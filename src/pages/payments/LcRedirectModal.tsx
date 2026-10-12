import { AlertTriangle, ArrowRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface LcRedirectModalProps {
  open: boolean
  onClose: () => void
}

export function LcRedirectModal({ open, onClose }: LcRedirectModalProps) {
  const navigate = useNavigate()

  if (!open) return null

  const handleNavigate = () => {
    onClose()
    navigate('/lc-payments')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="text-base font-semibold text-gray-900">LC Payment Module</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 leading-relaxed">
            LC Payment operations are managed through a dedicated module. Please use the{' '}
            <strong>LC Payment module</strong> for all Letter of Credit related payments.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            This Customer Payment module does not process LC payments directly.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleNavigate}
            className="action-view inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Go to LC Payments <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
