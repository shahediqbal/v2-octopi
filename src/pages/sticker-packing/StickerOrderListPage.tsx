import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Package, PackageSearch, AlertCircle } from 'lucide-react'
import { useStickerOrders } from '@/hooks/useStickerPacking'

const ORDER_TYPES = [
  { value: 0, label: 'All' },
  { value: 2, label: 'Active' },
  { value: 4, label: 'Packaged' },
  { value: 5, label: 'Packed' },
]

export function StickerOrderListPage() {
  const navigate = useNavigate()
  const [orderType, setOrderType] = useState(5)
  const [search, setSearch] = useState('')

  const { data: orders = [], isLoading, isError } = useStickerOrders(orderType)

  const filtered = search.trim()
    ? orders.filter(
        (o) =>
          o.soSystemNo.toLowerCase().includes(search.toLowerCase()) ||
          o.customerName.toLowerCase().includes(search.toLowerCase()),
      )
    : orders

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
          <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
            <PackageSearch size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Sticker Packing — Orders</h2>
            <p className="mt-1 text-sm text-gray-500">Select an order to define or edit its packing parameters.</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Order type tabs */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1">
            {ORDER_TYPES.map((ot) => (
              <button
                key={ot.value}
                type="button"
                onClick={() => setOrderType(ot.value)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  orderType === ot.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {ot.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search invoice / customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-gray-400" />
            <span className="ml-3 text-sm text-gray-500">Loading orders…</span>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-red-500">
            <AlertCircle size={16} />
            Failed to load orders.
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">No orders found.</div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Invoice No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Job Type</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.soSystemId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{order.soSystemNo}</td>
                    <td className="px-4 py-3 text-gray-600">{order.invoiceDate?.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-gray-700">{order.customerName}</td>
                    <td className="px-4 py-3 text-gray-500">{order.customerAddress}</td>
                    <td className="px-4 py-3 text-gray-500">{order.jobType}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/sticker-packing/${order.soSystemId}/define`)}
                          className="flex items-center gap-1 rounded-md bg-gray-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-700"
                        >
                          <Package size={12} />
                          Define
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/sticker-packing/${order.soSystemId}/edit`)}
                          className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
