import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePiList } from '@/hooks/useLcTracking'
import type { ProformaInvoice } from '@/types/lcTracking'
import { PiDetailModal } from './PiDetailModal'
import { LcDocumentDetailModal } from './LcDocumentDetailModal'

// High-level piStatus groups for summary cards & filter chips
const STATUS_CONFIG: Record<number, { label: string; bg: string; text: string }> = {
  0: { label: 'PI Created',      bg: '#e14b18', text: '#ffffff' },
  1: { label: 'Waiting for LC',  bg: '#ff9800', text: '#ffffff' },
  2: { label: 'LC Created',      bg: '#2196f3', text: '#ffffff' },
  3: { label: 'Payment Done',    bg: '#0097a7', text: '#ffffff' },
}

// Lifecycle name → color (from database via API, matching legacy LIFECYCLE_COLORS)
const LIFECYCLE_COLORS: Record<string, { bg: string; text: string }> = {
  'PI Created':                      { bg: '#e14b18', text: '#ffffff' },
  'Waiting for LC':                  { bg: '#ff9800', text: '#ffffff' },
  'LC Created':                      { bg: '#2196f3', text: '#ffffff' },
  'Waiting for Doc Submission':      { bg: '#00bcd4', text: '#ffffff' },
  'Document submitted':              { bg: '#474841', text: '#ffffff' },
  'Doc accepted by customer':        { bg: '#216825', text: '#ffffff' },
  'Doc Sumbited to Benificery Bank': { bg: '#101511', text: '#ffffff' },
  'Doc Transmitted to Issuer Bank':  { bg: '#340585', text: '#ffffff' },
  'Doc Accepted by issuer bank':     { bg: '#52136d', text: '#ffffff' },
  'Payment Received':                { bg: '#0097a7', text: '#ffffff' },
  'AIT received':                    { bg: '#f57c00', text: '#ffffff' },
  'Waiting for Payment':             { bg: '#0e652e', text: '#ffffff' },
}
const DEFAULT_LIFECYCLE_COLOR = { bg: '#616161', text: '#ffffff' }

function getLifecycleColor(name?: string | null) {
  if (!name) return DEFAULT_LIFECYCLE_COLOR
  return LIFECYCLE_COLORS[name] ?? DEFAULT_LIFECYCLE_COLOR
}

// lcLifecycleId → v2 route (matching legacy route map)
function getLifecycleRoute(id?: number | null): string | null {
  if (id == null) return null
  if (id === 0) return '/lc/pi'
  if (id === 1) return '/lc/operations'
  if (id >= 2 && id <= 9) return '/lc/documents'
  if (id >= 10 && id <= 11) return '/lc/payments'
  if (id === 12) return '/lc/documents'
  return null
}

type SortField = keyof ProformaInvoice

function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ChevronUp size={12} className="ml-0.5 opacity-30" />
  return dir === 'asc' ? <ChevronUp size={12} className="ml-0.5" /> : <ChevronDown size={12} className="ml-0.5" />
}

const TH_BASE = 'px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-white select-none cursor-pointer whitespace-nowrap'

export function LcStatusReportPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | null>(null)
  const [sortField, setSortField] = useState<SortField>('piSystemId')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [piModalId, setPiModalId] = useState<number | null>(null)
  const [lcDocModalId, setLcDocModalId] = useState<number | null>(null)

  const { data: piList = [], isLoading, isError } = usePiList()

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
    setPage(0)
  }

  const filteredSorted = useMemo(() => {
    const rows = (piList as ProformaInvoice[]).filter((pi) => {
      const matchesStatus = statusFilter === null || pi.piStatus === statusFilter
      const matchesSearch = search === '' || Object.values(pi).some(v =>
        v?.toString().toLowerCase().includes(search.toLowerCase())
      )
      return matchesStatus && matchesSearch
    })
    rows.sort((a, b) => {
      const av = a[sortField] ?? ''
      const bv = b[sortField] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [piList, search, statusFilter, sortField, sortDir])

  const total = filteredSorted.length
  const pageCount = Math.ceil(total / rowsPerPage)
  const start = page * rowsPerPage
  const pageRows = filteredSorted.slice(start, start + rowsPerPage)

  const handleExport = async () => {
    const { lazyExportExcel } = await import('@/lib/lazyExportExcel')
    lazyExportExcel({
      filename: 'LC-Status-Report',
      sheetName: 'LC Status',
      headers: ['PI System ID', 'Customer', 'PI Number', 'PI Date', 'PI Ref', 'Amount', 'LC Number', 'LC Date', 'Payment Terms', 'Lifecycle Stage'],
      rows: filteredSorted.map((pi) => [
        pi.piSystemId,
        pi.customerName ?? '',
        pi.piNumber ?? '',
        pi.piDate ? new Date(pi.piDate).toLocaleDateString() : '',
        pi.piRef ?? '',
        `${pi.piAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${pi.piCurrency}`,
        pi.lcNumber || 'No LC Assigned',
        pi.lcDate ? new Date(pi.lcDate).toLocaleDateString() : '',
        pi.lcPaymetTerms ?? '',
        pi.lcLifecycleName ?? '',
      ]),
    })
  }

  const Th = ({ field, label }: { field: SortField; label: string }) => (
    <th className={TH_BASE} onClick={() => handleSort(field)}>
      <span className="inline-flex items-center">
        {label}
        <SortIcon field={field as string} active={sortField === field} dir={sortDir} />
      </span>
    </th>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">LC Tracking Report</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Track Proforma Invoices and LC Lifecycle Status
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={isLoading || filteredSorted.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Download size={15} /> Export Excel
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search across all columns..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
        {!isLoading && !isError && (
          <p className="text-xs text-gray-400">
            Total: {(piList as ProformaInvoice[]).length} &bull; Filtered: {total}
          </p>
        )}
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
            <p className="text-sm text-red-700">Failed to load LC status data.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#4a4a4a' }}>
                    <Th field="piSystemId" label="PI System ID" />
                    <Th field="customerName" label="Customer" />
                    <Th field="piNumber" label="PI Number" />
                    <Th field="piDate" label="PI Date" />
                    <Th field="piRef" label="PI Reference" />
                    <Th field="piAmount" label="Amount" />
                    <Th field="lcNumber" label="LC Number" />
                    <Th field="lcDate" label="LC Date" />
                    <Th field="lcPaymetTerms" label="Payment Terms" />
                    <Th field="lcLifecycleName" label="Lifecycle Stage" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-10 text-center text-gray-400">
                        {search || statusFilter !== null ? 'No matching records.' : 'No proforma invoices found.'}
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((pi) => {
                      const lifecycleCfg = getLifecycleColor(pi.lcLifecycleName)
                      const lifecycleRoute = getLifecycleRoute(pi.lcLifecycleId)
                      const lcValid = pi.lcNumber && pi.lcNumber !== '' && pi.lcNumber !== 'Not Assigned'
                      return (
                        <tr
                          key={pi.piSystemId}
                          className="hover:bg-gray-50"
                          style={{ backgroundColor: `${lifecycleCfg.bg}12` }}
                        >
                          <td className="px-3 py-3 text-center font-semibold text-blue-700">
                            <button
                              type="button"
                              onClick={() => setPiModalId(pi.piSystemId)}
                              className="cursor-pointer font-semibold text-blue-700 hover:underline"
                            >
                              {pi.piSystemId}
                            </button>
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-medium text-gray-900">{pi.customerName}</p>
                            {pi.customerAddress && (
                              <p className="text-xs text-gray-400">{pi.customerAddress}</p>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => setPiModalId(pi.piSystemId)}
                              className="inline-flex rounded-full border border-blue-300 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-50 cursor-pointer"
                            >
                              {pi.piNumber}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-gray-600">
                            {pi.piDate ? new Date(pi.piDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-3 py-3 text-gray-600">{pi.piRef || '—'}</td>
                          <td className="px-3 py-3 font-medium text-gray-900">
                            {pi.piAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                            <span className="text-xs text-gray-500">{pi.piCurrency}</span>
                          </td>
                          <td className="px-3 py-3">
                            {lcValid ? (
                              <button
                                type="button"
                                onClick={() => pi.lcDocId ? setLcDocModalId(pi.lcDocId) : undefined}
                                className="inline-flex rounded-full border border-purple-300 px-2 py-0.5 text-xs font-medium text-purple-700 hover:bg-purple-50 cursor-pointer"
                              >
                                {pi.lcNumber}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">No LC Assigned</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-gray-600">
                            {pi.lcDate ? new Date(pi.lcDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-3 py-3 text-gray-600">{pi.lcPaymetTerms || '—'}</td>
                          <td className="px-3 py-3">
                            {lifecycleRoute ? (
                              <button
                                type="button"
                                onClick={() => navigate(lifecycleRoute)}
                                className="inline-flex rounded-full px-2 py-0.5 text-xs font-bold cursor-pointer hover:opacity-80"
                                style={{ backgroundColor: lifecycleCfg.bg, color: lifecycleCfg.text }}
                              >
                                {pi.lcLifecycleName ?? '—'}
                              </button>
                            ) : (
                              <span
                                className="inline-flex rounded-full px-2 py-0.5 text-xs font-bold"
                                style={{ backgroundColor: lifecycleCfg.bg, color: lifecycleCfg.text }}
                              >
                                {pi.lcLifecycleName ?? '—'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 0 && (
              <div className="flex items-center justify-end gap-6 border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0) }}
                    className="rounded border border-gray-300 px-1 py-0.5 text-sm focus:outline-none"
                  >
                    {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <span>{start + 1}–{Math.min(start + rowsPerPage, total)} of {total}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                    className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* PI Detail Modal */}
      {piModalId !== null && (
        <PiDetailModal piId={piModalId} onClose={() => setPiModalId(null)} />
      )}

      {/* LC Document Detail Modal */}
      {lcDocModalId !== null && (
        <LcDocumentDetailModal lcDocId={lcDocModalId} onClose={() => setLcDocModalId(null)} />
      )}
    </div>
  )
}

