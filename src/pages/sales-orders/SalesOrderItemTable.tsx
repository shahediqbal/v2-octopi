import { useState } from 'react'
import { type Control, type FieldArrayWithId, type FieldErrors, type UseFormRegister, Controller } from 'react-hook-form'
import { Loader2, Trash2 } from 'lucide-react'
import { calculateProductLineTotal, parseNumeric } from '@/features/stock-out/calculations'
import { getStockOutFieldRule } from '@/features/stock-out/fieldRules'
import { useStockOutBatches } from '@/hooks/useStockOut'
import type { StockOutFormValues } from '@/schemas/stockOutSchema'
import type { EditMode } from '@/types/stockOut'

interface SalesOrderItemTableProps {
  mode?: EditMode
  hidePricingColumns?: boolean
  register: UseFormRegister<StockOutFormValues>
  control?: Control<StockOutFormValues>
  fields: FieldArrayWithId<StockOutFormValues, 'items', 'id'>[]
  errors: FieldErrors<StockOutFormValues>
  onRemove: (index: number) => void
  values: StockOutFormValues['items']
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'

// ─── per-row Map? + Batch # cells for admin-price-edit ──────────────────────

interface PriceEditCellsProps {
  index: number
  productId: number
  control: Control<StockOutFormValues>
}

function PriceEditCells({ index, productId, control }: PriceEditCellsProps) {
  const { data: batchLookup, isLoading } = useStockOutBatches(productId)
  const batches = batchLookup?.finalBatch ?? []
  const mappedItems = batchLookup?.finalMappedItem ?? []

  return (
    <>
      {/* Map? */}
      <td className="px-4 py-3">
        <Controller
          control={control}
          name={`items.${index}.sodMappedProductId`}
          render={({ field }) => {
            const [showSelect, setShowSelect] = useState(field.value != null)
            return (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showSelect}
                  onChange={(e) => {
                    setShowSelect(e.target.checked)
                    if (!e.target.checked) field.onChange(null)
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                />
                {showSelect && (
                  isLoading ? (
                    <Loader2 size={14} className="animate-spin text-gray-400" />
                  ) : (
                    <select
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                      className="w-44 rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                      <option value="">— Map product —</option>
                      {mappedItems.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  )
                )}
              </div>
            )
          }}
        />
      </td>
      {/* Batch # */}
      <td className="px-4 py-3">
        <Controller
          control={control}
          name={`items.${index}.sodBatchId`}
          render={({ field }) => (
            isLoading ? (
              <Loader2 size={14} className="animate-spin text-gray-400" />
            ) : (
              <select
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <option value="">— Select batch —</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
            )
          )}
        />
      </td>
    </>
  )
}

const numericInput = {
  setValueAs: (value: string | number | null | undefined) => {
    if (value === '' || value === undefined || value === null) {
      return Number.NaN
    }

    return Number(value)
  },
}

export function SalesOrderItemTable({
  mode = 'standard',
  hidePricingColumns = false,
  register,
  control,
  fields,
  errors,
  onRemove,
  values,
}: SalesOrderItemTableProps) {
  const productRule = getStockOutFieldRule(mode, 'product')
  const quantityRule = getStockOutFieldRule(mode, 'quantity')
  const priceRule = getStockOutFieldRule(mode, 'price')
  const discountRule = getStockOutFieldRule(mode, 'discount')
  const taxRule = getStockOutFieldRule(mode, 'tax')
  const canRemove = productRule === 'editable'
  const showRemark = mode !== 'standard' && mode !== 'admin-price-edit'
  const showPriceEditCols = mode === 'admin-price-edit'
  const showPriceColumn = !hidePricingColumns && priceRule !== 'hidden'
  const showDiscountColumns = !hidePricingColumns && discountRule !== 'hidden'
  const showTaxColumns = !hidePricingColumns && taxRule !== 'hidden'
  const showLineTotalColumn = !hidePricingColumns
  const columnCount =
    2 +
    (showPriceColumn ? 1 : 0) +
    (showDiscountColumns ? 2 : 0) +
    (showTaxColumns ? 2 : 0) +
    (showLineTotalColumn ? 1 : 0) +
    (showRemark ? 1 : 0) +
    (showPriceEditCols ? 2 : 0) +
    (canRemove ? 1 : 0)

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 text-center">Quantity</th>
              {showPriceColumn && <th className="px-4 py-3 text-center">Price</th>}
              {showDiscountColumns && <th className="px-4 py-3">Discount</th>}
              {showDiscountColumns && <th className="px-4 py-3">Type</th>}
              {showTaxColumns && <th className="px-4 py-3">VAT %</th>}
              {showTaxColumns && <th className="px-4 py-3">AIT %</th>}
              {showLineTotalColumn && <th className="px-4 py-3 text-center">Line Total</th>}
              {showRemark && <th className="px-4 py-3">Remark</th>}
              {showPriceEditCols && <th className="px-4 py-3 text-center">Map?</th>}
              {showPriceEditCols && <th className="px-4 py-3 text-center">Batch #</th>}
              {canRemove && <th className="px-4 py-3 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fields.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-4 py-6 text-center text-sm text-gray-400">
                  No items added yet. Use the product picker above to add items.
                </td>
              </tr>
            )}
            {fields.map((field, index) => {
              const rowValue = values[index]
              const qty = parseNumeric(rowValue?.quantity)
              const price = parseNumeric(rowValue?.unitPrice)
              const lineTotal = (qty * price).toFixed(4)
              const calculation = calculateProductLineTotal({
                unitPrice: rowValue?.unitPrice,
                quantity: rowValue?.quantity,
                discount: rowValue?.discountRate,
                discountType: rowValue?.discountType,
                vatRate: rowValue?.vatRate,
                aitRate: rowValue?.aitRate,
              })

              const itemErrors = errors.items?.[index]

              return (
                <tr key={field.id} className="align-top hover:bg-gray-50">
                  <td className="min-w-[12rem] px-4 py-3">
                    <span className="text-sm font-medium text-gray-900">
                      {rowValue?.productLabel || `Product #${rowValue?.productId || '—'}`}
                    </span>
                    {itemErrors?.productId?.message && (
                      <p className="mt-1 text-xs text-red-600">{String(itemErrors.productId.message)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3" style={{ minWidth: '80px' }}>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      {...register(`items.${index}.quantity`, numericInput)}
                      className={inputCls + ' text-center'}
                      readOnly={quantityRule !== 'editable'}
                    />
                    {itemErrors?.quantity?.message && (
                      <p className="mt-1 text-xs text-red-600">{String(itemErrors.quantity.message)}</p>
                    )}
                  </td>
                  {showPriceColumn && (
                    <td className="px-4 py-3" style={{ minWidth: '100px' }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.unitPrice`, numericInput)}
                        className={inputCls + ' text-right'}
                        readOnly={priceRule !== 'editable'}
                      />
                      {itemErrors?.unitPrice?.message && (
                        <p className="mt-1 text-xs text-red-600">{String(itemErrors.unitPrice.message)}</p>
                      )}
                    </td>
                  )}
                  {showDiscountColumns && (
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        {...register(`items.${index}.discountRate`, numericInput)}
                        className={inputCls}
                        readOnly={discountRule !== 'editable'}
                      />
                      {itemErrors?.discountRate?.message && (
                        <p className="mt-1 text-xs text-red-600">{String(itemErrors.discountRate.message)}</p>
                      )}
                    </td>
                  )}
                  {showDiscountColumns && (
                    <td className="px-4 py-3">
                      <select {...register(`items.${index}.discountType`)} className={inputCls} disabled={discountRule !== 'editable'}>
                        <option value="F">Fixed</option>
                        <option value="P">Percent</option>
                      </select>
                    </td>
                  )}
                  {showTaxColumns && (
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        {...register(`items.${index}.vatRate`, numericInput)}
                        className={inputCls}
                        readOnly={taxRule !== 'editable'}
                      />
                    </td>
                  )}
                  {showTaxColumns && (
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        {...register(`items.${index}.aitRate`, numericInput)}
                        className={inputCls}
                        readOnly={taxRule !== 'editable'}
                      />
                    </td>
                  )}
                  {showLineTotalColumn && (
                    <td className="px-4 py-3 text-right font-medium text-gray-900" style={{ minWidth: '110px' }}>
                      {discountRule === 'hidden' && taxRule === 'hidden' ? lineTotal : calculation.lineTotal}
                    </td>
                  )}
                  {showRemark && (
                    <td className="min-w-[12rem] px-4 py-3">
                      <input {...register(`items.${index}.itemRemark`)} className={inputCls} placeholder="Optional note" readOnly={mode === 'admin-packing-edit'} />
                    </td>
                  )}
                  {showPriceEditCols && control && (
                    <PriceEditCells
                      index={index}
                      productId={rowValue?.productId ?? 0}
                      control={control}
                    />
                  )}
                  {canRemove && (
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}