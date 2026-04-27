import { Controller } from 'react-hook-form'
import type { Control, FieldErrors } from 'react-hook-form'
import { PaginatedCombobox } from '@/components/dropdowns'
import type { PurchasePriceFormValues } from '@/schemas/priceSchema'

interface PurchasePriceFormProps {
  control: Control<PurchasePriceFormValues>
  errors: FieldErrors<PurchasePriceFormValues>
  isSubmitting: boolean
  showStayOnPage?: boolean
  stayOnPage?: boolean
  onStayOnPageChange?: (v: boolean) => void
}

export function PurchasePriceForm({
  control,
  errors,
  isSubmitting,
  showStayOnPage,
  stayOnPage,
  onStayOnPageChange,
}: PurchasePriceFormProps) {
  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'

  return (
    <div className="space-y-5">
      {/* Product */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Product <span className="text-red-500">*</span>
        </label>
        <Controller
          name="productId"
          control={control}
          render={({ field, fieldState }) => (
            <PaginatedCombobox
              type="product"
              value={field.value ?? null}
              onValueChange={field.onChange}
              hasError={!!fieldState.error}
              placeholder="Search product…"
            />
          )}
        />
        {errors.productId && (
          <p className="mt-1 text-xs text-red-600">{errors.productId.message}</p>
        )}
      </div>

      {/* Purchase Price */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Purchase Price <span className="text-red-500">*</span>
        </label>
        <Controller
          name="purchasePrice"
          control={control}
          render={({ field, fieldState }) => (
            <input
              type="number"
              min={0}
              step="0.01"
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className={inputClass + (fieldState.error ? ' border-red-400 ring-red-200' : '')}
              placeholder="0.00"
              disabled={isSubmitting}
            />
          )}
        />
        {errors.purchasePrice && (
          <p className="mt-1 text-xs text-red-600">{errors.purchasePrice.message}</p>
        )}
      </div>

      {/* Stay on page (add mode only) */}
      {showStayOnPage && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={stayOnPage ?? false}
            onChange={(e) => onStayOnPageChange?.(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-gray-800"
          />
          Stay on page to add another
        </label>
      )}
    </div>
  )
}
