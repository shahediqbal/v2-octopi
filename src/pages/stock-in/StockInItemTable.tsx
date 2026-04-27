// ============================================================
// Stock-In — Shared Item Table Component
// ============================================================
import { Fragment, useState } from 'react'
import { Trash2, Plus, Layers, Package } from 'lucide-react'
import type { StockInEditMode } from '@/types/stockIn'
import type { StockInItemFormData, StockInBatchFormData, StockInPackFormData } from '@/schemas/stockInSchema'
import { isEditable, isReadonly } from '@/features/stock-in/fieldRules'
import { calculateLineTotal } from '@/features/stock-in/calculations'
import { BatchModal } from '@/pages/stock-in/BatchModal'
import { PackModal } from '@/pages/stock-in/PackModal'
import {
  normalizeStockInBatchForForm,
  normalizeStockInPackForForm,
} from '@/pages/stock-in/stockInMappers'
import { useStockInBatchAndMappedItems } from '@/hooks/useStockIn'

interface StockInItemTableProps {
  mode?: StockInEditMode
  items: StockInItemFormData[]
  onItemChange: (index: number, field: keyof StockInItemFormData, value: unknown) => void
  onItemPatch?: (index: number, patch: Partial<StockInItemFormData>) => void
  onRemoveItem: (index: number) => void
  /** Shown for Loan_Receive order type */
  showMappedProduct?: boolean
  /** If true, show confirmed qty column instead of declared qty (ConfirmQty mode) */
  showConfirmedQty?: boolean
  readOnlyView?: boolean
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'

interface BatchPanelState {
  itemIndex: number
  batchIndex: number | null   // null = new batch
}

interface PackPanelState {
  itemIndex: number
  packIndex: number | null    // null = new pack
}

function getBatchNumber(batch: StockInBatchFormData) {
  return batch.batchNo ?? batch.batchNumber ?? '—'
}

function getBatchExpiry(batch: StockInBatchFormData) {
  return batch.batchExpiryDate ?? batch.expiryDate ?? '—'
}

function getPackSize(pack: StockInPackFormData) {
  return pack.sipPackSize ?? pack.packDetails ?? '—'
}

function getPackQuantity(pack: StockInPackFormData) {
  return pack.sipPackQty ?? pack.packQuantity ?? null
}

// Separate component so that useQuery can be called per-row (hooks inside loops are forbidden)
function MappedProductCell({
  item,
  index,
  editable,
  onItemChange,
  onItemPatch,
}: {
  item: StockInItemFormData
  index: number
  editable: boolean
  onItemChange: (index: number, field: keyof StockInItemFormData, value: unknown) => void
  onItemPatch?: (index: number, patch: Partial<StockInItemFormData>) => void
}) {
  const { data, isLoading } = useStockInBatchAndMappedItems(item.sidProductId ?? undefined)
  const mappedItems = data?.mappedItems ?? []

  return (
    <select
      value={item.sidMappedProductId ?? ''}
      onChange={(e) => {
        const id = Number(e.target.value) || null
        const label = mappedItems.find((m) => m.id === id)?.label ?? null
        if (onItemPatch) {
          onItemPatch(index, {
            sidMappedProductId: id,
            sidMappedProductName: label,
          })
          return
        }

        onItemChange(index, 'sidMappedProductId', id)
        onItemChange(index, 'sidMappedProductName', label)
      }}
      disabled={!editable || isLoading}
      className="block w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500"
    >
      <option value="">{isLoading ? 'Loading…' : '— Select mapped product —'}</option>
      {mappedItems.map((m) => (
        <option key={m.id} value={m.id}>
          {m.label}
        </option>
      ))}
    </select>
  )
}

export function StockInItemTable({
  mode = 'standard',
  items,
  onItemChange,
  onItemPatch,
  onRemoveItem,
  showMappedProduct = false,
  showConfirmedQty = false,
  readOnlyView = false,
}: StockInItemTableProps) {
  const [batchModal, setBatchModal] = useState<BatchPanelState | null>(null)
  const [packModal, setPackModal] = useState<PackPanelState | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const qtyEditable = isEditable(mode, 'declaredQty') && !readOnlyView
  const priceEditable = isEditable(mode, 'declaredUnitPrice') && !readOnlyView
  const productEditable = isEditable(mode, 'product') && !readOnlyView
  const batchesEditable = isEditable(mode, 'batches') && !readOnlyView
  const packsEditable = isEditable(mode, 'packs') && !readOnlyView

  function toggleRow(index: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function handleBatchSave(batch: StockInBatchFormData) {
    if (!batchModal) return
    const { itemIndex, batchIndex } = batchModal
    const item = items[itemIndex]
    const currentBatches = item.sidBatches ?? []
    const normalizedBatch = normalizeStockInBatchForForm({
      ...batch,
      batchId: batch.batchId ?? (batchIndex === null ? currentBatches.length : batch.batchId),
    })
    if (batchIndex === null) {
      onItemChange(itemIndex, 'sidBatches', [...currentBatches, normalizedBatch])
    } else {
      const updated = currentBatches.map((b, i) => (i === batchIndex ? normalizedBatch : b))
      onItemChange(itemIndex, 'sidBatches', updated)
    }
    setBatchModal(null)
  }

  function handlePackSave(pack: StockInPackFormData) {
    if (!packModal) return
    const { itemIndex, packIndex } = packModal
    const item = items[itemIndex]
    const currentPacks = item.sidPacks ?? []
    const normalizedPack = normalizeStockInPackForForm(pack)
    if (packIndex === null) {
      onItemChange(itemIndex, 'sidPacks', [...currentPacks, normalizedPack])
    } else {
      const updated = currentPacks.map((p, i) => (i === packIndex ? normalizedPack : p))
      onItemChange(itemIndex, 'sidPacks', updated)
    }
    setPackModal(null)
  }

  function removeBatch(itemIndex: number, batchIndex: number) {
    const item = items[itemIndex]
    const updated = (item.sidBatches ?? []).filter((_, i) => i !== batchIndex)
    onItemChange(itemIndex, 'sidBatches', updated)
  }

  function removePack(itemIndex: number, packIndex: number) {
    const item = items[itemIndex]
    const updated = (item.sidPacks ?? []).filter((_, i) => i !== packIndex)
    onItemChange(itemIndex, 'sidPacks', updated)
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Product</th>
                {showMappedProduct && <th className="px-4 py-3">Mapped Product</th>}
                <th className="px-4 py-3 text-right">Declared Qty</th>
                {showConfirmedQty && <th className="px-4 py-3 text-right">Confirmed Qty</th>}
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Line Total</th>
                <th className="px-4 py-3 text-center">Batches</th>
                <th className="px-4 py-3 text-center">Packs</th>
                {productEditable && <th className="px-4 py-3 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={showMappedProduct ? 10 : 9}
                    className="px-4 py-8 text-center text-sm text-gray-400"
                  >
                    No items added yet. Use the product picker below to add items.
                  </td>
                </tr>
              )}
              {items.map((item, index) => {
                const lineTotal = calculateLineTotal(item.sidDeclaredQty, item.sidDeclaredUnitPrice)
                const isExpanded = expandedRows.has(index)
                const batchCount = (item.sidBatches ?? []).length
                const packCount = (item.sidPacks ?? []).length

                return (
                  <Fragment key={`row-${index}`}>
                    <tr className="align-middle hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{index + 1}</td>

                      {/* Product Name */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{item.productName || `Product #${item.sidProductId}`}</span>
                        {item.sidProductStrength && (
                          <span className="ml-1 text-xs text-gray-500">({item.sidProductStrength})</span>
                        )}
                      </td>

                      {/* Mapped Product (Loan_Receive) */}
                      {showMappedProduct && (
                        <td className="px-4 py-3 min-w-[200px]">
                          {productEditable ? (
                            <MappedProductCell
                              item={item}
                              index={index}
                              editable={productEditable}
                              onItemChange={onItemChange}
                              onItemPatch={onItemPatch}
                            />
                          ) : (
                            <span className="text-gray-700">{item.sidMappedProductName ?? '—'}</span>
                          )}
                        </td>
                      )}

                      {/* Declared Qty */}
                      <td className="px-4 py-3 text-right">
                        {qtyEditable ? (
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={item.sidDeclaredQty ?? ''}
                            onChange={(e) =>
                              onItemChange(index, 'sidDeclaredQty', Number(e.target.value) || 0)
                            }
                            className={inputCls + ' w-24 text-right'}
                          />
                        ) : (
                          <span>{item.sidDeclaredQty}</span>
                        )}
                      </td>

                      {/* Confirmed Qty (if applicable) */}
                      {showConfirmedQty && (
                        <td className="px-4 py-3 text-right">
                          <span className="text-gray-700">{item.sidConfirmedQty ?? '—'}</span>
                        </td>
                      )}

                      {/* Unit Price */}
                      <td className="px-4 py-3 text-right">
                        {priceEditable ? (
                          <input
                            type="number"
                            step="0.0001"
                            min="0"
                            value={item.sidDeclaredUnitPrice ?? ''}
                            onChange={(e) =>
                              onItemChange(
                                index,
                                'sidDeclaredUnitPrice',
                                Number(e.target.value) || 0,
                              )
                            }
                            className={inputCls + ' w-28 text-right'}
                          />
                        ) : (
                          <span>{item.sidDeclaredUnitPrice?.toFixed(4)}</span>
                        )}
                      </td>

                      {/* Line Total */}
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {lineTotal.toFixed(4)}
                      </td>

                      {/* Batch count / actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleRow(index)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                          >
                            <Layers className="h-3.5 w-3.5" />
                            {batchCount > 0 ? batchCount : 'View'}
                          </button>
                          {batchesEditable && (
                            <button
                              type="button"
                              onClick={() => setBatchModal({ itemIndex: index, batchIndex: null })}
                              className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                            >
                              <Plus className="h-3 w-3" />
                              Add
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Pack count / actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleRow(index)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                          >
                            <Package className="h-3.5 w-3.5" />
                            {packCount > 0 ? packCount : 'View'}
                          </button>
                          {packsEditable && (
                            <button
                              type="button"
                              onClick={() => setPackModal({ itemIndex: index, packIndex: null })}
                              className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                            >
                              <Plus className="h-3 w-3" />
                              Add
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Remove action */}
                      {productEditable && (
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => onRemoveItem(index)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>

                    {/* Expanded Batch/Pack Details */}
                    {isExpanded && (
                      <tr key={`expanded-${index}`}>
                        <td
                          colSpan={showMappedProduct ? 10 : productEditable ? 9 : 8}
                          className="bg-gray-50 px-8 py-4"
                        >
                          <div className="grid grid-cols-2 gap-6">
                            {/* Batches */}
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Batches
                              </p>
                              {(item.sidBatches ?? []).length === 0 ? (
                                <p className="text-xs text-gray-400">No batches added.</p>
                              ) : (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-left text-gray-500">
                                      <th className="pb-1 pr-4">Batch No.</th>
                                      <th className="pb-1 pr-4">Production</th>
                                      <th className="pb-1 pr-4">Expiry</th>
                                      <th className="pb-1 pr-4">Certificate</th>
                                      <th className="pb-1 pr-4">Test Date</th>
                                      <th className="pb-1 pr-4">Qty</th>
                                      {batchesEditable && <th className="pb-1">Actions</th>}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(item.sidBatches ?? []).map((b, bi) => (
                                      <tr key={bi} className="border-t border-gray-100">
                                        <td className="py-1 pr-4">{getBatchNumber(b)}</td>
                                        <td className="py-1 pr-4">{b.batchProductionDate || '—'}</td>
                                        <td className="py-1 pr-4">{getBatchExpiry(b)}</td>
                                        <td className="py-1 pr-4">{b.batchCertificateNo || '—'}</td>
                                        <td className="py-1 pr-4">{b.batchTestDate || '—'}</td>
                                        <td className="py-1 pr-4">{b.quantity ?? '—'}</td>
                                        {batchesEditable && (
                                          <td className="py-1">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setBatchModal({ itemIndex: index, batchIndex: bi })
                                              }
                                              className="mr-2 text-gray-500 hover:text-gray-800 underline"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => removeBatch(index, bi)}
                                              className="text-red-500 hover:text-red-700 underline"
                                            >
                                              Remove
                                            </button>
                                          </td>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>

                            {/* Packs */}
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Packs
                              </p>
                              {(item.sidPacks ?? []).length === 0 ? (
                                <p className="text-xs text-gray-400">No packs added.</p>
                              ) : (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-left text-gray-500">
                                      <th className="pb-1 pr-4">Pack Type</th>
                                      <th className="pb-1 pr-4">Pack Size</th>
                                      <th className="pb-1 pr-4">Qty</th>
                                      <th className="pb-1 pr-4">Remarks</th>
                                      {packsEditable && <th className="pb-1">Actions</th>}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(item.sidPacks ?? []).map((p, pi) => (
                                      <tr key={pi} className="border-t border-gray-100">
                                        <td className="py-1 pr-4">{p.packTypeName ?? '—'}</td>
                                        <td className="py-1 pr-4">{getPackSize(p)}</td>
                                        <td className="py-1 pr-4">{getPackQuantity(p) ?? '—'}</td>
                                        <td className="py-1 pr-4">{p.sipPackRemarks ?? '—'}</td>
                                        {packsEditable && (
                                          <td className="py-1">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setPackModal({ itemIndex: index, packIndex: pi })
                                              }
                                              className="mr-2 text-gray-500 hover:text-gray-800 underline"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => removePack(index, pi)}
                                              className="text-red-500 hover:text-red-700 underline"
                                            >
                                              Remove
                                            </button>
                                          </td>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>

            {/* Footer Totals */}
            {items.length > 0 && (
              <tfoot className="border-t border-gray-200 bg-gray-50">
                <tr>
                  <td
                    colSpan={showMappedProduct ? (productEditable ? 6 : 5) : productEditable ? 5 : 4}
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Subtotal
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {items
                      .reduce(
                        (sum, item) =>
                          sum + calculateLineTotal(item.sidDeclaredQty, item.sidDeclaredUnitPrice),
                        0,
                      )
                      .toFixed(4)}
                  </td>
                  <td colSpan={productEditable ? 3 : 2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Batch Modal */}
      <BatchModal
        open={batchModal !== null}
        batch={
          batchModal !== null && batchModal.batchIndex !== null
            ? items[batchModal.itemIndex]?.sidBatches?.[batchModal.batchIndex] ?? null
            : null
        }
        onSave={handleBatchSave}
        onClose={() => setBatchModal(null)}
      />

      {/* Pack Modal */}
      <PackModal
        open={packModal !== null}
        pack={
          packModal !== null && packModal.packIndex !== null
            ? items[packModal.itemIndex]?.sidPacks?.[packModal.packIndex] ?? null
            : null
        }
        onSave={handlePackSave}
        onClose={() => setPackModal(null)}
      />
    </>
  )
}
