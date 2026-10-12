import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Save, ArrowLeft, PackageOpen } from 'lucide-react'
import { useStickerPackingDetail, usePackTypes, useUpdateStickerPacking } from '@/hooks/useStickerPacking'
import { useEmployeeOptions } from '@/hooks/useEmployees'
import { PackingItemRow } from '@/components/sticker-packing/PackingItemRow'
import { useToastStore } from '@/stores/toastStore'
import type { PackingItem } from '@/types/stickerPacking'

interface StickerPackingRowValue extends PackingItem {
  delete?: 1
}

function parsePackingNumber(value: number | string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatPackingNumber(value: number) {
  return value.toFixed(4)
}

function calculatePackQuantity(packSize: number | string, packNo: number | string) {
  return formatPackingNumber(parsePackingNumber(packSize) * parsePackingNumber(packNo))
}

function hasPackingValues(row: StickerPackingRowValue) {
  return Boolean(row.packSize || row.packNo || row.packQuantity || row.sopPackId || row.packedBy)
}

function createSplitRow(
  row: StickerPackingRowValue,
  options: { preserveSelections?: boolean } = {},
): StickerPackingRowValue {
  return {
    index: `${row.productId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId: row.productId,
    productName: row.productName,
    quantity: row.quantity,
    packSize: '',
    packNo: '',
    packQuantity: '',
    sopPackId: options.preserveSelections ? row.sopPackId : null,
    packedBy: options.preserveSelections ? row.packedBy : null,
    delete: 1,
  }
}

function rebalanceStickerRows(rows: StickerPackingRowValue[], changedIndex: string) {
  const changedRow = rows.find((row) => row.index === changedIndex)
  if (!changedRow) return rows

  if (parsePackingNumber(changedRow.packQuantity) > changedRow.quantity + 0.0001) {
    return rows.map((row) =>
      row.index === changedIndex
        ? { ...row, packSize: '', packNo: '', packQuantity: '' }
        : row,
    )
  }

  const productRows = rows.filter((row) => row.productId === changedRow.productId)
  const totalPacked = productRows.reduce((sum, row) => sum + parsePackingNumber(row.packQuantity), 0)
  const remaining = changedRow.quantity - totalPacked
  const hasEmptySplit = productRows.some((row) => row.delete === 1 && !row.packSize && !row.packNo)

  if (remaining > 0.0001 && !hasEmptySplit) {
    const insertIndex = rows.findIndex((row) => row.index === changedIndex)
    const nextRows = [...rows]
    nextRows.splice(insertIndex + 1, 0, createSplitRow(changedRow, { preserveSelections: true }))
    return nextRows
  }

  if (remaining <= 0.0001) {
    return rows.filter(
      (row) => !(row.productId === changedRow.productId && row.delete === 1 && !row.packSize && !row.packNo),
    )
  }

  return rows
}

function updateStickerRow(rows: StickerPackingRowValue[], index: string, updates: Partial<PackingItem>) {
  const nextRows = rows.map((row) => {
    if (row.index !== index) return row

    const updated: StickerPackingRowValue = { ...row, ...updates }
    if ('packSize' in updates || 'packNo' in updates) {
      updated.packQuantity = calculatePackQuantity(updated.packSize, updated.packNo)
    }

    return updated
  })

  return rebalanceStickerRows(nextRows, index)
}

function removeStickerRow(rows: StickerPackingRowValue[], index: string) {
  const target = rows.find((row) => row.index === index)
  if (!target) return rows

  const filtered = rows.filter((row) => row.index !== index)
  if (target.delete === 1 && !hasPackingValues(target)) {
    return filtered
  }

  const productRows = filtered.filter((row) => row.productId === target.productId)
  if (productRows.length === 0) {
    return filtered
  }

  const totalPacked = productRows.reduce((sum, row) => sum + parsePackingNumber(row.packQuantity), 0)
  const hasEmptySplit = productRows.some((row) => row.delete === 1 && !hasPackingValues(row))
  if (totalPacked < target.quantity - 0.0001 && !hasEmptySplit) {
    return [...filtered, createSplitRow(target, { preserveSelections: true })]
  }

  return filtered
}

export function EditPackingPage() {
  const { id } = useParams<{ id: string }>()
  const soSystemId = Number(id)
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)

  const { data: detail, isLoading, isError } = useStickerPackingDetail(soSystemId)
  const { data: packTypes = [], isLoading: loadingPackTypes } = usePackTypes()
  const { data: employees = [] } = useEmployeeOptions()
  const updateMutation = useUpdateStickerPacking()
  const [items, setItems] = useState<StickerPackingRowValue[]>([])

  useEffect(() => {
    if (!detail) return
    setItems(
      detail.stockOutPackagingItems.map((item, idx) => ({
        index: `${item.sopProductId}-${idx}`,
        productId: item.sopProductId,
        productName: item.productName,
        packSize: item.sopPackSize,
        packNo: item.sopNoPack,
        packQuantity: item.sopProductQty,
        quantity: item.sodConfirmedQty,
        sopPackId: item.sopPackId,
        packedBy: item.packedBy,
      })),
    )
  }, [detail])

  function handleChange(index: string, updates: Partial<PackingItem>) {
    setItems((prev) => updateStickerRow(prev, index, updates))
  }

  function handleDelete(index: string) {
    setItems((prev) => removeStickerRow(prev, index))
  }

  function handleSubmit() {
    const hasInvalid = items.some((it) => !Number(it.packSize) || !Number(it.packNo))
    if (hasInvalid) {
      showToast({ message: 'Please fill pack size and pack count for all rows.', type: 'error' })
      return
    }

    updateMutation.mutate(
      items.map((it) => ({
          soSystemId,
          sopProductId: it.productId,
          sopPackSize: Number(it.packSize),
          sopNoPack: Number(it.packNo),
          sopProductQty: Number(it.packSize) * Number(it.packNo),
          sopPackId: it.sopPackId,
          packedBy: it.packedBy,
        })),
      {
        onSuccess: () => {
          showToast({ message: 'Packing updated successfully', type: 'success' })
          navigate('/sticker-packing/orders')
        },
        onError: () => {
          showToast({ message: 'Failed to update packing. Please try again.', type: 'error' })
        },
      },
    )
  }

  if (isLoading || loadingPackTypes) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={22} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading packing detail…</span>
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-red-500">
        <AlertCircle size={16} />
        Failed to load packing detail.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
          <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
            <PackageOpen size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Edit Packing</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {detail.soSystemNo} — {detail.customerName}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <span className="font-medium text-gray-500">Invoice No</span>
            <p className="text-gray-900">{detail.soSystemNo}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Customer</span>
            <p className="text-gray-900">{detail.customerName}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Date</span>
            <p className="text-gray-900">{detail.invoiceDate?.slice(0, 10)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Job Type</span>
            <p className="text-gray-900">{detail.jobType}</p>
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

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-4 py-3">
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
            disabled={updateMutation.isPending || items.length === 0}
            className="action-update flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Update Packing
          </button>
        </div>
      </div>
    </div>
  )
}
