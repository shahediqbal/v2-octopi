import { useCallback, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileBadge2,
  FileSearch,
  FileText,
  Loader2,
  Search,
  X,
} from 'lucide-react'
import {
  createDocumentPreview,
  downloadScannedDocument,
  useDocumentPair,
} from '@/hooks/useDocumentService'
import { usePackagingDetail, useStockOutDetail } from '@/hooks/useStockOut'
import { SalesOrderChalaanModal } from '@/pages/sales-orders/SalesOrderChalaanModal'
import { SalesOrderInternalModal } from '@/pages/sales-orders/SalesOrderInternalModal'
import type { ScannedDocument } from '@/types/documentService'
import { ScannedDocumentPreviewModal } from './ScannedDocumentPreviewModal'

type DocumentKind = 'invoice' | 'chalaan'

interface DocumentPreview {
  document: ScannedDocument
  previewUrl: string
  contentType: string
}

export function InvoiceChallanLookup() {
  const [isOpen, setIsOpen] = useState(false)
  const [systemIdText, setSystemIdText] = useState('')
  const [lookupId, setLookupId] = useState<number | undefined>()
  const [activeDocument, setActiveDocument] = useState<DocumentKind | null>(null)
  const [validationMessage, setValidationMessage] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [busyDocumentId, setBusyDocumentId] = useState<number | null>(null)
  const [preview, setPreview] = useState<DocumentPreview | null>(null)

  const orderDetail = useStockOutDetail(lookupId)
  const packagingDetail = usePackagingDetail(activeDocument === 'chalaan' ? lookupId : undefined)
  const scannedPair = useDocumentPair(lookupId)

  const checkDocuments = () => {
    const parsedId = Number(systemIdText.trim())
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      setValidationMessage('Enter a valid positive system ID.')
      return
    }

    setValidationMessage('')
    setActionMessage('')
    setLookupId(parsedId)
    setActiveDocument(null)
  }

  const openDocument = (kind: DocumentKind) => setActiveDocument(kind)
  const closeDocument = () => setActiveDocument(null)

  const closePreview = useCallback(() => setPreview(null), [])

  const viewScan = async (document: ScannedDocument) => {
    setActionMessage('')
    setBusyDocumentId(document.id)
    closePreview()

    try {
      const file = await createDocumentPreview(document)
      setPreview({ document, ...file })
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : 'Could not open the scanned document.',
      )
    } finally {
      setBusyDocumentId(null)
    }
  }

  const downloadScan = async (document: ScannedDocument) => {
    setActionMessage('')
    setBusyDocumentId(document.id)

    try {
      await downloadScannedDocument(document)
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : 'Could not download the scanned document.',
      )
    } finally {
      setBusyDocumentId(null)
    }
  }

  const lookupError =
    (scannedPair.error as Error | undefined)?.message ??
    (orderDetail.error as Error | undefined)?.message

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
        {isOpen && (
          <div className="max-h-[min(42rem,calc(100vh-6rem))] w-[min(29rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">Check Documents</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  ERP documents and physical scan copies.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close document lookup"
              >
                <X size={16} />
              </button>
            </div>

            <label className="text-xs font-medium text-slate-600">
              System ID
              <input
                type="number"
                min="1"
                step="1"
                value={systemIdText}
                onChange={(event) => {
                  setSystemIdText(event.target.value)
                  setValidationMessage('')
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') checkDocuments()
                }}
                placeholder="e.g. 35143"
                autoFocus
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            {validationMessage && <p className="mt-2 text-xs text-red-600">{validationMessage}</p>}

            <button
              type="button"
              onClick={checkDocuments}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Search size={15} /> Check documents
            </button>

            {lookupId && (
              <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                {(scannedPair.isLoading || orderDetail.isLoading) && (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-8 text-xs text-slate-500">
                    <Loader2 size={16} className="animate-spin" /> Checking documents…
                  </div>
                )}

                {!scannedPair.isLoading && !orderDetail.isLoading && lookupError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    <span>{lookupError}</span>
                  </div>
                )}

                {!scannedPair.isLoading && scannedPair.data && (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          Sales Order #{scannedPair.data.soSystemId}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Document no. {scannedPair.data.documentNumber}
                        </p>
                      </div>
                      <PairStatus status={scannedPair.data.pairStatus} />
                    </div>

                    <section>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        ERP-generated documents
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => openDocument('invoice')}
                          disabled={!orderDetail.data}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FileText size={15} /> ERP Invoice
                        </button>
                        <button
                          type="button"
                          onClick={() => openDocument('chalaan')}
                          disabled={!orderDetail.data}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FileBadge2 size={15} /> ERP Challan
                        </button>
                      </div>
                    </section>

                    <section>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Physical scan copies
                      </p>
                      <div className="space-y-2">
                        <ScanCard
                          label="Scanned Invoice"
                          document={scannedPair.data.invoice}
                          isBusy={busyDocumentId === scannedPair.data.invoice?.id}
                          onView={viewScan}
                          onDownload={downloadScan}
                        />
                        <ScanCard
                          label="Scanned Challan"
                          document={scannedPair.data.challan}
                          isBusy={busyDocumentId === scannedPair.data.challan?.id}
                          onView={viewScan}
                          onDownload={downloadScan}
                        />
                      </div>
                    </section>
                  </>
                )}

                {actionMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    <span>{actionMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white shadow-xl transition hover:bg-emerald-700"
          aria-expanded={isOpen}
          title="Check invoice or challan by system ID"
        >
          <FileSearch size={19} />
          <span className="hidden sm:inline">Check document</span>
        </button>
      </div>

      <SalesOrderInternalModal
        isOpen={activeDocument === 'invoice'}
        detail={orderDetail.data}
        isLoading={orderDetail.isLoading || orderDetail.isFetching}
        errorMessage={(orderDetail.error as Error | undefined)?.message}
        title="ERP Invoice / Detail"
        viewVariant="packing-print"
        onClose={closeDocument}
      />

      <SalesOrderChalaanModal
        isOpen={activeDocument === 'chalaan'}
        packagingDetail={packagingDetail.data}
        orderDetail={orderDetail.data}
        isLoading={orderDetail.isLoading || orderDetail.isFetching || packagingDetail.isLoading || packagingDetail.isFetching}
        errorMessage={(packagingDetail.error as Error | undefined)?.message ?? (orderDetail.error as Error | undefined)?.message}
        onClose={closeDocument}
      />

      {preview && (
        <ScannedDocumentPreviewModal
          document={preview.document}
          sourceUrl={preview.previewUrl}
          contentType={preview.contentType}
          onClose={closePreview}
        />
      )}
    </>
  )
}

function PairStatus({ status }: { status: string }) {
  const isComplete = status === 'COMPLETE'
  const label = status.replaceAll('_', ' ').toLowerCase()

  return (
    <span
      className={
        isComplete
          ? 'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold capitalize text-emerald-700'
          : 'inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold capitalize text-amber-700'
      }
    >
      {isComplete ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
      {label}
    </span>
  )
}

interface ScanCardProps {
  label: string
  document: ScannedDocument | null
  isBusy: boolean
  onView: (document: ScannedDocument) => void
  onDownload: (document: ScannedDocument) => void
}

function ScanCard({
  label,
  document,
  isBusy,
  onView,
  onDownload,
}: ScanCardProps) {
  if (!document) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3">
        <div>
          <p className="text-xs font-semibold text-slate-600">{label}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Scan not available</p>
        </div>
        <AlertCircle size={16} className="text-slate-300" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
            {label}
          </p>
          <p className="mt-1 truncate text-[11px] text-slate-500">{document.fileName}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {document.documentNumber ?? `SO ${document.soSystemId}`}
            {document.metadataStatus ? ` • ${document.metadataStatus.replaceAll('_', ' ')}` : ''}
          </p>
        </div>
        {isBusy && <Loader2 size={15} className="mt-0.5 shrink-0 animate-spin text-emerald-600" />}
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onView(document)}
          disabled={isBusy}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          <Eye size={13} /> View
        </button>
        <button
          type="button"
          onClick={() => onDownload(document)}
          disabled={isBusy}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
        >
          <Download size={13} /> Download
        </button>
      </div>
    </div>
  )
}
