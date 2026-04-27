import { useState, useMemo, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Pencil, Loader2, AlertCircle } from 'lucide-react'
import { usePaginatedCustomers } from '@/hooks/useCustomers'
import { useDebounce } from '@/hooks/useDebounce'
import type { Customer } from '@/types/customer'

export function CustomerListPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePaginatedCustomers(debouncedSearch)

  const customers = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  )
  const totalRecords = data?.pages[0]?.totalRecords ?? 0

  /* infinite scroll observer */
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      })
      if (node) observerRef.current.observe(node)
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  )

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalRecords > 0 ? `${totalRecords} total customers` : isLoading ? 'Loading…' : 'No customers'}
          </p>
        </div>
        <Link
          to="/customers/add"
          className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
        >
          <Plus size={16} /> Add Customer
        </Link>
      </div>

      {/* search bar */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or address…"
          className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      {/* loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading customers…</span>
        </div>
      )}

      {/* error */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load customers</p>
            <p className="text-xs text-red-600 mt-1">{(error as Error)?.message}</p>
          </div>
        </div>
      )}

      {/* table */}
      {!isLoading && !isError && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Customer Name</th>
                  <th className="px-5 py-3">Contact Person</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Address</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-gray-400">
                      {search ? 'No matching customers found.' : 'No customers yet.'}
                    </td>
                  </tr>
                ) : (
                  customers.map((c: Customer, index: number) => (
                    <tr
                      key={c.customerId}
                      ref={index === customers.length - 1 ? sentinelRef : undefined}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-gray-500">{c.customerId}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{c.customerName}</td>
                      <td className="px-5 py-3 text-gray-700">{c.contactPersonName ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-700">{c.contactNumber ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600 max-w-[200px] truncate">
                        {c.customerAddress ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{c.channelName ?? '—'}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={c.currentStatus} />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Link
                          to={`/customers/${c.customerId}/edit`}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Pencil size={12} /> Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* loading more indicator */}
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={20} className="animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading more…</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── helpers ─── */
function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-300">—</span>

  const colors: Record<string, string> = {
    Regular: 'bg-emerald-100 text-emerald-700',
    'Factory Closed': 'bg-red-100 text-red-700',
    Inactive: 'bg-gray-100 text-gray-600',
    Parked: 'bg-amber-100 text-amber-700',
    'Follow-Up': 'bg-blue-100 text-blue-700',
  }
  const cls = colors[status] ?? 'bg-gray-100 text-gray-600'

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}
