import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Download, Loader2, AlertCircle, Eye, Pencil, FileCheck, FileText } from 'lucide-react'
import { useQuotations } from '@/hooks/useQuotation'
import { formatDate } from '@/lib/utils'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import { QuotationViewModal } from './QuotationViewModal'

interface QuotationListPageProps {
  /** undefined = all, "unapproved" = pending, "approved" = approved */
  mode?: 'unapproved' | 'approved'
}

function modeToOrder(mode?: 'unapproved' | 'approved'): string {
  if (mode === 'unapproved') return '0'
  if (mode === 'approved') return '1'
  return '-1'
}

function modeLabel(mode?: 'unapproved' | 'approved'): string {
  if (mode === 'unapproved') return 'Pending Quotations'
  if (mode === 'approved') return 'Approved Quotations'
  return 'All Quotations'
}

export function QuotationListPage({ mode }: QuotationListPageProps) {
  const order = modeToOrder(mode)
  const { data: quotations = [], isLoading, isError, error } = useQuotations(order)
  const [viewId, setViewId] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportExcelOnDemand({
        filename: `quotations-${mode ?? 'all'}`,
        sheetName: 'Quotations',
        columns: [
          { header: 'Quotation #', key: 'pqSystemNo', width: 20 },
          { header: 'Customer', key: 'customerName', width: 35 },
          { header: 'Date', key: 'pqOrderDate', width: 18 },
        ],
        rows: quotations.map((q) => ({
          ...q,
          pqOrderDate: q.pqOrderDate ? formatDate(q.pqOrderDate) : '',
        })),
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{modeLabel(mode)}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Loading…' : `${quotations.length} quotation${quotations.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            Export
          </button>
          <Link
            to="/quotations/create"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
          >
            <Plus size={15} /> New Quotation
          </Link>
        </div>
      </div>

      {/* Tab links */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { label: 'All', to: '/quotations' },
          { label: 'Pending', to: '/quotations/unapproved' },
          { label: 'Approved', to: '/quotations/approved' },
        ].map((tab) => {
          const isActive =
            (tab.to === '/quotations' && !mode) ||
            (tab.to === '/quotations/unapproved' && mode === 'unapproved') ||
            (tab.to === '/quotations/approved' && mode === 'approved')
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-b-2 border-gray-900 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading quotations…</span>
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{(error as Error)?.message ?? 'Failed to load quotations'}</p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Quotation #</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quotations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <FileText size={24} className="text-gray-300" />
                        <span>No quotations found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  quotations.map((q, idx) => (
                    <tr key={q.pqSystemId} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{q.pqSystemNo}</td>
                      <td className="px-5 py-3 text-gray-700">{q.customerName}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {q.pqOrderDate ? formatDate(q.pqOrderDate) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewId(q.pqSystemId)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <Eye size={12} /> View
                          </button>
                          <Link
                            to={`/quotations/${q.pqSystemId}/edit`}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <Pencil size={12} /> Edit
                          </Link>
                          {!mode || mode === 'unapproved' ? (
                            <Link
                              to={`/quotations/${q.pqSystemId}/approve`}
                              className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                            >
                              <FileCheck size={12} /> Approve
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewId !== null && (
        <QuotationViewModal quotationId={viewId} onClose={() => setViewId(null)} />
      )}
    </div>
  )
}
