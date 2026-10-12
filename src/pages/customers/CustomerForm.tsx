import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  customerSchema,
  type CustomerFormData,
  paymentIntervals,
  paymentCycleTypes,
  paymentModes,
  currentStatusOptions,
} from '@/schemas/customerSchema'
import { useChannels, useDesignations, useEmployeesByChannel } from '@/hooks/useCustomers'
import { getSubmitToneClass } from '@/lib/actionButtonStyles'

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormData>
  onSubmit: (data: CustomerFormData) => void
  isSubmitting: boolean
  submitLabel: string
  serverError?: string
}

export function CustomerForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  serverError,
}: CustomerFormProps) {
  const previousChannelIdRef = useRef<number | null | undefined>(undefined)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerName: '',
      customerAddress: '',
      contactPersonName: '',
      contactNumber: '',
      designationId: null,
      channelId: null,
      employeeId: null,
      paymentInterval: '',
      paymentCycleType: '',
      paymentCycleValue: null,
      paymentMode: '',
      currentStatus: '',
      linkCustomerId: null,
      specialNote: '',
      disputeAmount: 0,
      ...defaultValues,
    },
  })

  /* re-sync when defaultValues change (edit page loads data async) */
  useEffect(() => {
    if (defaultValues) {
      previousChannelIdRef.current = defaultValues.channelId ?? null
      reset({ ...defaultValues })
    }
  }, [defaultValues, reset])

  const channelId = watch('channelId')

  /* dropdown data */
  const { data: channels, isLoading: loadingChannels } = useChannels()
  const { data: designations, isLoading: loadingDesignations } = useDesignations()
  const { data: employees, isLoading: loadingEmployees } = useEmployeesByChannel(channelId)

  /* clear employee when channel changes */
  useEffect(() => {
    if (previousChannelIdRef.current === undefined) {
      previousChannelIdRef.current = channelId
      return
    }

    if (previousChannelIdRef.current !== channelId) {
      previousChannelIdRef.current = channelId
      setValue('employeeId', null)
    }
  }, [channelId, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* server error */}
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* ── Basic Info ── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Basic Information
        </legend>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Customer Name *" error={errors.customerName?.message}>
            <input {...register('customerName')} className={inputCls} placeholder="Customer name" />
          </Field>

          <Field label="Contact Person" error={errors.contactPersonName?.message}>
            <input {...register('contactPersonName')} className={inputCls} placeholder="Contact person" />
          </Field>

          <Field label="Contact Person Designation" error={errors.designationId?.message}>
            <select {...register('designationId', numericNullable)} className={inputCls} disabled={loadingDesignations}>
              <option value="">Select designation</option>
              {designations?.map((d) => (
                <option key={d.designationId} value={d.designationId}>
                  {d.designation1}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Phone" error={errors.contactNumber?.message}>
            <input {...register('contactNumber')} className={inputCls} placeholder="01XXXXXXXXX" />
          </Field>

          <Field label="Address *" error={errors.customerAddress?.message}>
            <input {...register('customerAddress')} className={inputCls} placeholder="Address" />
          </Field>
        </div>
      </fieldset>

      {/* ── Organisation ── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Organisation
        </legend>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Channel" error={errors.channelId?.message}>
            <select {...register('channelId', numericNullable)} className={inputCls} disabled={loadingChannels}>
              <option value="">Select channel</option>
              {channels?.map((ch) => (
                <option key={ch.channelId} value={ch.channelId}>
                  {ch.channelName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Belongs To" error={errors.employeeId?.message}>
            <select
              {...register('employeeId', numericNullable)}
              className={inputCls}
              disabled={!channelId || loadingEmployees}
            >
              <option value="">{channelId ? 'Select employee' : 'Select channel first'}</option>
              {employees?.map((emp) => (
                <option key={emp.key} value={emp.key}>
                  {emp.value}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      {/* ── Payment ── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Payment
        </legend>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Payment Interval">
            <select {...register('paymentInterval')} className={inputCls}>
              <option value="">Select</option>
              {paymentIntervals.map((p) => (
                <option key={p.id} value={p.title}>{p.title}</option>
              ))}
            </select>
          </Field>

          <Field label="Payment Cycle Type">
            <select {...register('paymentCycleType')} className={inputCls}>
              <option value="">Select</option>
              {paymentCycleTypes.map((p) => (
                <option key={p.id} value={p.title}>{p.title}</option>
              ))}
            </select>
          </Field>

          <Field label="Payment Cycle Value">
            <input
              type="number"
              {...register('paymentCycleValue', numericNullable)}
              className={inputCls}
              placeholder="Value"
            />
          </Field>

          <Field label="Payment Mode">
            <select {...register('paymentMode')} className={inputCls}>
              <option value="">Select</option>
              {paymentModes.map((p) => (
                <option key={p.id} value={p.title}>{p.title}</option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      {/* ── Status & Notes ── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Status &amp; Notes
        </legend>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Current Status">
            <select {...register('currentStatus')} className={inputCls}>
              <option value="">Select</option>
              {currentStatusOptions.map((s) => (
                <option key={s.id} value={s.title}>{s.title}</option>
              ))}
            </select>
          </Field>

          <Field label="Special Note">
            <input {...register('specialNote')} className={inputCls} placeholder="Optional note" />
          </Field>

          <Field label="Dispute Amount" error={errors.disputeAmount?.message}>
            <input
              type="number"
              min="0"
              step="0.01"
              {...register('disputeAmount', { valueAsNumber: true })}
              className={inputCls}
              placeholder="0.00"
            />
          </Field>
        </div>
      </fieldset>

      {/* actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${getSubmitToneClass(submitLabel)} inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

/* ─── shared styling / helpers ─── */
const numericNullable = {
  setValueAs: (v: string | number | null | undefined) =>
    v === '' || v === undefined || v === null ? null : Number(v),
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
