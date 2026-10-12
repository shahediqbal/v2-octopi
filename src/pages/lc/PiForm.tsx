import { useEffect } from 'react'
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormSetValue,
  useFieldArray,
  useWatch,
} from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import type { PiFormValues } from '@/schemas/lcTrackingSchema'
import { PaginatedCombobox } from '@/components/dropdowns/PaginatedCombobox'
import { DropdownSelect } from '@/components/dropdowns/DropdownSelect'
import { usePiItemPrice, usePiNumbers } from '@/hooks/useLcTracking'
import { formatCurrency } from '@/lib/utils'

const INPUT =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
const ERROR_INPUT = 'w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200'
const LABEL = 'mb-1 block text-sm font-medium text-gray-700'
const ERR_MSG = 'mt-1 text-xs text-red-600'

interface PiFormProps {
  control: Control<PiFormValues>
  errors: FieldErrors<PiFormValues>
  setValue: UseFormSetValue<PiFormValues>
  isSubmitting: boolean
  lockHeader?: boolean
}

// ─── Line Item Row ───────────────────────────────────────────────────────────
function PiLineItemRow({
  index,
  control,
  errors,
  setValue,
  customerId,
  currency,
  onRemove,
}: {
  index: number
  control: Control<PiFormValues>
  errors: FieldErrors<PiFormValues>
  setValue: UseFormSetValue<PiFormValues>
  customerId: number
  currency: string
  onRemove: () => void
}) {
  const productId = useWatch({ control, name: `items.${index}.piProductId` })
  const qty = useWatch({ control, name: `items.${index}.piProductQuantity` })

  const { data: priceData } = usePiItemPrice(
    productId > 0 ? productId : null,
    customerId > 0 ? customerId : null,
    qty ?? 1,
  )

  // Auto-fill price when product/customer/qty changes
  useEffect(() => {
    if (priceData != null) {
      setValue(`items.${index}.piProductPrice`, priceData)
    }
  }, [priceData, index, setValue])

  // Recompute line total
  const price = useWatch({ control, name: `items.${index}.piProductPrice` })
  const convRate = useWatch({ control, name: `items.${index}.piProductPriceConvertionRate` })
  useEffect(() => {
    const q = qty ?? 0
    const p = price ?? 0
    const r = convRate ?? 1
    setValue(`items.${index}.piLineTotalAmount`, q * p * r)
  }, [qty, price, convRate, index, setValue])

  const lineTotal = useWatch({ control, name: `items.${index}.piLineTotalAmount` })
  const itemErrors = errors.items?.[index]

  return (
    <tr className="hover:bg-gray-50/50">
      {/* Product */}
      <td className="px-3 py-2.5 min-w-[180px]">
        <Controller
          name={`items.${index}.piProductId`}
          control={control}
          render={({ field }) => (
            <PaginatedCombobox
              type="product"
              value={field.value || null}
              onValueChange={(v) => field.onChange(v ?? 0)}
              hasError={!!itemErrors?.piProductId}
            />
          )}
        />
        {itemErrors?.piProductId && <p className={ERR_MSG}>{itemErrors.piProductId.message}</p>}
      </td>

      {/* Qty */}
      <td className="px-3 py-2.5 w-24">
        <Controller
          name={`items.${index}.piProductQuantity`}
          control={control}
          render={({ field }) => (
            <input
              type="number"
              min={1}
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className={itemErrors?.piProductQuantity ? ERROR_INPUT : INPUT}
            />
          )}
        />
      </td>

      {/* Price */}
      <td className="px-3 py-2.5 w-32">
        <Controller
          name={`items.${index}.piProductPrice`}
          control={control}
          render={({ field }) => (
            <input
              type="number"
              step="0.01"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className={itemErrors?.piProductPrice ? ERROR_INPUT : INPUT}
            />
          )}
        />
      </td>

      {/* Conv. Rate */}
      <td className="px-3 py-2.5 w-28">
        <Controller
          name={`items.${index}.piProductPriceConvertionRate`}
          control={control}
          render={({ field }) => (
            <input
              type="number"
              step="0.0001"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className={INPUT}
            />
          )}
        />
      </td>

      {/* Line Total (computed) */}
      <td className="px-3 py-2.5 w-32 text-right text-sm font-semibold text-gray-900">
        {formatCurrency(lineTotal ?? 0, currency)}
      </td>

      {/* Remove */}
      <td className="px-3 py-2.5 w-10 text-center">
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  )
}

// ─── Main PiForm ─────────────────────────────────────────────────────────────
export function PiForm({ control, errors, setValue, lockHeader }: PiFormProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const customerId = useWatch({ control, name: 'piCustmomerId' }) ?? 0
  const currency = useWatch({ control, name: 'piCurrency' }) ?? 'USD'
  const mapWithExistingPi = useWatch({ control, name: 'mapWithExistingPi' }) ?? false

  const { data: piNumbers = [], isFetching: loadingPiNumbers } = usePiNumbers(
    customerId > 0 ? customerId : null,
  )

  // Clear piNumberMapped when checkbox is unchecked
  useEffect(() => {
    if (!mapWithExistingPi) setValue('piNumberMapped', null)
  }, [mapWithExistingPi, setValue])

  const addRow = () =>
    append({
      piProductId: 0,
      piProductQuantity: 1,
      piProductPrice: 0,
      piProductPriceConvertionRate: 1,
      piLineTotalAmount: 0,
    })

  return (
    <div className="space-y-6">
      {/* ── Header fields ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Customer */}
        <div>
          <label className={LABEL}>Customer *</label>
          <Controller
            name="piCustmomerId"
            control={control}
            render={({ field }) => (
              <PaginatedCombobox
                type="customer"
                value={field.value || null}
                onValueChange={(v) => field.onChange(v ?? 0)}
                hasError={!!errors.piCustmomerId}
                disabled={lockHeader}
              />
            )}
          />
          {errors.piCustmomerId && <p className={ERR_MSG}>{errors.piCustmomerId.message}</p>}
        </div>

        {/* PI Date */}
        <div>
          <label className={LABEL}>PI Date *</label>
          <Controller
            name="piDate"
            control={control}
            render={({ field }) => (
              <input
                type="date"
                {...field}
                className={errors.piDate ? ERROR_INPUT : INPUT}
              />
            )}
          />
          {errors.piDate && <p className={ERR_MSG}>{errors.piDate.message}</p>}
        </div>

        {/* Reference */}
        <div>
          <label className={LABEL}>Reference (PI No / Ref)</label>
          <Controller
            name="piRef"
            control={control}
            render={({ field }) => (
              <input type="text" {...field} className={INPUT} placeholder="Optional reference" />
            )}
          />
        </div>

        {/* Currency */}
        <div>
          <label className={LABEL}>Currency</label>
          <div className="flex gap-3 pt-1">
            {['USD', 'BDT'].map((cur) => (
              <label key={cur} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <Controller
                  name="piCurrency"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="radio"
                      checked={field.value === cur}
                      onChange={() => field.onChange(cur)}
                      className="accent-gray-800"
                    />
                  )}
                />
                {cur}
              </label>
            ))}
          </div>
        </div>

        {/* Conversion Rate */}
        <div>
          <label className={LABEL}>Conversion Rate</label>
          <Controller
            name="piConversionRate"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                step="0.0001"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                className={INPUT}
              />
            )}
          />
        </div>

        {/* Beneficiary Bank */}
        <div>
          <label className={LABEL}>Beneficiary Bank *</label>
          <Controller
            name="piBenificaryBankId"
            control={control}
            render={({ field, fieldState }) => (
              <DropdownSelect
                type="bank"
                value={field.value || null}
                onValueChange={(v) => field.onChange(v ?? 0)}
                placeholder="Select bank"
                hasError={!!fieldState.error}
              />
            )}
          />
          {errors.piBenificaryBankId && <p className={ERR_MSG}>{errors.piBenificaryBankId.message}</p>}
        </div>

        {/* Branch Location */}
        <div>
          <label className={LABEL}>Branch Location *</label>
          <Controller
            name="piBranchBankLocationId"
            control={control}
            render={({ field }) => (
              <PaginatedCombobox
                type="location"
                value={field.value || null}
                onValueChange={(v) => field.onChange(v ?? 0)}
                hasError={!!errors.piBranchBankLocationId}
              />
            )}
          />
          {errors.piBranchBankLocationId && <p className={ERR_MSG}>{errors.piBranchBankLocationId.message}</p>}
        </div>

        {/* Payment Terms */}
        <div>
          <label className={LABEL}>Payment Terms *</label>
          <Controller
            name="lcPaymentTermsId"
            control={control}
            render={({ field, fieldState }) => (
              <DropdownSelect
                type="lcPaymentTerms"
                value={field.value || null}
                onValueChange={(v) => field.onChange(v ?? 0)}
                placeholder="Select payment terms"
                hasError={!!fieldState.error}
              />
            )}
          />
          {errors.lcPaymentTermsId && <p className={ERR_MSG}>{errors.lcPaymentTermsId.message}</p>}
        </div>

        {/* Map with Existing PI Number */}
        <div className="sm:col-span-2">
          <Controller
            name="mapWithExistingPi"
            control={control}
            render={({ field }) => (
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-red-600">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 accent-red-600"
                />
                Map with Existing PI Number
              </label>
            )}
          />
          {mapWithExistingPi && (
            <div className="mt-2">
              <Controller
                name="piNumberMapped"
                control={control}
                render={({ field }) => (
                  <select
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    className={INPUT}
                    disabled={loadingPiNumbers || customerId === 0}
                  >
                    <option value="">
                      {customerId === 0
                        ? 'Select a customer first'
                        : loadingPiNumbers
                          ? 'Loading...'
                          : 'Select Mapped PI Number'}
                    </option>
                    {piNumbers.map((pi) => (
                      <option key={pi.piSystemId} value={String(pi.piSystemId)}>
                        {pi.piSystemId} - {pi.piNumber}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="sm:col-span-2">
          <label className={LABEL}>Notes</label>
          <Controller
            name="piNote"
            control={control}
            render={({ field }) => (
              <textarea rows={2} {...field} className={INPUT} placeholder="Optional notes" />
            )}
          />
        </div>
      </div>

      {/* ── Line Items ────────────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Products *</h3>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus size={13} /> Add Product
          </button>
        </div>

        {errors.items && typeof errors.items.message === 'string' && (
          <p className="mb-2 text-xs text-red-600">{errors.items.message}</p>
        )}

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-3 py-2.5 text-left">Product</th>
                <th className="px-3 py-2.5 text-left">Qty</th>
                <th className="px-3 py-2.5 text-left">Price ({currency})</th>
                <th className="px-3 py-2.5 text-left">Conv. Rate</th>
                <th className="px-3 py-2.5 text-right">Line Total</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fields.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-xs text-gray-400">
                    No products added. Click "Add Product" to start.
                  </td>
                </tr>
              ) : (
                fields.map((field, index) => (
                  <PiLineItemRow
                    key={field.id}
                    index={index}
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    customerId={customerId}
                    currency={currency}
                    onRemove={() => remove(index)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
