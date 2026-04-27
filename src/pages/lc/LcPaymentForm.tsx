import { type Control, Controller, type FieldErrors } from 'react-hook-form'
import type { LcPaymentFormValues } from '@/schemas/lcTrackingSchema'
import { PaginatedCombobox } from '@/components/dropdowns/PaginatedCombobox'

const INPUT =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
const ERROR_INPUT =
  'w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200'
const LABEL = 'mb-1 block text-sm font-medium text-gray-700'
const ERR_MSG = 'mt-1 text-xs text-red-600'

interface LcPaymentFormProps {
  control: Control<LcPaymentFormValues>
  errors: FieldErrors<LcPaymentFormValues>
}

export function LcPaymentForm({ control, errors }: LcPaymentFormProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {/* Employee */}
      <div>
        <label className={LABEL}>Employee *</label>
        <Controller
          name="paymentCollectedBy"
          control={control}
          render={({ field }) => (
            <PaginatedCombobox
              type="employee"
              value={typeof field.value === 'number' ? field.value : null}
              onValueChange={(v) => field.onChange(v ?? 0)}
              hasError={!!errors.paymentCollectedBy}
            />
          )}
        />
        {errors.paymentCollectedBy && <p className={ERR_MSG}>{errors.paymentCollectedBy.message}</p>}
      </div>

      {/* Payment Date */}
      <div>
        <label className={LABEL}>Payment Date *</label>
        <Controller
          name="paymentDate"
          control={control}
          render={({ field }) => (
            <input
              type="date"
              {...field}
              className={errors.paymentDate ? ERROR_INPUT : INPUT}
            />
          )}
        />
        {errors.paymentDate && <p className={ERR_MSG}>{errors.paymentDate.message}</p>}
      </div>

      {/* Payment Amount */}
      <div>
        <label className={LABEL}>Payment Amount *</label>
        <Controller
          name="paymentAmount"
          control={control}
          render={({ field }) => (
            <input
              type="number"
              step="0.01"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className={errors.paymentAmount ? ERROR_INPUT : INPUT}
              placeholder="0.00"
            />
          )}
        />
        {errors.paymentAmount && <p className={ERR_MSG}>{errors.paymentAmount.message}</p>}
      </div>

      {/* LC Amount Transfer at Bank */}
      <div>
        <label className={LABEL}>LC Amount Transfer at Bank</label>
        <Controller
          name="lcAmountTransferAtBank"
          control={control}
          render={({ field }) => (
            <input
              type="number"
              step="0.01"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className={INPUT}
              placeholder="0.00"
            />
          )}
        />
      </div>

      {/* LC Adjustment Amount */}
      <div>
        <label className={LABEL}>LC Adjustment Amount</label>
        <Controller
          name="lcAdjustmentAmount"
          control={control}
          render={({ field }) => (
            <input
              type="number"
              step="0.01"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className={INPUT}
              placeholder="0.00"
            />
          )}
        />
      </div>

      {/* Collection Conversion Rate */}
      <div>
        <label className={LABEL}>Collection Conversion Rate</label>
        <Controller
          name="lcCollectionConversionRate"
          control={control}
          render={({ field }) => (
            <input
              type="number"
              step="0.0001"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className={INPUT}
              placeholder="0.0000"
            />
          )}
        />
      </div>

      {/* Notes */}
      <div className="sm:col-span-2">
        <label className={LABEL}>Payment Note</label>
        <Controller
          name="paymentNote"
          control={control}
          render={({ field }) => (
            <textarea rows={2} {...field} className={INPUT} placeholder="Optional note" />
          )}
        />
      </div>

      {/* Is Payment Complete */}
      <div className="sm:col-span-2">
        <label className="flex cursor-pointer items-center gap-2">
          <Controller
            name="isPaymentComplete"
            control={control}
            render={({ field }) => (
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="h-4 w-4 rounded border-gray-300 accent-gray-800"
              />
            )}
          />
          <span className="text-sm font-medium text-gray-700">Mark payment as complete</span>
        </label>
      </div>
    </div>
  )
}
