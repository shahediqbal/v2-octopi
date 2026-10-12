import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, Eye, Loader2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SearchableSelect } from '@/components/dropdowns'
//import { useLatestStockOutBatchMap, useStockOutBatches, useStockOutDetail, useSubmitPackaging } from '@/hooks/useStockOut'
import { useLastThreeStockOutBatchMap, useStockOutBatches, useStockOutDetail, useSubmitPackaging } from '@/hooks/useStockOut'
import { extractApiResponseErrorMessage } from '@/pages/sales-orders/stockOutMappers'
import type { StockOutItemData, StockOutLookupOption } from '@/types/stockOut'

function formatBatchMapDate(value: string | null | undefined): string {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

// ─── per-item row ──────────────────────────────────────────────────────────────

interface EscalateRowState {
  sodProductId: number
  productName: string
  quantity: number
  unitPrice: number
  baseUnitPrice: number
  sodUnitDiscountType: string
  sodUnitDiscountRate: number
  sodUnitDiscountAmount: number
  sodUnitVatPercantage: number
  sodUnitAitPercantage: number
  sodFinalCalculatedUnitPrice: number
  sodMappedProductId: number | null
  selectedBatchIds: number[]
  itemRemark: string | null
}

function mapItemToRow(item: StockOutItemData): EscalateRowState {
  const existingBatchIds = Array.isArray(item.sodBatches)
    ? item.sodBatches.flatMap((b) => (b.batchId != null ? [b.batchId] : []))
    : []
  return {
    sodProductId: item.sodProductId,
    productName: item.productName ?? '',
    quantity: item.sodQty,
    unitPrice: item.sodUnitPrice,
    baseUnitPrice: item.sodBaseUnitPrice,
    sodUnitDiscountType: item.sodUnitDiscountType ?? 'F',
    sodUnitDiscountRate: item.sodUnitDiscountRate,
    sodUnitDiscountAmount: item.sodUnitDiscountAmount,
    sodUnitVatPercantage: item.sodUnitVatPercantage,
    sodUnitAitPercantage: item.sodUnitAitPercantage,
    sodFinalCalculatedUnitPrice: item.sodFinalCalculatedUnitPrice,
    sodMappedProductId: item.sodMappedProductId ?? null,
    selectedBatchIds: existingBatchIds,
    itemRemark: item.itemRemark ?? null,
  }
}

// ─── Last-Batch-And-Map popover ─────────────────────────────────────────────

interface LastBatchMapViewProps {
  customerId: number
  productId: number
  onClose: () => void
}

// function LastBatchMapView({ customerId, productId, onClose }: LastBatchMapViewProps) {
//   const { data, isLoading } = useLatestStockOutBatchMap(customerId, productId)
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//       <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
//         <h4 className="text-sm font-semibold text-gray-900">Last Batch &amp; Map</h4>
//         {isLoading && (
//           <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
//             <Loader2 size={14} className="animate-spin" /> Loading…
//           </div>
//         )}
//         {!isLoading && data && (
//           <dl className="mt-3 space-y-2 text-sm">
//             <div className="flex justify-between">
//               <dt className="text-gray-500">Batch No</dt>
//               <dd className="font-medium text-gray-900">{data.batchNo ?? '—'}</dd>
//             </div>
//             <div className="flex justify-between gap-3">
//               <dt className="text-gray-500">Max Invoice Date</dt>
//               <dd className="text-right font-medium text-gray-900">{formatBatchMapDate(data.maxInvoiceDate)}</dd>
//             </div>
//             <div className="flex justify-between">
//               <dt className="text-gray-500">Mapped Product</dt>
//               <dd className="font-medium text-gray-900">{data.mappedProductName ?? '—'}</dd>
//             </div>
//             <div className="flex justify-between gap-3">
//               <dt className="text-gray-500">Invoice Date</dt>
//               <dd className="text-right font-medium text-gray-900">{formatBatchMapDate(data.invoiceDate)}</dd>
//             </div>
//           </dl>
//         )}
//         {!isLoading && !data && (
//           <p className="mt-3 text-sm text-gray-500">No previous batch/map data found.</p>
//         )}
//         <div className="mt-5 flex justify-end">
//           <button
//             type="button"
//             onClick={onClose}
//             className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }
function LastBatchMapView({ customerId, productId, onClose }: LastBatchMapViewProps) {
  const { data, isLoading } = useLastThreeStockOutBatchMap(customerId, productId)

  const lastBatches = data?.lastBatches ?? []
  const lastMapProducts = data?.lastMapProducts ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              Previous Batch &amp; Mapping
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              Showing previous batch and mapped product history separately for this customer and product.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        {isLoading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        )}

        {!isLoading && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-100">
              <div className="border-b border-gray-100 bg-gray-50 px-3 py-2">
                <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Previous 3 Batches
                </h5>
              </div>

              {lastBatches.length === 0 ? (
                <p className="px-3 py-3 text-sm text-gray-500">
                  No previous batch found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                        <th className="px-3 py-2">Batch</th>
                        <th className="px-3 py-2">Invoice Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {lastBatches.map((item, index) => (
                        <tr
                          key={`${item.batchNo ?? 'batch'}-${index}`}
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {item.batchNo ?? '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {formatBatchMapDate(item.maxInvoiceDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-100">
              <div className="border-b border-gray-100 bg-gray-50 px-3 py-2">
                <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Previous 3 Mapped Products
                </h5>
              </div>

              {lastMapProducts.length === 0 ? (
                <p className="px-3 py-3 text-sm text-gray-500">
                  No previous mapped product found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                        <th className="px-3 py-2">Mapped Product</th>
                        <th className="px-3 py-2">Invoice Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {lastMapProducts.map((item, index) => (
                        <tr
                          key={`${item.sodMappedProductId ?? 'map'}-${item.invoiceDate ?? index}`}
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {item.mapProduct ?? '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {formatBatchMapDate(item.invoiceDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
// ─── single item row ────────────────────────────────────────────────────────

interface ItemRowProps {
  row: EscalateRowState
  customerId: number
  onChange: (updated: EscalateRowState) => void
}

function EscalateItemRow({ row, customerId, onChange }: ItemRowProps) {
  const { data: batchLookup, isLoading: loadingBatch } = useStockOutBatches(row.sodProductId)
  const [showLastBatch, setShowLastBatch] = useState(false)
  const [showMappedProduct, setShowMappedProduct] = useState(row.sodMappedProductId != null)

  const batches: StockOutLookupOption[] = batchLookup?.finalBatch ?? []
  const mappedItems: StockOutLookupOption[] = batchLookup?.finalMappedItem ?? []
  const batchOptions = batches.map((batch) => ({ key: batch.id, value: batch.label }))
  const mappedItemOptions = mappedItems.map((item) => ({ key: item.id, value: item.label }))
  const selectedBatchIds = row.selectedBatchIds.filter(
    (batchId, index, current) => batchId > 0 && current.indexOf(batchId) === index,
  )
  const addableBatchOptions = batchOptions.filter((option) => !selectedBatchIds.includes(option.key))

  const lineTotal = Number(row.quantity) * Number(row.unitPrice)

  const handleBatchSelectionChange = (batchIndex: number, selectedValue: number | null) => {
    if (selectedValue == null) {
      onChange({
        ...row,
        selectedBatchIds: selectedBatchIds.filter((_, index) => index !== batchIndex),
      })
      return
    }

    const nextBatchIds = [...selectedBatchIds]
    nextBatchIds[batchIndex] = selectedValue

    onChange({
      ...row,
      selectedBatchIds: nextBatchIds.filter((batchId, index, current) => current.indexOf(batchId) === index),
    })
  }

  const handleAddBatchSelection = (selectedValue: number | null) => {
    if (selectedValue == null) return

    onChange({
      ...row,
      selectedBatchIds: [...selectedBatchIds, selectedValue],
    })
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/60">
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.productName}</td>

      {/* Quantity — editable (matches legacy behaviour) */}
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          step={1}
          value={row.quantity}
          onChange={(e) => onChange({ ...row, quantity: parseFloat(e.target.value) || 0 })}
          className="w-20 rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </td>

      {/* Unit price — editable */}
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          step={0.0001}
          value={row.unitPrice}
          onChange={(e) => {
            const newPrice = parseFloat(e.target.value) || 0
            onChange({ ...row, unitPrice: newPrice, sodFinalCalculatedUnitPrice: newPrice })
          }}
          className="w-24 rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </td>

      {/* Line total — read-only */}
      <td className="px-4 py-3 text-right text-sm text-gray-700">{lineTotal.toFixed(4)}</td>

      {/* Last Batch & Map view */}
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          title="View last batch & map"
          onClick={() => setShowLastBatch(true)}
          className="inline-flex items-center justify-center rounded-md border border-gray-200 p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
        >
          <Eye size={15} />
        </button>
        {showLastBatch && (
          <LastBatchMapView
            customerId={customerId}
            productId={row.sodProductId}
            onClose={() => setShowLastBatch(false)}
          />
        )}
      </td>

      {/* Batch selection */}
      <td className="px-4 py-3">
        {loadingBatch ? (
          <Loader2 size={14} className="animate-spin text-gray-400" />
        ) : (
          <div className="space-y-2">
            {selectedBatchIds.map((batchId, batchIndex) => {
              const otherSelectedIds = selectedBatchIds.filter((_, index) => index !== batchIndex)
              const slotOptions = batchOptions.filter(
                (option) => option.key === batchId || !otherSelectedIds.includes(option.key),
              )

              return (
                <SearchableSelect
                  key={`${row.sodProductId}-batch-${batchId}-${batchIndex}`}
                  options={slotOptions}
                  value={batchId}
                  onValueChange={(selectedValue) => handleBatchSelectionChange(batchIndex, selectedValue)}
                  placeholder="Select Batch..."
                  ariaLabel={`${row.productName} batch ${batchIndex + 1}`}
                  className="w-full"
                  emptyMessage="No batch options found"
                />
              )
            })}

            <SearchableSelect
              options={addableBatchOptions}
              value={null}
              onValueChange={handleAddBatchSelection}
              placeholder={selectedBatchIds.length === 0 ? 'Select Batch...' : 'Add another batch...'}
              ariaLabel={`${row.productName} add batch`}
              className="w-full"
              emptyMessage="No batch options found"
            />

            {selectedBatchIds.length > 1 && (
              <p className="text-xs text-gray-500">{selectedBatchIds.length} batches selected</p>
            )}
          </div>
        )}
      </td>

      {/* Mapped product toggle + select */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`map-toggle-${row.sodProductId}`}
            checked={showMappedProduct}
            onChange={(e) => {
              setShowMappedProduct(e.target.checked)
              if (!e.target.checked) onChange({ ...row, sodMappedProductId: null })
            }}
            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
          />
          {showMappedProduct && (
            <div className="w-44">
              <SearchableSelect
                options={mappedItemOptions}
                value={row.sodMappedProductId}
                onValueChange={(selectedValue) =>
                  onChange({ ...row, sodMappedProductId: selectedValue })
                }
                placeholder="Map product..."
                ariaLabel={`${row.productName} mapped product`}
                className="w-full"
                emptyMessage="No mapped products found"
              />
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

export function EscalateOrderPage() {
  const { id } = useParams<{ id: string }>()
  const salesOrderId = Number(id)
  const navigate = useNavigate()

  const { data: detail, isLoading, isError, error } = useStockOutDetail(salesOrderId || undefined)
  const submitMutation = useSubmitPackaging()
  const [rows, setRows] = useState<EscalateRowState[]>([])
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (detail) {
      setRows(detail.stockOutItemsData.map(mapItemToRow))
    }
  }, [detail])

  const updateRow = (productId: number, updated: EscalateRowState) => {
    setRows((prev) => prev.map((r) => (r.sodProductId === productId ? updated : r)))
  }

  // Recompute bill from current row state so price edits are reflected in summary & payload
  const billData = detail?.stockOutBillData
  const computedSubtotal = rows.reduce((sum, r) => sum + r.quantity * r.unitPrice, 0)
  const computedTotalQuantity = rows.reduce(
  (sum, row) => sum + Number(row.quantity || 0),
  0,
)
  const computedBillDiscountAmount =
    billData?.billDiscountType === 'P'
      ? computedSubtotal * (Number(billData?.billDiscountRate ?? 0) / 100)
      : Number(billData?.billDiscountRate ?? 0)
  const computedVatAmount = computedSubtotal * (Number(billData?.billVatPercantage ?? 0) / 100)
  const computedAitAmount = computedSubtotal * (Number(billData?.billAitPercantage ?? 0) / 100)
  const computedFinalBill =
    computedSubtotal +
    computedVatAmount +
    computedAitAmount -
    computedBillDiscountAmount +
    Number(billData?.billAdjustmentAmount ?? 0)
  const computedConvertedBill =
    billData?.sobCurrencyName === 'USD' && billData?.sobCurrencyConversionRate
      ? computedFinalBill * Number(billData.sobCurrencyConversionRate)
      : computedFinalBill

  const handleSubmit = async () => {
    setServerError('')
    if (!detail) return

    const gen = detail.stockOutGeneralData
    const bill = detail.stockOutBillData

    const payload = {
      stockOutGeneralData: {
        soSystemId: gen.soSystemId,
        soSystemNo: gen.soSystemNo ?? null,
        soJobTypeId: gen.soJobTypeId,
        soOrderFromId: gen.soOrderFromId,
        invoiceDate: gen.invoiceDate ? new Date(gen.invoiceDate).toISOString() : null,
        soCurrentStatus: 0,
        soRemarks: gen.soRemarks ?? 'string',
        soDestinationChannelId: gen.soDestinationChannelId ?? 0,
        soCustomerId: gen.soCustomerId,
        soSupplierId: gen.soSupplierId ?? null,
        soPriceReview: gen.soPriceReview ?? 0,
        soCompanyId: gen.soCompanyId ?? 2,
        customerName: gen.customerName ?? null,
        supplierName: gen.supplierName ?? null,
        jobTypeName: gen.jobTypeName ?? null,
      },
      stockOutItemsData: rows.map((r) => ({
        sodProductId: r.sodProductId,
        sodMappedProductId: r.sodMappedProductId ?? null,
        sodBatches:
          r.selectedBatchIds.length > 0
            ? r.selectedBatchIds.map((batchId) => ({ batchId, batchNo: 'string' }))
            : null,
        sodRealatedBatchNo: 'string',
        productName: r.productName,
        mappedProductName: 'string',
        sodQty: r.quantity,
        sodUnitPrice: r.unitPrice,
        sodBaseUnitPrice: r.baseUnitPrice,
        sodUnitDiscountType: r.sodUnitDiscountType as 'F' | 'P',
        sodUnitDiscountRate: r.sodUnitDiscountRate,
        sodUnitDiscountAmount: r.sodUnitDiscountAmount,
        sodUnitVatPercantage: r.sodUnitVatPercantage,
        sodUnitAitPercantage: r.sodUnitAitPercantage,
        sodFinalCalculatedUnitPrice: r.sodFinalCalculatedUnitPrice,
        itemRemark: r.itemRemark ?? 'sdw',
      })),
      stockOutBillData: {
        calculatedBill: computedSubtotal,
        billDiscountType: bill.billDiscountType,
        billDiscountRate: bill.billDiscountRate,
        billDiscountAmount: computedBillDiscountAmount,
        billDiscountNote: 'steering',
        billVatPercantage: bill.billVatPercantage,
        billAitPercantage: bill.billAitPercantage,
        billAdjustmentAmount: bill.billAdjustmentAmount,
        finalBill: computedFinalBill,
        sobCurrencyName: bill.sobCurrencyName ?? 'BDT',
        sobCurrencyConversionRate: bill.sobCurrencyConversionRate ?? 1,
        sobFinalConvertedBill: computedConvertedBill,
      },
    }

    try {
      const response = await submitMutation.mutateAsync(payload as Parameters<typeof submitMutation.mutateAsync>[0])
      const responseError = extractApiResponseErrorMessage(response)
      if (responseError) {
        setServerError(responseError)
        return
      }
      navigate('/sales-orders/escalations')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to escalate. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading order…</span>
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-800">Failed to load order</p>
          <p className="mt-1 text-xs text-red-600">{(error as Error)?.message ?? 'Order not found'}</p>
        </div>
      </div>
    )
  }

  const gen = detail.stockOutGeneralData
  const bill = detail.stockOutBillData
  const currency = bill.sobCurrencyName === 'USD' ? '$' : 'TK'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/sales-orders/escalations"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoicing</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Assign batch and mapped product for each item, then escalate to the operation team.
          </p>
        </div>
      </div>

      {/* Order summary — all read-only */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Order #{gen.soSystemNo ?? salesOrderId}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">Customer / Supplier</p>
            <p className="mt-0.5 text-sm font-medium text-gray-900">
              {gen.customerName ?? gen.supplierName ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Address</p>
            <p className="mt-0.5 text-sm text-gray-700">
              {gen.customerAddress ?? gen.supplierAddress ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Order Date</p>
            <p className="mt-0.5 text-sm text-gray-700">{gen.invoiceDate ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Order Type / From</p>
            <p className="mt-0.5 text-sm text-gray-700">
              {gen.jobTypeName ?? '—'} / {gen.soOrderFromId ?? '—'}
            </p>
          </div>
        </div>
        {gen.soRemarks && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500">Remarks</p>
            <p className="mt-0.5 text-sm text-gray-700">{gen.soRemarks}</p>
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Line Total</th>
                <th className="px-4 py-3 text-center">Last B&amp;M</th>
                <th className="px-4 py-3">Batches</th>
                <th className="px-4 py-3">Mapped Product</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <EscalateItemRow
                  key={row.sodProductId}
                  row={row}
                  customerId={gen.soCustomerId ?? 0}
                  onChange={(updated) => updateRow(row.sodProductId, updated)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial summary — recomputed from row state */}
      <div className="flex justify-end">
        <div className="w-full max-w-xs space-y-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total Quantity</span>
            <span className="font-medium text-gray-900">
              {computedTotalQuantity.toFixed(4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-900">{currency} {computedSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">VAT ({bill.billVatPercantage}%)</span>
            <span className="text-gray-700">
              {currency} {computedVatAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">AIT ({bill.billAitPercantage}%)</span>
            <span className="text-gray-700">
              {currency} {computedAitAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">
              Discount{bill.billDiscountType === 'P' ? ` (${bill.billDiscountRate}%)` : ''}
            </span>
            <span className="text-gray-700">{currency} {computedBillDiscountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Adjustment</span>
            <span className="text-gray-700">{currency} {Number(bill.billAdjustmentAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-semibold text-gray-900">{currency} {computedFinalBill.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {serverError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {serverError}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
          className="action-update inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
        >
          {submitMutation.isPending && <Loader2 size={15} className="animate-spin" />}
          {submitMutation.isPending ? 'Saving…' : 'Save'}
        </button>
        <Link
          to="/sales-orders/escalations"
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </div>
  )
}
