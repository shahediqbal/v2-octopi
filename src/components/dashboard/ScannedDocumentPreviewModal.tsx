import { useEffect } from 'react'
import { FileText, X } from 'lucide-react'
import type { ScannedDocument } from '@/types/documentService'

interface ScannedDocumentPreviewModalProps {
  document: ScannedDocument
  sourceUrl: string
  contentType: string
  onClose: () => void
}

export function ScannedDocumentPreviewModal({
  document,
  sourceUrl,
  contentType,
  onClose,
}: ScannedDocumentPreviewModalProps) {
  const isImage =
    contentType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png'].includes(
      document.fileExtension.replace('.', '').toLowerCase(),
    )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${document.documentType} scan preview`}
    >
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-950">
                Scanned {document.documentType === 'INVOICE' ? 'Invoice' : 'Challan'}
              </h3>
              <p className="truncate text-xs text-slate-500">{document.fileName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close scan preview"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-2 sm:p-4">
          {isImage ? (
            <div className="flex min-h-full items-center justify-center">
              <img
                src={sourceUrl}
                alt={`${document.documentType} scan`}
                className="max-h-full max-w-full rounded-lg bg-white object-contain shadow"
              />
            </div>
          ) : (
            <iframe
              src={sourceUrl}
              title={`${document.documentType} scan`}
              className="h-full min-h-[70vh] w-full rounded-lg border-0 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  )
}
