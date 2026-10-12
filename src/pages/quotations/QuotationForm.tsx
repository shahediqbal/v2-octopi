import { useEffect } from 'react'
import { useFieldArray, useWatch } from 'react-hook-form'
import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { PaginatedCombobox } from '@/components/dropdowns'
import { calculateQuotationLineItem } from '@/features/quotation/calculations'
import type { QuotationFormValues } from '@/schemas/quotationSchema'
import { formatCurrency } from '@/lib/utils'

interface QuotationFormProps {
  control: Control<QuotationFormValues>
  errors: FieldErrors<QuotationFormValues>
  setValue: UseFormSetValue<QuotationFormValues>
  isSubmitting: boolean
  /** If true, customer and currency fields are locked (edit mode) */
  lockHeader?: boolean
}

const defaultItem = {
  pqdProductId: 0,
  productName: '',
  pqdProductUnitPrice: 0,
  pqdAppliedVatPercantage: 0,
  pqdAppliedAitPercantage: 0,
  pqdIncreasedType: 'F',
  pqdIncreasedAmount: 0,
  pqdAdustedAmount: 0,
  adjustableType: 'plus' as const,
  pqdCalculatedPrice: 0,
  pqdFinalPrice: 0,
}

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
const smallInputClass =
  'w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-200'

/** Inner component that watches a single row and recalculates on change */
function QuotationLineItemRow({
  index,
  control,
  setValue,
  onRemove,
}: {
  index: number
  control: Control<QuotationFormValues>
  setValue: UseFormSetValue<QuotationFormValues>
  onRemove: () => void
}) {
  const unitPrice = useWatch({ control, name: `items.${index}.pqdProductUnitPrice` })
  const vatPct = useWatch({ control, name: `items.${index}.pqdAppliedVatPercantage` })
  const aitPct = useWatch({ control, name: `items.${index}.pqdAppliedAitPercantage` })
  const adjAmount = useWatch({ control, name: `items.${index}.pqdAdustedAmount` })
  const adjType = useWatch({ control, name: `items.${index}.adjustableType` })

  useEffect(() => {
    const { calculatedPrice, finalPrice } = calculateQuotationLineItem({
      unitPrice: unitPrice ?? 0,
      vatPercent: vatPct ?? 0,
      aitPercent: aitPct ?? 0,
      adjustableAmount: adjAmount ?? 0,
      adjustableType: adjType === 'minus' ? 'minus' : 'plus',
    })
    setValue(`items.${index}.pqdCalculatedPrice`, calculatedPrice)
    setValue(`items.${index}.pqdFinalPrice`, finalPrice)
  }, [unitPrice, vatPct, aitPct, adjAmount, adjType, index, setValue])

  const calculatedPrice = useWatch({ control, name: `items.${index}.pqdCalculatedPrice` })
  const finalPrice = useWatch({ control, name: `items.${index}.pqdFinalPrice` })
  const productName = useWatch({ control, name: `items.${index}.productName` })
  const currency = useWatch({ control, name: 'pqCurrencyName' })

  return (
    <tr className="border-b border-gray-100">
      {/* Product */}
      <td className="px-3 py-2 min-w-[200px]">
        <Controller
          name={`items.${index}.pqdProductId`}
          control={control}
          render={({ field }) => (
            <PaginatedCombobox
              type="product"
              value={field.value || null}
              onValueChange={(value) => {
                field.onChange(value)
                if (value == null) {
                  setValue(`items.${index}.productName`, '')
                }
              }}
              onLabelChange={(label) => setValue(`items.${index}.productName`, label ?? '')}
              selectedLabel={productName || null}
              placeholder="Select product…"
            />
          )}
        />
      </td>

      {/* Unit Price */}
      <td className="px-3 py-2 min-w-[110px]">
        <Controller
          name={`items.${index}.pqdProductUnitPrice`}
          control={control}
          render={({ field }) => (
            <input
              type="number"
              min={0}
              step="0.01"
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className={smallInputClass}
            />
          )}
        />
      </td>

      {/* VAT % */}
      <td className="px-3 py-2 min-w-[80px]">
        <Controller
          name={`items.${index}.pqdAppliedVatPercantage`}
          control={control}
          render={({ field }) => (
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className={smallInputClass}
            />
          )}
        />
      </td>

      {/* AIT % */}
      <td className="px-3 py-2 min-w-[80px]">
        <Controller
          name={`items.${index}.pqdAppliedAitPercantage`}
          control={control}
          render={({ field }) => (
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className={smallInputClass}
            />
          )}
        />
      </td>

      {/* Adjustable Amount */}
      <td className="px-3 py-2 min-w-[120px]">
        <div className="flex items-center gap-1">
          <Controller
            name={`items.${index}.adjustableType`}
            control={control}
            render={({ field }) => (
              <select
                value={field.value}
                onChange={field.onChange}
                className="rounded border border-gray-300 bg-white px-1.5 py-1.5 text-sm text-gray-700 focus:outline-none"
              >
                <option value="plus">+</option>
                <option value="minus">−</option>
              </select>
            )}
          />
          <Controller
            name={`items.${index}.pqdAdustedAmount`}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                min={0}
                step="0.01"
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
                className={smallInputClass}
              />
            )}
          />
        </div>
      </td>

      {/* Calculated Price (read-only) */}
      <td className="px-3 py-2 text-right text-sm text-gray-600 whitespace-nowrap">
        {formatCurrency(calculatedPrice ?? 0, currency)}
      </td>

      {/* Final Price (read-only) */}
      <td className="px-3 py-2 text-right text-sm font-semibold text-gray-900 whitespace-nowrap">
        {formatCurrency(finalPrice ?? 0, currency)}
      </td>

      {/* Remove */}
      <td className="px-3 py-2 text-center">
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  )
}

export function QuotationForm({
  control,
  errors,
  setValue,
  isSubmitting,
  lockHeader = false,
}: QuotationFormProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const currency = useWatch({ control, name: 'pqCurrencyName' })

  return (
    <div className="space-y-6">
      {/* Header fields */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Customer */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Customer <span className="text-red-500">*</span>
          </label>
          <Controller
            name="customerId"
            control={control}
            render={({ field, fieldState }) => (
              <PaginatedCombobox
                type="customer"
                value={field.value ?? null}
                onValueChange={field.onChange}
                hasError={!!fieldState.error}
                disabled={lockHeader}
                placeholder="Search customer…"
              />
            )}
          />
          {errors.customerId && (
            <p className="mt-1 text-xs text-red-600">{errors.customerId.message}</p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Currency</label>
          <Controller
            name="pqCurrencyName"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                {['BDT', 'USD'].map((c) => (
                  <label
                    key={c}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                      field.value === c
                        ? 'border-gray-800 bg-gray-800 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    } ${lockHeader ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      value={c}
                      checked={field.value === c}
                      onChange={() => field.onChange(c)}
                      disabled={lockHeader}
                    />
                    {c}
                  </label>
                ))}
              </div>
            )}
          />
        </div>
      </div>

      {/* Line items */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Products</h3>
          <span className="text-xs text-gray-400">{currency}</span>
        </div>

        {errors.items && typeof errors.items.message === 'string' && (
          <p className="mb-2 text-xs text-red-600">{errors.items.message}</p>
        )}

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-3 py-2.5 text-left">Product</th>
                <th className="px-3 py-2.5 text-left">Unit Price</th>
                <th className="px-3 py-2.5 text-left">VAT %</th>
                <th className="px-3 py-2.5 text-left">AIT %</th>
                <th className="px-3 py-2.5 text-left">Adj. Amount</th>
                <th className="px-3 py-2.5 text-right">Calc. Price</th>
                <th className="px-3 py-2.5 text-right">Final Price</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {fields.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-xs">
                    Add products below
                  </td>
                </tr>
              ) : (
                fields.map((field, index) => (
                  <QuotationLineItemRow
                    key={field.id}
                    index={index}
                    control={control}
                    setValue={setValue}
                    onRemove={() => remove(index)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={() => append({ ...defaultItem })}
          disabled={isSubmitting}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-50"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>
    </div>
  )
}
