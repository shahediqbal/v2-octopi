import { useState } from 'react'
import { Loader2, AlertCircle, StickyNote, FileText } from 'lucide-react'
import { useStickerOrders, useStickerPackingDetail, useSalesOrderDetail } from '@/hooks/useStickerPacking'
import { SalesOrderStickerModal } from '@/pages/sales-orders/SalesOrderStickerModal'
import { MiniInvoiceModal } from '@/pages/sticker-packing/MiniInvoiceModal'

const ORDER_TYPES = [
  { value: 5, label: 'Sticker for Packing' },
  { value: 4, label: 'Mini Invoice' },
]

export function PrintPanelPage() {
  const [orderType, setOrderType] = useState(5)
  const [search, setSearch] = useState('')

  const [stickerSelectedId, setStickerSelectedId] = useState<number | null>(null)
  const [stickerModalOpen, setStickerModalOpen] = useState(false)

  const [miniSelectedId, setMiniSelectedId] = useState<number | null>(null)
  const [miniModalOpen, setMiniModalOpen] = useState(false)

  const { data: orders = [], isLoading, isError } = useStickerOrders(orderType)

  const {
    data: packagingDetail,
    isLoading: loadingPackagingDetail,
    error: packagingDetailError,
  } = useStickerPackingDetail(stickerModalOpen ? (stickerSelectedId ?? undefined) : undefined)

  const {
    data: miniDetail,
    isLoading: loadingMiniDetail,
    error: miniDetailError,
  } = useSalesOrderDetail(miniModalOpen ? (miniSelectedId ?? undefined) : undefined)

  const filtered = search.trim()
    ? orders.filter(
        (o) =>
          o.soSystemNo.toLowerCase().includes(search.toLowerCase()) ||
          o.customerName.toLowerCase().includes(search.toLowerCase()),
      )
    : orders

  function openSticker(soSystemId: number) {
    setStickerSelectedId(soSystemId)
    setStickerModalOpen(true)
  }

  function openMini(soSystemId: number) {
    setMiniSelectedId(soSystemId)
    setMiniModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
          <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
            <StickyNote size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Print Module</h2>
            <p className="mt-1 text-sm text-gray-500">
              {orderType === 5 ? 'Print Sticker for Packing' : 'Print Mini Invoice'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
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
            placeholder="Search invoice / customer..."
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
            <span className="ml-3 text-sm text-gray-500">Loading orders...</span>
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
                  <th className="px-4 py-3">Order No</th>
                  <th className="px-4 py-3">Order Date</th>
                  <th className="px-4 py-3">Partner Name</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Order Type</th>
                  <th className="px-4 py-3 text-center">
                    {orderType === 5 ? 'Sticker' : 'Packing List'}
                  </th>
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
                    <td className="px-4 py-3 text-center">
                      {orderType === 5 ? (
                        <button
                          type="button"
                          onClick={() => openSticker(order.soSystemId)}
                          className="inline-flex items-center gap-1 rounded-md bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600"
                        >
                          <StickyNote size={12} />
                          Sticker
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openMini(order.soSystemId)}
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                        >
                          <FileText size={12} />
                          Packing List
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SalesOrderStickerModal
        isOpen={stickerModalOpen}
        packagingDetail={packagingDetail ?? null}
        isLoading={loadingPackagingDetail}
        errorMessage={packagingDetailError ? 'Failed to load packing detail.' : undefined}
        onClose={() => setStickerModalOpen(false)}
      />

      <MiniInvoiceModal
        isOpen={miniModalOpen}
        detail={miniDetail ?? null}
        isLoading={loadingMiniDetail}
        errorMessage={miniDetailError ? 'Failed to load order detail.' : undefined}
        onClose={() => setMiniModalOpen(false)}
      />
    </div>
  )
}
