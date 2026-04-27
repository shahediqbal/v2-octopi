import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { chequeStatusSchema, type ChequeStatusFormData } from '@/schemas/chequeSchema'
import { useChequeStatuses } from '@/hooks/useCheques'
import type { ChequeDetail } from '@/types/cheque'

interface ChequeStatusFormProps {
  cheque: ChequeDetail
  defaultValues?: Partial<ChequeStatusFormData>
  onSubmit: (data: ChequeStatusFormData) => void
  isSubmitting: boolean
  submitLabel: string
  serverError?: string
}

const numericNullable = {
  setValueAs: (value: string | number | null | undefined) =>
    value === '' || value === undefined || value === null ? null : Number(value),
}

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatAmount(value: number | null) {
  if (value == null) return '—'
  return value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function ChequeStatusForm({ cheque, defaultValues, onSubmit, isSubmitting, submitLabel, serverError }: ChequeStatusFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChequeStatusFormData>({
    resolver: zodResolver(chequeStatusSchema),
    defaultValues: {
      chequeStatusId: cheque.chequeStatusId ?? 1,
      chequeActionDate: '',
      chequeStatusRemarks: '',
      ...defaultValues,
    },
  })

  useEffect(() => {
    reset({
      chequeStatusId: cheque.chequeStatusId ?? 1,
      chequeActionDate: '',
      chequeStatusRemarks: '',
      ...defaultValues,
    })
  }, [cheque.chequeStatusId, defaultValues, reset])

  const { data: chequeStatuses, isLoading: loadingChequeStatuses } = useChequeStatuses()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-gray-700">Cheque Summary</legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ReadonlyField label="Customer">{cheque.customerName ?? '—'}</ReadonlyField>
          <ReadonlyField label="Cheque Number">{cheque.chequeNumber ?? '—'}</ReadonlyField>
          <ReadonlyField label="Cheque Amount">BDT {formatAmount(cheque.chequeAmount)}</ReadonlyField>
          <ReadonlyField label="Collector">{[cheque.empFirstName, cheque.empLastName, cheque.employeeCode].filter(Boolean).join(' ').trim() || '—'}</ReadonlyField>
          <ReadonlyField label="Cheque Type">{cheque.paymentMethodName ?? '—'}</ReadonlyField>
          <ReadonlyField label="Issuer Bank">{cheque.chequeBankName ?? '—'}</ReadonlyField>
          <ReadonlyField label="Cheque Date">{formatDate(cheque.chequeDate)}</ReadonlyField>
          <ReadonlyField label="Placement Date">{formatDate(cheque.chequePlacementDate)}</ReadonlyField>
          <ReadonlyField label="Expire Date">{formatDate(cheque.chequeExpireDate)}</ReadonlyField>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-gray-700">Status Update</legend>
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

          <div className="md:col-span-2">
            <Field label="Remarks">
              <textarea {...register('chequeStatusRemarks')} rows={4} className={inputCls} placeholder="Remarks" />
            </Field>
          </div>
        </div>
      </fieldset>

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

function ReadonlyField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 block text-sm font-medium text-gray-700">{label}</p>
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">{children}</div>
    </div>
  )
}