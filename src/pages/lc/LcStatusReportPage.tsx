import { useState } from 'react'
import { Loader2, AlertCircle, Download } from 'lucide-react'
import { usePiList } from '@/hooks/useLcTracking'
import { formatDate } from '@/lib/utils'
import type { ProformaInvoice } from '@/types/lcTracking'

const STATUS_CONFIG: Record<number, { label: string; cls: string }> = {
  0: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
  1: { label: 'Submitted', cls: 'bg-amber-100 text-amber-700' },
  2: { label: 'LC Created', cls: 'bg-emerald-100 text-emerald-700' },
  3: { label: 'Payment Done', cls: 'bg-gray-100 text-gray-500' },
}

export function LcStatusReportPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | null>(null)

  const { data: piList = [], isLoading, isError } = usePiList()

  const filtered = (piList as ProformaInvoice[]).filter((pi) => {
    const matchesSearch =
      pi.piNumber?.toLowerCase().includes(search.toLowerCase()) ||
      pi.customerName?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === null || pi.piStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleExport = async () => {
    const { lazyExportExcel } = await import('@/lib/lazyExportExcel')
    lazyExportExcel({
      filename: 'LC-Status-Report',
      sheetName: 'LC Status',
      headers: ['PI Number', 'Customer', 'PI Date', 'Currency', 'Status'],
      rows: filtered.map((pi) => [
        pi.piNumber ?? '',
        pi.customerName ?? '',
        pi.piDate ? formatDate(pi.piDate) : '',
        pi.piCurrency ?? '',
        STATUS_CONFIG[pi.piStatus ?? 0]?.label ?? '',
      ]),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">LC Status Report</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Full lifecycle tracking: PI → LC → Document → Payment
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={isLoading || filtered.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          <Download size={15} /> Export Excel
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search PI number or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === null ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(Number(key))}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === Number(key) ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = piList.filter((pi) => pi.piStatus === Number(key)).length
            return (
              <div
                key={key}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50"
                onClick={() => setStatusFilter(statusFilter === Number(key) ? null : Number(key))}
              >
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
                  {cfg.label}
                </span>
                <p className="mt-2 text-2xl font-bold text-gray-900">{count}</p>
              </div>
            )
          })}
        </div>
      )}

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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3 text-left">PI Number</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">PI Date</th>
                  <th className="px-5 py-3 text-left">Currency</th>
                  <th className="px-5 py-3 text-left">Beneficiary Bank</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                      {search || statusFilter !== null
                        ? 'No matching records.'
                        : 'No proforma invoices found.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((pi) => {
                    const statusInfo = STATUS_CONFIG[pi.piStatus ?? 0] ?? STATUS_CONFIG[0]
                    return (
                      <tr key={pi.piSystemId} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 font-medium text-gray-900">{pi.piNumber}</td>
                        <td className="px-5 py-3 text-gray-700">{pi.customerName}</td>
                        <td className="px-5 py-3 text-gray-500">
                          {pi.piDate ? formatDate(pi.piDate) : '—'}
                        </td>
                        <td className="px-5 py-3 text-gray-600">{pi.piCurrency}</td>
                        <td className="px-5 py-3 text-gray-600">{pi.beneficiaryBankName ?? '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.cls}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
