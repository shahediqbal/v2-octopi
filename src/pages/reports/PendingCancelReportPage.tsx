import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, AlertTriangle, Eye, RefreshCw, Search } from 'lucide-react'
import { usePendingCancelReport } from '@/hooks/usePendingCancelReport'
import { InvoiceDetailModal } from '@/components/reports/InvoiceDetailModal'
import type { PendingCancelReportItem } from '@/types/pendingCancelReport'

function fmtDate(value: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function assigneeName(item: PendingCancelReportItem) {
  const parts = [item.lastAssignedFirstName, item.lastAssignedLastName].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : '—'
}

export function PendingCancelReportPage() {
  const [search, setSearch] = useState('')
  const [filterPending, setFilterPending] = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [modalInvoiceId, setModalInvoiceId] = useState<number | null>(null)

  const { data: reportData = [], isLoading, isError, error, refetch } = usePendingCancelReport()

  // Unique values for column filters
  const pendingOptions = useMemo(
    () => [...new Set(reportData.map((i) => i.soSystemPending).filter(Boolean))].sort() as string[],
    [reportData],
  )
  const channelOptions = useMemo(
    () => [...new Set(reportData.map((i) => i.channelName).filter(Boolean))].sort() as string[],
    [reportData],
  )
  const assigneeOptions = useMemo(
    () => [...new Set(reportData.map(assigneeName).filter((n) => n !== '—'))].sort(),
    [reportData],
  )

  const filteredData = useMemo(() => {
    let data = reportData
    const q = search.trim().toLowerCase()
    if (q) {
      data = data.filter(
        (item) =>
          item.customerName?.toLowerCase().includes(q) ||
          item.soSystemNo?.toLowerCase().includes(q),
      )
    }
    if (filterPending) data = data.filter((i) => i.soSystemPending === filterPending)
    if (filterChannel) data = data.filter((i) => i.channelName === filterChannel)
    if (filterAssignee) data = data.filter((i) => assigneeName(i) === filterAssignee)
    return data
  }, [reportData, search, filterPending, filterChannel, filterAssignee])

  const uniqueChannels = useMemo(() => new Set(filteredData.map((i) => i.channelName).filter(Boolean)).size, [filteredData])
  const avgPending = useMemo(() => {
    const vals = filteredData.map((i) => i.daysPending ?? 0).filter((d) => d > 0)
    return vals.length > 0 ? vals.reduce((s, d) => s + d, 0) / vals.length : 0
  }, [filteredData])

  const handleReset = useCallback(() => {
    setSearch('')
    setFilterPending('')
    setFilterChannel('')
    setFilterAssignee('')
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending &amp; Cancel Report</h1>
        <p className="mt-1 text-sm text-gray-500">Live view of pending and cancelled sales orders.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 px-4 py-4">
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Customer, invoice…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Pending Status</label>
            <select value={filterPending} onChange={(e) => setFilterPending(e.target.value)} className={inputCls}>
              <option value="">All Statuses</option>
              {pendingOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Channel</label>
            <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)} className={inputCls}>
              <option value="">All Channels</option>
              {channelOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Assign To</label>
            <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className={inputCls}>
              <option value="">All Assignees</option>
              {assigneeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void refetch()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            {(filterPending || filterChannel || filterAssignee || search) && (
              <button onClick={handleReset} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Reset
              </button>
            )}
          </div>
        </div>

        {isLoading && <div className="h-1 w-full overflow-hidden bg-gray-100"><div className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] rounded bg-gray-400" /></div>}
        {isError && (
          <div className="mx-4 my-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            <AlertCircle size={14} /> {(error as Error)?.message ?? 'Failed to load data'}
          </div>
        )}

        {!isLoading && reportData.length === 0 && !isError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Pending Records</h2>
            <p className="mt-1 text-sm text-gray-500">No pending or cancelled orders found.</p>
          </div>
        )}

        {reportData.length > 0 && (
          <>
            {/* Stats */}
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Total Records" value={String(reportData.length)} />
                <StatCard label="Filtered" value={String(filteredData.length)} />
                <StatCard label="Unique Channels" value={String(uniqueChannels)} />
                <StatCard label="Avg Pending (days)" value={avgPending > 0 ? avgPending.toFixed(1) : '—'} accent />
              </div>
            </div>

            <div className="max-h-[calc(100vh-400px)] overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Invoice No</th>
                    <th className="px-4 py-3 font-semibold">View</th>
                    <th className="px-4 py-3 font-semibold">Invoice Date</th>
                    <th className="px-4 py-3 font-semibold">Pending Status</th>
                    <th className="px-4 py-3 font-semibold">Decision Pending</th>
                    <th className="px-4 py-3 font-semibold text-right">Days Pending</th>
                    <th className="px-4 py-3 font-semibold">Channel</th>
                    <th className="px-4 py-3 font-semibold">Assign To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">No records match the active filters</td></tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{item.customerName || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.soSystemNo || '—'}</td>
                        <td className="px-4 py-2.5">
                          {item.soSystemId != null && (
                            <button
                              onClick={() => setModalInvoiceId(item.soSystemId)}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                            >
                              <Eye size={12} /> View
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{fmtDate(item.invoiceDate)}</td>
                        <td className="px-4 py-2.5">
                          {item.soSystemPending ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              {item.soSystemPending}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{item.soDecesionPending || '—'}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">
                          {item.daysPending != null ? (
                            <span className={item.daysPending > 7 ? 'font-semibold text-red-600' : ''}>
                              {item.daysPending}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{item.channelName || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{assigneeName(item)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
              <p className="text-xs text-gray-500">Showing {filteredData.length} of {reportData.length} records</p>
            </div>
          </>
        )}
      </div>

      {modalInvoiceId != null && (
        <InvoiceDetailModal soSystemId={modalInvoiceId} onClose={() => setModalInvoiceId(null)} />
      )}
    </div>
  )
}

const inputCls = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-gray-800' : 'text-gray-700'}`}>{value}</p>
    </div>
  )
}
