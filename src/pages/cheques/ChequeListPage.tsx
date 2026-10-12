import { useCallback, useMemo, useRef, useState } from 'react'
import { AlertCircle, BadgeDollarSign, Loader2, Pencil, Plus, Search, Tags } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ChequeStatusModal } from './ChequeStatusModal'
import { useDebounce } from '@/hooks/useDebounce'
import { usePaginatedCheques } from '@/hooks/useCheques'
import type { ChequeInfo } from '@/types/cheque'

const CHEQUE_STATUSES = [
  { id: 1, label: 'Pending' },
  { id: 2, label: 'Cleared' },
  { id: 3, label: 'Bounced' },
  { id: 4, label: 'Swap' },
  { id: 5, label: 'Expired' },
  { id: 6, label: 'Returned' },
  { id: 7, label: 'On Hold' },
] as const

function formatAmount(value: number | null) {
  if (value == null) return '—'
  return value.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getCollectorName(item: ChequeInfo) {
  const fullName = [item.empFirstName, item.empLastName].filter(Boolean).join(' ').trim()
  return [fullName, item.employeeCode].filter(Boolean).join(' ').trim() || '—'
}

export function ChequeListPage() {
  const [search, setSearch] = useState('')
  const [statusId, setStatusId] = useState<number | null>(null)
  const [statusChequeId, setStatusChequeId] = useState<number | null>(null)
  const debouncedSearch = useDebounce(search, 300)

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePaginatedCheques(debouncedSearch, 50, statusId)

  const cheques = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data])
  const totalRecords = data?.pages[0]?.totalRecords ?? 0
  const totalAmount = useMemo(
    () => cheques.reduce((sum, item) => sum + (item.chequeAmount ?? 0), 0),
    [cheques],
  )

  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (isFetchingNextPage) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      })
      if (node) observerRef.current.observe(node)
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cheques</h1>
            <p className="mt-1 text-sm text-gray-500">
              {totalRecords > 0 ? `${totalRecords} total cheques` : isLoading ? 'Loading…' : 'No cheques'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-gray-400">Loaded Amount</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">BDT {formatAmount(totalAmount)}</p>
          </div>
        </div>

        <Link to="/cheques/add" className="action-insert inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700">
          <Plus size={16} /> Add Cheque
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by customer, cheque no, method, collector, or address…"
          className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusId(null)}
          className={statusId === null
            ? 'rounded-full bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white'
            : 'rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50'}
        >
          All
        </button>
        {CHEQUE_STATUSES.map((status) => (
          <button
            key={status.id}
            type="button"
            onClick={() => setStatusId(status.id)}
            className={statusId === status.id
              ? 'rounded-full bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white'
              : 'rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50'}
          >
            {status.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading cheques…</span>
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load cheques</p>
            <p className="mt-1 text-xs text-red-600">{(error as Error)?.message}</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Cheque No</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Collector</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Cheque Date</th>
                  <th className="px-5 py-3">Placement</th>
                  <th className="px-5 py-3">Expiry</th>
                  <th className="px-5 py-3">Collection</th>
                  <th className="px-5 py-3">Action Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cheques.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-5 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <BadgeDollarSign size={24} className="text-gray-300" />
                        <span>{search ? 'No matching cheques found.' : 'No cheques yet.'}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cheques.map((item, index) => (
                    <tr
                      key={item.chequeInfoId}
                      ref={index === cheques.length - 1 ? sentinelRef : undefined}
                      className="transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-5 py-3 text-gray-500">{item.chequeInfoId}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/cheques/${item.chequeInfoId}/edit`}
                            className="action-update inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <Pencil size={12} /> Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setStatusChequeId(item.chequeInfoId)}
                            className="action-update inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <Tags size={12} /> Status
                          </button>
                        </div>
                      </td>
                      <td className="max-w-[220px] px-5 py-3 font-medium text-gray-900">
                        <div className="truncate">{item.customerName ?? '—'}</div>
                        <div className="truncate text-xs text-gray-500">{item.customerAddress ?? '—'}</div>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{item.chequeNumber ?? '—'}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-gray-700">{formatAmount(item.chequeAmount)}</td>
                      <td className="px-5 py-3 text-gray-700">{item.paymentMethodName ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-700">{getCollectorName(item)}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {item.paymentChequeStatusName ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{formatDate(item.chequeDate)}</td>
                      <td className="px-5 py-3 text-gray-600">{formatDate(item.chequePlacementDate)}</td>
                      <td className="px-5 py-3 text-gray-600">{formatDate(item.chequeExpireDate)}</td>
                      <td className="px-5 py-3 text-gray-600">{formatDate(item.chequeCollectionDate)}</td>
                      <td className="px-5 py-3 text-gray-600">{formatDate(item.chequeActionDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={20} className="animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading more…</span>
            </div>
          )}
        </div>
      )}

      {statusChequeId != null && (
        <ChequeStatusModal chequeId={statusChequeId} onClose={() => setStatusChequeId(null)} />
      )}
    </div>
  )
}