import { useMemo, useState } from 'react'
import { Search, Loader2, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useCustomers, useUpdateCustomerFlag } from '@/hooks/useCustomers'

type SortCol = 'id' | 'name' | 'flag'
type SortDir = 'asc' | 'desc' | 'none'

export function CustomerFlagUpdatePage() {
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<SortCol | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('none')
  const { data: customers = [], isLoading, isError } = useCustomers()
  const { mutate: updateFlag } = useUpdateCustomerFlag()

  function cycleSort(col: SortCol) {
    if (sortCol !== col) {
      setSortCol(col)
      setSortDir('asc')
    } else {
      setSortDir((prev) => (prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none'))
    }
  }

  function sortIcon(col: SortCol) {
    if (sortCol !== col || sortDir === 'none') return <ArrowUpDown size={13} className="text-gray-400" />
    return sortDir === 'asc'
      ? <ArrowUp size={13} className="text-gray-900" />
      : <ArrowDown size={13} className="text-gray-900" />
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const list = customers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.customerId.toString().includes(q),
    )
    if (!sortCol || sortDir === 'none') return list
    return [...list].sort((a, b) => {
      let cmp = 0
      if (sortCol === 'id') cmp = a.customerId - b.customerId
      else if (sortCol === 'name') cmp = a.customerName.localeCompare(b.customerName)
      else if (sortCol === 'flag') cmp = (a.customerFlag ?? 0) - (b.customerFlag ?? 0)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [customers, search, sortCol, sortDir])

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Flag for Batch Showing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Flag Customer to show Batch info in the Challan
        </p>
      </div>

      {/* search */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search by name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>

      {/* loading */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-10 justify-center">
          <Loader2 size={18} className="animate-spin" /> Loading customers…
        </div>
      )}

      {/* error */}
      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} /> Failed to load customers.
        </div>
      )}

      {/* table */}
      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-24">
                  <button type="button" onClick={() => cycleSort('id')} className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 hover:bg-gray-100 transition-colors">
                    ID {sortIcon('id')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  <button type="button" onClick={() => cycleSort('name')} className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 hover:bg-gray-100 transition-colors">
                    Customer Name {sortIcon('name')}
                  </button>
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 w-36">
                  <button
                    type="button"
                    onClick={() => cycleSort('flag')}
                    className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 hover:bg-gray-100 transition-colors"
                  >
                    Active {sortIcon('flag')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-gray-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr key={customer.customerId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{customer.customerId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{customer.customerName}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={customer.customerFlag === 1}
                        onChange={(e) =>
                          updateFlag({
                            customerId: customer.customerId,
                            customerFlag: e.target.checked ? 1 : 0,
                          })
                        }
                        className="h-4 w-4 cursor-pointer accent-gray-700"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
