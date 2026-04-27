import type { ReactNode } from 'react'
import { Loader2, Printer, X } from 'lucide-react'

interface PrintDialogProps {
  isOpen: boolean
  title: string
  subtitle?: string
  isLoading?: boolean
  errorMessage?: string
  printDisabled?: boolean
  printLabel?: string
  onClose: () => void
  onPrint?: () => void
  children: ReactNode
}

export function PrintDialog({
  isOpen,
  title,
  subtitle,
  isLoading = false,
  errorMessage,
  printDisabled = false,
  printLabel = 'Print / Save PDF',
  onClose,
  onPrint,
  children,
}: PrintDialogProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close print dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-gray-400" />
              <span className="ml-3 text-sm text-gray-500">Loading printable data…</span>
            </div>
          ) : errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
          ) : (
            children
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Close
          </button>
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              disabled={isLoading || !!errorMessage || printDisabled}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={16} />
              {printLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}