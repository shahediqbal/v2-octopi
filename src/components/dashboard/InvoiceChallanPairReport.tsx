import { useCallback, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react'
import {
  createDocumentPreview,
  downloadScannedDocument,
  useDocumentPairReport,
} from '@/hooks/useDocumentService'
import type {
  DocumentPairReportFile,
  DocumentPairReportRow,
  DocumentPairStatus,
  ScannedDocumentPreviewInfo,
  ScannedDocumentType,
} from '@/types/documentService'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import { DashboardDataTable } from './DashboardDataTable'
import { DashboardExcelButton } from './DashboardExcelButton'
import { ScannedDocumentPreviewModal } from './ScannedDocumentPreviewModal'

const SCAN_START_DATE = '2026-06-27'

type PairFilter = 'ALL' | Exclude<DocumentPairStatus, 'MISSING'>

interface PreviewState {
  document: ScannedDocumentPreviewInfo
  previewUrl: string
  contentType: string
}

function localDateText() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function displayDate(value: string | null | undefined) {
  if (!value) return '—'
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

function displayDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return displayDate(value)
  return date.toLocaleString('en-BD', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusLabel(status: DocumentPairStatus) {
  if (status === 'COMPLETE') return 'Complete'
  if (status === 'INVOICE_ONLY') return 'Missing Challan'
  if (status === 'CHALLAN_ONLY') return 'Missing Invoice'
  return 'Missing Both'
}

async function exportPairReport(
  rows: DocumentPairReportRow[],
  startDate: string,
  endDate: string,
  filter: PairFilter,
) {
  await exportExcelOnDemand({
    fileName: `Invoice_Challan_Pair_Report_${startDate}_to_${endDate}`,
    title: 'Invoice–Challan Pair Report',
    subtitle: `${startDate} to ${endDate}`,
    sheetName: 'Invoice Challan Pairs',
    columns: [
      { key: 'soSystemId', header: 'SO System ID', format: 'integer' },
      { key: 'customerName', header: 'Customer', width: 30 },
      { key: 'pairStatus', header: 'Pair Status', width: 18 },
      { key: 'invoiceNumber', header: 'Invoice Number', width: 18 },
      { key: 'invoiceDate', header: 'Invoice Date', format: 'date' },
      { key: 'invoiceFile', header: 'Invoice File', width: 34 },
      { key: 'challanNumber', header: 'Challan Number', width: 18 },
      { key: 'challanDate', header: 'Challan Date', format: 'date' },
      { key: 'challanFile', header: 'Challan File', width: 34 },
      { key: 'lastScannedAt', header: 'Last Scanned At', format: 'date' },
    ],
    data: rows.map(row => ({
      soSystemId: row.soSystemId,
      customerName: row.customerName ?? '',
      pairStatus: statusLabel(row.pairStatus),
      invoiceNumber: row.invoice?.documentNumber ?? '',
      invoiceDate: row.invoice?.documentDate ?? '',
      invoiceFile: row.invoice?.fileName ?? '',
      challanNumber: row.challan?.documentNumber ?? '',
      challanDate: row.challan?.documentDate ?? '',
      challanFile: row.challan?.fileName ?? '',
      lastScannedAt: row.lastScannedAt,
    })),
    filters: [
      ['Scan Date Range', `${startDate} – ${endDate}`],
      ['Pair Status', filter === 'ALL' ? 'All' : statusLabel(filter)],
      ['Pairing Key', 'so_system_id'],
    ],
    summaryCards: [
      ['Sales Orders', rows.length],
      ['Complete Pairs', rows.filter(row => row.pairStatus === 'COMPLETE').length],
      ['Missing Invoice', rows.filter(row => row.pairStatus === 'CHALLAN_ONLY').length],
      ['Missing Challan', rows.filter(row => row.pairStatus === 'INVOICE_ONLY').length],
    ],
  })
}

export function InvoiceChallanPairReport() {
  const [startDate, setStartDate] = useState(SCAN_START_DATE)
  const [endDate, setEndDate] = useState(localDateText)
  const [pairFilter, setPairFilter] = useState<PairFilter>('ALL')
  const [search, setSearch] = useState('')
  const [busyDocumentId, setBusyDocumentId] = useState<number | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [preview, setPreview] = useState<PreviewState | null>(null)

  const report = useDocumentPairReport(startDate, endDate)
  const allRows = report.data?.rows ?? []
  const normalizedSearch = search.trim().toLowerCase()
  const visibleRows = useMemo(
    () => allRows.filter(row => {
      if (pairFilter !== 'ALL' && row.pairStatus !== pairFilter) return false
      if (!normalizedSearch) return true

      return [
        String(row.soSystemId),
        row.customerName,
        row.invoice?.documentNumber,
        row.challan?.documentNumber,
        row.invoice?.fileName,
        row.challan?.fileName,
      ].some(value => value?.toLowerCase().includes(normalizedSearch))
    }),
    [allRows, normalizedSearch, pairFilter],
  )

  const closePreview = useCallback(() => setPreview(null), [])

  const viewDocument = async (
    file: DocumentPairReportFile,
    documentType: ScannedDocumentType,
  ) => {
    setActionMessage('')
    setBusyDocumentId(file.id)

    try {
      const previewFile = await createDocumentPreview(file)
      setPreview({
        document: {
          documentType,
          fileName: file.fileName,
          fileExtension: file.fileExtension,
        },
        ...previewFile,
      })
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : 'Could not open the scanned document.',
      )
    } finally {
      setBusyDocumentId(null)
    }
  }

  const downloadDocument = async (file: DocumentPairReportFile) => {
    setActionMessage('')
    setBusyDocumentId(file.id)

    try {
      await downloadScannedDocument(file)
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : 'Could not download the scanned document.',
      )
    } finally {
      setBusyDocumentId(null)
    }
  }

  const summary = report.data
  const statusFilters: Array<{ key: PairFilter; label: string; count: number }> = [
    { key: 'ALL', label: 'All', count: summary?.totalSalesOrders ?? 0 },
    { key: 'COMPLETE', label: 'Complete', count: summary?.completePairs ?? 0 },
    { key: 'CHALLAN_ONLY', label: 'Missing Invoice', count: summary?.challanOnly ?? 0 },
    { key: 'INVOICE_ONLY', label: 'Missing Challan', count: summary?.invoiceOnly ?? 0 },
  ]

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">Invoice–Challan Pair Report</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Physical scans paired strictly by SO system ID · scanning started 27 June 2026
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-[11px] font-medium text-slate-500">
              Start date
              <input
                type="date"
                min={SCAN_START_DATE}
                max={endDate}
                value={startDate}
                onChange={event => setStartDate(event.target.value)}
                className="mt-1 block h-8 rounded-lg border border-slate-200 px-2 text-xs text-slate-800"
              />
            </label>
            <label className="text-[11px] font-medium text-slate-500">
              End date
              <input
                type="date"
                min={startDate}
                max={localDateText()}
                value={endDate}
                onChange={event => setEndDate(event.target.value)}
                className="mt-1 block h-8 rounded-lg border border-slate-200 px-2 text-xs text-slate-800"
              />
            </label>
            <button
              type="button"
              onClick={() => void report.refetch()}
              disabled={report.isFetching}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={14} className={report.isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
            <DashboardExcelButton
              disabled={!visibleRows.length}
              onExport={() => exportPairReport(visibleRows, startDate, endDate, pairFilter)}
            />
          </div>
        </header>

        <div className="p-5">
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            <SummaryCard label="Sales orders" value={String(summary?.totalSalesOrders ?? 0)} />
            <SummaryCard label="Complete pairs" value={String(summary?.completePairs ?? 0)} />
            <SummaryCard
              label="Missing invoice"
              value={String(summary?.challanOnly ?? 0)}
              danger={Boolean(summary?.challanOnly)}
            />
            <SummaryCard
              label="Missing challan"
              value={String(summary?.invoiceOnly ?? 0)}
              danger={Boolean(summary?.invoiceOnly)}
            />
            <SummaryCard
              label="Completion rate"
              value={`${(summary?.completionRate ?? 0).toFixed(2)}%`}
            />
          </div>

          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPairFilter(item.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    pairFilter === item.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item.label} ({item.count})
                </button>
              ))}
            </div>
            <label className="relative block w-full lg:w-80">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="SO ID, customer or document no."
                className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-emerald-500"
              />
            </label>
          </div>

          {actionMessage && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {report.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <Loader2 size={17} className="animate-spin" /> Loading document pairs…
            </div>
          ) : report.isError ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              Invoice–Challan pair report could not be loaded. Deploy the included backend files
              first, then refresh.
            </p>
          ) : (
            <DashboardDataTable
              rows={visibleRows}
              minWidthClassName="min-w-[1240px]"
              initialRowCount={20}
              expansionKey={`${startDate}-${endDate}-${pairFilter}-${normalizedSearch}`}
              defaultSort={{ columnId: 'lastScannedAt', direction: 'desc' }}
              emptyMessage="No scanned invoice or challan found for the selected filters."
              rowKey={row => row.soSystemId}
              rowClassName={row => row.pairStatus === 'COMPLETE' ? '' : 'bg-amber-50/40'}
              columns={[
                {
                  id: 'soSystemId',
                  header: 'SO System ID',
                  sortValue: row => row.soSystemId,
                  render: row => <span className="font-semibold text-slate-950">{row.soSystemId}</span>,
                },
                {
                  id: 'customer',
                  header: 'Customer',
                  widthClassName: 'w-64',
                  sortValue: row => row.customerName,
                  render: row => row.customerName || '—',
                },
                {
                  id: 'status',
                  header: 'Pair status',
                  sortValue: row => row.pairStatus,
                  render: row => <PairStatusBadge status={row.pairStatus} />,
                },
                {
                  id: 'invoice',
                  header: 'Invoice scan',
                  widthClassName: 'w-72',
                  sortValue: row => row.invoice?.documentNumber,
                  render: row => (
                    <DocumentCell
                      file={row.invoice}
                      label="Invoice"
                      documentType="INVOICE"
                      busy={busyDocumentId === row.invoice?.id}
                      onView={viewDocument}
                      onDownload={downloadDocument}
                    />
                  ),
                },
                {
                  id: 'challan',
                  header: 'Challan scan',
                  widthClassName: 'w-72',
                  sortValue: row => row.challan?.documentNumber,
                  render: row => (
                    <DocumentCell
                      file={row.challan}
                      label="Challan"
                      documentType="CHALLAN"
                      busy={busyDocumentId === row.challan?.id}
                      onView={viewDocument}
                      onDownload={downloadDocument}
                    />
                  ),
                },
                {
                  id: 'lastScannedAt',
                  header: 'Last scanned',
                  sortValue: row => row.lastScannedAt,
                  render: row => displayDateTime(row.lastScannedAt),
                },
              ]}
            />
          )}
        </div>
      </section>

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

function SummaryCard({
  label,
  value,
  danger = false,
}: {
  label: string
  value: string
  danger?: boolean
}) {
  return (
    <div className={`rounded-xl border p-3 ${danger ? 'border-red-100 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${danger ? 'text-red-700' : 'text-slate-950'}`}>{value}</p>
    </div>
  )
}

function PairStatusBadge({
  status,
}: {
  status: Exclude<DocumentPairStatus, 'MISSING'>
}) {
  const complete = status === 'COMPLETE'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
      complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
    }`}>
      {complete ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
      {statusLabel(status)}
    </span>
  )
}

function DocumentCell({
  file,
  label,
  documentType,
  busy,
  onView,
  onDownload,
}: {
  file: DocumentPairReportFile | null
  label: string
  documentType: ScannedDocumentType
  busy: boolean
  onView: (file: DocumentPairReportFile, type: ScannedDocumentType) => Promise<void>
  onDownload: (file: DocumentPairReportFile) => Promise<void>
}) {
  if (!file) {
    return <span className="text-xs font-semibold text-red-600">{label} not scanned</span>
  }

  return (
    <div className="min-w-0">
      <p className="truncate text-xs font-semibold text-slate-800">{file.documentNumber}</p>
      <p className="mt-0.5 truncate text-[11px] text-slate-400">
        {displayDate(file.documentDate)} · {file.fileName}
      </p>
      <div className="mt-1.5 flex gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onView(file, documentType)}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        >
          {busy ? <Loader2 size={11} className="animate-spin" /> : <Eye size={11} />} View
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onDownload(file)}
          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
        >
          <Download size={11} /> Download
        </button>
      </div>
    </div>
  )
}
