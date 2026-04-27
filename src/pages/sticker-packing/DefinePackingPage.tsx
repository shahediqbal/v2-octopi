import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Save, ArrowLeft, PackagePlus } from 'lucide-react'
import { useSalesOrderInternalDetail, usePackTypes, useCreateStickerPacking } from '@/hooks/useStickerPacking'
import { useDropdown } from '@/hooks/useDropdown'
import { PackingItemRow } from '@/components/sticker-packing/PackingItemRow'
import { useToastStore } from '@/stores/toastStore'
import type { PackingItem } from '@/types/stickerPacking'

export function DefinePackingPage() {
  const { id } = useParams<{ id: string }>()
  const soSystemId = Number(id)
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)

  const { data: orderDetail, isLoading: loadingOrder, isError: orderError } = useSalesOrderInternalDetail(soSystemId)
  const { data: packTypes = [], isLoading: loadingPackTypes } = usePackTypes()
  const { data: employeeOptions = [] } = useDropdown('employeebychannel')
  const createMutation = useCreateStickerPacking()

  const employees = employeeOptions.map((e) => ({ id: e.key, label: e.value }))

  const [items, setItems] = useState<PackingItem[]>([])

  useEffect(() => {
    if (!orderDetail) return
    setItems(
      orderDetail.stockOutItemsData.map((item, idx) => ({
        index: `${item.sodProductId}-${idx}`,
        productId: item.sodProductId,
        productName: item.productName ?? `Product ${item.sodProductId}`,
        packSize: '',
        packNo: '',
        packQuantity: 0,
        quantity: item.sodConfirmedQty ?? 0,
        sopPackId: null,
        packedBy: null,
      })),
    )
  }, [orderDetail])

  function handleChange(index: string, updates: Partial<PackingItem>) {
    setItems((prev) => prev.map((it) => (it.index === index ? { ...it, ...updates } : it)))
  }

  function handleDelete(index: string) {
    setItems((prev) => prev.filter((it) => it.index !== index))
  }

  function handleAddRow() {
    const newIndex = `extra-${Date.now()}`
    setItems((prev) => [
      ...prev,
      {
        index: newIndex,
        productId: 0,
        productName: '— Extra Row —',
        packSize: '',
        packNo: '',
        packQuantity: 0,
        quantity: 0,
        sopPackId: null,
        packedBy: null,
      },
    ])
  }

  function handleSubmit() {
    const hasInvalid = items.some(
      (it) => !Number(it.packSize) || !Number(it.packNo),
    )
    if (hasInvalid) {
      showToast({ message: 'Please fill pack size and pack count for all rows.', type: 'error' })
      return
    }

    createMutation.mutate(
      {
        soSystemId,
        stockOutPackagingItems: items.map((it) => ({
          sopProductId: it.productId,
          sopPackSize: Number(it.packSize),
          sopNoPack: Number(it.packNo),
          sopProductQty: Number(it.packSize) * Number(it.packNo),
          sopPackId: it.sopPackId,
          packedBy: it.packedBy,
        })),
      },
      {
        onSuccess: () => {
          showToast({ message: 'Packing defined successfully', type: 'success' })
          navigate('/sticker-packing/orders')
        },
        onError: () => {
          showToast({ message: 'Failed to save packing. Please try again.', type: 'error' })
        },
      },
    )
  }

  if (loadingOrder || loadingPackTypes) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={22} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading order…</span>
      </div>
    )
  }

  if (orderError || !orderDetail) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-red-500">
        <AlertCircle size={16} />
        Failed to load sales order.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
          <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
            <PackagePlus size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Define Packing</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {orderDetail.soSystemNo} — {orderDetail.customerName}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600 md:grid-cols-4">
          <div>
            <span className="font-medium text-gray-500">Invoice No</span>
            <p className="text-gray-900">{orderDetail.soSystemNo}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Customer</span>
            <p className="text-gray-900">{orderDetail.customerName}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Date</span>
            <p className="text-gray-900">{orderDetail.invoiceDate?.slice(0, 10)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Job Type</span>
            <p className="text-gray-900">{orderDetail.jobType}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3 text-right">Qty</th>
                <th className="px-3 py-3">Pack Size</th>
                <th className="px-3 py-3">Pack Type</th>
                <th className="px-3 py-3">No. of Packs</th>
                <th className="px-3 py-3 text-right">Pack Qty</th>
                <th className="px-3 py-3">Packed By</th>
                <th className="px-3 py-3 text-center">—</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <PackingItemRow
                  key={item.index}
                  item={item}
                  packTypes={packTypes}
                  employees={employees}
                  onChange={handleChange}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={handleAddRow}
            className="text-sm text-gray-500 hover:text-gray-800 underline"
          >
            + Add row
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || items.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save Packing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
