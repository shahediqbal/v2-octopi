import { useMemo, useState } from 'react'
import { Search, Loader2, AlertCircle } from 'lucide-react'
import { useCustomers, useUpdateCustomerFlag } from '@/hooks/useCustomers'

export function CustomerFlagUpdatePage() {
  const [search, setSearch] = useState('')
  const { data: customers = [], isLoading, isError } = useCustomers()
  const { mutate: updateFlag } = useUpdateCustomerFlag()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return customers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.customerId.toString().includes(q),
    )
  }, [customers, search])

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Flag Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Toggle the active status for each customer.
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
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-24">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer Name</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 w-28">Active</th>
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
