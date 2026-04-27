import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { chequeFormSchema, type ChequeFormData } from '@/schemas/chequeSchema'
import {
  useBeneficiaryBanks,
  useChequeStatuses,
  useChequeTypes,
  useIssuerBanks,
} from '@/hooks/useCheques'

interface ChequeFormProps {
  defaultValues?: Partial<ChequeFormData>
  customerLabel?: string | null
  collectorLabel?: string | null
  showStatusFields?: boolean
  onSubmit: (data: ChequeFormData) => void
  isSubmitting: boolean
  submitLabel: string
  serverError?: string
}

const numericRequired = {
  setValueAs: (value: string | number | null | undefined) =>
    value === '' || value === undefined || value === null ? Number.NaN : Number(value),
}

const numericNullable = {
  setValueAs: (value: string | number | null | undefined) =>
    value === '' || value === undefined || value === null ? null : Number(value),
}

export function ChequeForm({
  defaultValues,
  customerLabel,
  collectorLabel,
  showStatusFields = true,
  onSubmit,
  isSubmitting,
  submitLabel,
  serverError,
}: ChequeFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChequeFormData>({
    resolver: zodResolver(chequeFormSchema),
    defaultValues: {
      chequeCollectedBy: null,
      chequeCollectionDate: '',
      chequeTypeId: null,
      customerId: null,
      chequeDate: '',
      chequePlacementDate: '',
      chequeExpireDate: '',
      chequeActionDate: '',
      chequeNumber: '',
      chequeAmount: 0,
      issuerBankId: null,
      beneficiaryBankId: null,
      chequeStatusId: 1,
      chequeStatusRemarks: '',
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (!defaultValues) return
    reset({
      chequeCollectedBy: null,
      chequeCollectionDate: '',
      chequeTypeId: null,
      customerId: null,
      chequeDate: '',
      chequePlacementDate: '',
      chequeExpireDate: '',
      chequeActionDate: '',
      chequeNumber: '',
      chequeAmount: 0,
      issuerBankId: null,
      beneficiaryBankId: null,
      chequeStatusId: 1,
      chequeStatusRemarks: '',
      ...defaultValues,
    })
  }, [defaultValues, reset])

  const { data: chequeTypes, isLoading: loadingChequeTypes } = useChequeTypes()
  const { data: issuerBanks, isLoading: loadingIssuerBanks } = useIssuerBanks()
  const { data: beneficiaryBanks, isLoading: loadingBeneficiaryBanks } = useBeneficiaryBanks()
  const { data: chequeStatuses, isLoading: loadingChequeStatuses } = useChequeStatuses()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-gray-700">Collection</legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Cheque Collected By *" error={errors.chequeCollectedBy?.message}>
            <Controller
              name="chequeCollectedBy"
              control={control}
              render={({ field, fieldState }) => (
                <PaginatedCombobox
                  type="employee"
                  value={field.value}
                  onValueChange={field.onChange}
                  selectedLabel={collectorLabel}
                  placeholder="Search employee"
                  hasError={!!fieldState.error}
                />
              )}
            />
          </Field>

          <Field label="Cheque Collection Date *" error={errors.chequeCollectionDate?.message}>
            <input type="date" {...register('chequeCollectionDate')} className={inputCls} />
          </Field>

          <Field label="Customer Name *" error={errors.customerId?.message}>
            <Controller
              name="customerId"
              control={control}
              render={({ field, fieldState }) => (
                <PaginatedCombobox
                  type="customer"
                  value={field.value}
                  onValueChange={field.onChange}
                  selectedLabel={customerLabel}
                  placeholder="Search customer"
                  hasError={!!fieldState.error}
                />
              )}
            />
          </Field>

          <Field label="Cheque Type *" error={errors.chequeTypeId?.message}>
            <select
              {...register('chequeTypeId', numericNullable)}
              className={inputCls}
              disabled={loadingChequeTypes}
            >
              <option value="">Select cheque type</option>
              {chequeTypes?.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-gray-700">Instrument Details</legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Cheque Date *" error={errors.chequeDate?.message}>
            <input type="date" {...register('chequeDate')} className={inputCls} />
          </Field>

          <Field label="Cheque Placement Date *" error={errors.chequePlacementDate?.message}>
            <input type="date" {...register('chequePlacementDate')} className={inputCls} />
          </Field>

          <Field label="Cheque Expire Date *" error={errors.chequeExpireDate?.message}>
            <input type="date" {...register('chequeExpireDate')} className={inputCls} />
          </Field>

          <Field label="Cheque Number *" error={errors.chequeNumber?.message}>
            <input {...register('chequeNumber')} className={inputCls} placeholder="Cheque number" />
          </Field>

          <Field label="Cheque Amount *" error={errors.chequeAmount?.message}>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('chequeAmount', numericRequired)}
              className={inputCls}
              placeholder="Cheque amount"
            />
          </Field>

          <Field label="Cheque Issuer Bank *" error={errors.issuerBankId?.message}>
            <select
              {...register('issuerBankId', numericNullable)}
              className={inputCls}
              disabled={loadingIssuerBanks}
            >
              <option value="">Select issuer bank</option>
              {issuerBanks?.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Beneficiary Bank">
            <select
              {...register('beneficiaryBankId', numericNullable)}
              className={inputCls}
              disabled={loadingBeneficiaryBanks}
            >
              <option value="">Select beneficiary bank</option>
              {beneficiaryBanks?.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </Field>

          <div className="lg:col-span-3">
            <Field label="Cheque Remarks">
              <textarea
                {...register('chequeStatusRemarks')}
                rows={4}
                className={inputCls}
                placeholder="Remarks"
              />
            </Field>
          </div>
        </div>
      </fieldset>

      {showStatusFields && (
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase tracking-wider text-gray-700">Status</legend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Cheque Status *" error={errors.chequeStatusId?.message}>
              <select
                {...register('chequeStatusId', numericNullable)}
                className={inputCls}
                disabled={loadingChequeStatuses}
              >
                <option value="">Select cheque status</option>
                {chequeStatuses?.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Cheque Action Date *" error={errors.chequeActionDate?.message}>
              <input type="date" {...register('chequeActionDate')} className={inputCls} />
            </Field>
          </div>
        </fieldset>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}