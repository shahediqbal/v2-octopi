import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { usePiByStatus } from '@/hooks/useLcTracking'
import { apiClient } from '@/lib/api'
import type { ApiResponse, LcPaymentListItem, PiByStatus } from '@/types/lcTracking'

const TH = 'px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white'
const TD = 'px-4 py-3 text-center text-sm text-gray-800'

function getLatestPayment(payments: LcPaymentListItem[]) {
  return [...payments].sort((left, right) => {
    const idDiff = (right.paymentSystemId ?? 0) - (left.paymentSystemId ?? 0)
    if (idDiff !== 0) return idDiff

    return new Date(right.paymentDate ?? '').getTime() - new Date(left.paymentDate ?? '').getTime()
  })[0]
}

export function LcPaymentCompletedPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [loadingLcDocId, setLoadingLcDocId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')

  const { data: piList = [], isLoading, isError } = usePiByStatus(4)

  const rows = piList as PiByStatus[]
  const total = rows.length
  const pageCount = Math.ceil(total / rowsPerPage)
  const start = page * rowsPerPage
  const end = Math.min(start + rowsPerPage, total)
  const pageRows = rows.slice(start, end)

  const handleView = async (row: PiByStatus) => {
    if (!row.lcDocId) {
      setActionError('Selected row does not have an LC document id.')
      return
    }

    setActionError('')
    setLoadingLcDocId(row.lcDocId)

    try {
      const response = await apiClient.get<ApiResponse<LcPaymentListItem[]>>(
        `/CustomerPayment/GetLCPaymentHistory/${row.lcDocId}`,
      )
      const latestPayment = getLatestPayment(response.dataObj ?? [])

      if (!latestPayment?.paymentSystemId) {
        throw new Error('No LC payment history found for the selected LC document.')
      }

      navigate(`/lc/payment/${latestPayment.paymentSystemId}/view`, {
        state: { returnTo: '/lc/payments/completed' },
      })
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to load payment details.')
    } finally {
      setLoadingLcDocId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">LC Payment Completed</h1>
        <p className="mt-0.5 text-sm text-gray-500">List of completed LC payments (Status = 4)</p>
      </div>

      {actionError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={18} className="mt-0.5 text-red-500" />
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={26} className="animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="flex items-start gap-3 p-6">
            <AlertCircle size={18} className="mt-0.5 text-red-500" />
            <p className="text-sm text-red-700">Failed to load completed LC documents.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#013220' }}>
                  <th className={TH}>PI System</th>
                  <th className={TH}>PI Number</th>
                  <th className={TH}>PI Ref</th>
                  <th className={TH}>PI Date</th>
                  <th className={TH}>Customer Name</th>
                  <th className={TH}>LC Number</th>
                  <th className={TH}>LC Date</th>
                  <th className={TH}>LC Doc Id</th>
                  <th className={TH}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-gray-400">
                      No completed LC payments available
                    </td>
                  </tr>
                ) : (
                  pageRows.map((pi) => {
                    const isRowLoading = loadingLcDocId === pi.lcDocId

                    return (
                      <tr key={pi.piSystemId} className="hover:bg-gray-50">
                        <td className={TD}>{pi.piSystemId}</td>
                        <td className={TD}>{pi.piNumber}</td>
                        <td className={TD}>{pi.piRef}</td>
                        <td className={TD}>{pi.piDate ? pi.piDate.split('T')[0] : '—'}</td>
                        <td className={TD}>{pi.customerName}</td>
                        <td className={TD}>{pi.lcNumber ?? '—'}</td>
                        <td className={TD}>{pi.lcDate ? pi.lcDate.split('T')[0] : '—'}</td>
                        <td className={TD}>{pi.lcDocId ?? '—'}</td>
                        <td className={TD}>
                          <button
                            type="button"
                            disabled={!pi.lcDocId || isRowLoading}
                            onClick={() => void handleView(pi)}
                            className="inline-flex items-center gap-1 rounded border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
                          >
                            {isRowLoading ? (
                              <>
                                <Loader2 size={12} className="animate-spin" /> Loading...
                              </>
                            ) : (
                              <>
                                <Eye size={12} /> View
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && total > 0 && (
          <div className="flex items-center justify-end gap-6 border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0) }}
                className="rounded border border-gray-300 px-1 py-0.5 text-sm focus:outline-none"
              >
                {[10, 20, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <span>
              {start + 1}–{end} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}