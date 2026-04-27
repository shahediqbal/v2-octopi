import { useMemo, useState } from 'react'
import { Download, Loader2, Search, X } from 'lucide-react'
import { useAllCheques } from '@/hooks/useReviewCockpit'
import { toCurrency, toDateLabel, toNumber, chequeStatusColor } from '@/pages/sales-orders/review-cockpit/format'
import { exportExcel } from '@/utils/exportExcel'

interface ChequeDetailsModalProps {
  customerId: number | null
  onClose: () => void
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: '1', label: 'Pending' },
  { value: '2', label: 'Cleared' },
  { value: '3', label: 'Bounced' },
  { value: '4', label: 'Swap' },
  { value: '5', label: 'Expired' },
  { value: '6', label: 'Returned' },
  { value: '7', label: 'On Hold' },
]

export function ChequeDetailsModal({ customerId, onClose }: ChequeDetailsModalProps) {
  const { data, isLoading, isError, error } = useAllCheques(customerId, true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    const rows = data ?? []
    return rows.filter((r) => {
      if (statusFilter && String(r.chequeStatusId) !== statusFilter) return false
      if (search.trim()) {
        const lower = search.toLowerCase()
        return (
          (r.chequeNo ?? r.chequeNumber ?? '').toLowerCase().includes(lower) ||
          (r.bankName ?? r.chequeBankName ?? '').toLowerCase().includes(lower) ||
          (r.chequeStatusName ?? '').toLowerCase().includes(lower) ||
          (r.customerName ?? '').toLowerCase().includes(lower)
        )
      }
      return true
    })
  }, [data, search, statusFilter])

  const metrics = useMemo(() => {
    let total = 0
    for (const r of filtered) total += toNumber(r.chequeAmount)
    return { count: filtered.length, total, avg: filtered.length > 0 ? total / filtered.length : 0 }
  }, [filtered])

  function handleExport() {
    exportExcel({
      fileName: `Cheque_Report_${new Date().toISOString().slice(0, 10)}`,
      title: 'Customer Cheque Report',
      columns: [
        { key: 'serial_no', header: 'S/N', format: 'integer' },
        { key: 'chequeNo', header: 'Cheque No' },
        { key: 'chequeDate', header: 'Cheque Date' },
        { key: 'chequeExpireDate', header: 'Expire Date' },
        { key: 'bankName', header: 'Bank' },
        { key: 'beneficiaryBank', header: 'Beneficiary Bank' },
        { key: 'chequeStatusName', header: 'Status' },
        { key: 'chequeAmount', header: 'Amount', format: 'number' },
        { key: 'customerName', header: 'Customer' },
        { key: 'collectedBy', header: 'Collected By' },
        { key: 'collectionDate', header: 'Collection Date' },
        { key: 'actionDate', header: 'Action Date' },
      ],
      data: filtered.map((r, idx) => ({
        serial_no: idx + 1,
        chequeNo: r.chequeNo ?? r.chequeNumber ?? '',
        chequeDate: toDateLabel(r.chequeDate),
        chequeExpireDate: toDateLabel(r.chequeExpireDate),
        bankName: r.bankName ?? r.chequeBankName ?? '',
        beneficiaryBank: r.beneficiaryBank ?? '',
        chequeStatusName: r.chequeStatusName ?? '',
        chequeAmount: toNumber(r.chequeAmount),
        customerName: r.customerName ?? '',
        collectedBy: [r.empFirstName, r.empLastName].filter(Boolean).join(' '),
        collectionDate: toDateLabel(r.chequeCollectionDate),
        actionDate: toDateLabel(r.chequeActionDate),
      })),
      summaryCards: [
        ['Count', String(metrics.count)],
        ['Total', toCurrency(metrics.total)],
        ['Average', toCurrency(metrics.avg)],
      ],
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Cheques</h2>
            <p className="mt-1 text-sm text-gray-500">Complete cheque history</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
              <span className="ml-3 text-sm text-gray-500">Loading cheques…</span>
            </div>
          )}
          {isError && <p className="text-sm text-red-600">{(error as Error)?.message}</p>}

          {!isLoading && !isError && (
            <>
              {/* Metrics */}
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-gray-100 p-3 text-center">
                  <div className="text-xs text-gray-500">Total Count</div>
                  <div className="mt-0.5 text-lg font-bold text-gray-900">{metrics.count}</div>
                </div>
                <div className="rounded-lg bg-gray-100 p-3 text-center">
                  <div className="text-xs text-gray-500">Total Amount</div>
                  <div className="mt-0.5 text-sm font-bold text-gray-900">{toCurrency(metrics.total)}</div>
                </div>
                <div className="rounded-lg bg-gray-100 p-3 text-center">
                  <div className="text-xs text-gray-500">Average</div>
                  <div className="mt-0.5 text-sm font-bold text-gray-900">{toCurrency(metrics.avg)}</div>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-4 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search cheque no, bank, customer…"
                    className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button type="button" onClick={handleExport} disabled={filtered.length === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  <Download size={14} /> Excel
                </button>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="max-h-[calc(92vh-400px)] overflow-x-auto overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-100 text-left text-gray-600">
                      <tr>
                        <th className="whitespace-nowrap px-3 py-2">Cheque No</th>
                        <th className="whitespace-nowrap px-3 py-2">Date</th>
                        <th className="whitespace-nowrap px-3 py-2">Expire</th>
                        <th className="whitespace-nowrap px-3 py-2">Bank</th>
                        <th className="whitespace-nowrap px-3 py-2">Beneficiary</th>
                        <th className="whitespace-nowrap px-3 py-2">Status</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right">Amount</th>
                        <th className="whitespace-nowrap px-3 py-2">Customer</th>
                        <th className="whitespace-nowrap px-3 py-2">Collected By</th>
                        <th className="whitespace-nowrap px-3 py-2">Collection</th>
                        <th className="whitespace-nowrap px-3 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-3 py-2 font-mono text-gray-800">{row.chequeNo ?? row.chequeNumber ?? '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{toDateLabel(row.chequeDate)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{toDateLabel(row.chequeExpireDate)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{row.bankName ?? row.chequeBankName ?? '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{row.beneficiaryBank ?? '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${chequeStatusColor(row.chequeStatusId)}`}>
                              {row.chequeStatusName ?? '—'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-900">{toCurrency(row.chequeAmount)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{row.customerName ?? '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{[row.empFirstName, row.empLastName].filter(Boolean).join(' ') || '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{toDateLabel(row.chequeCollectionDate)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{toDateLabel(row.chequeActionDate)}</td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr><td colSpan={11} className="px-3 py-6 text-center text-gray-500">No cheques found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Showing {filtered.length} of {(data ?? []).length} cheques
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
