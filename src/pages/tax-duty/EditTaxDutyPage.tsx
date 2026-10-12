import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft, AlertCircle, Receipt } from 'lucide-react'
import { useTaxDutyDetail, useUpdateTaxDuty } from '@/hooks/useTaxAndDuty'
import { PaginatedCombobox } from '@/components/dropdowns/PaginatedCombobox'
import { useToastStore } from '@/stores/toastStore'

const today = new Date().toISOString().split('T')[0]

const schema = z.object({
  customerId: z.number({ error: 'Customer is required' }).positive('Customer is required'),
  customerAitPercentage: z
    .number({ error: 'AIT % is required' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100'),
  customerVatPercentage: z
    .number({ error: 'VAT % is required' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100'),
  effectiveDate: z
    .string()
    .min(1, 'Effective date is required')
    .refine((d) => new Date(d) <= new Date(), 'Effective date cannot be in the future'),
})

type FormValues = z.infer<typeof schema>

export function EditTaxDutyPage() {
  const { id } = useParams<{ id: string }>()
  const taxDutyId = Number(id)
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)

  const { data: detail, isLoading, isError } = useTaxDutyDetail(taxDutyId)
  const updateMutation = useUpdateTaxDuty()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!detail) return
    reset({
      customerId: detail.customerId,
      customerAitPercentage: detail.customerAitPercentage,
      customerVatPercentage: detail.customerVatPercentage,
      effectiveDate: detail.effectiveDate?.split('T')[0] ?? today,
    })
  }, [detail, reset])

  function onSubmit(values: FormValues) {
    updateMutation.mutate(
      { ...values, customerTaxDutyId: taxDutyId },
      {
        onSuccess: () => {
          showToast({ message: 'Tax & Duty record updated', type: 'success' })
          navigate('/tax-duty')
        },
        onError: () => {
          showToast({ message: 'Failed to update record', type: 'error' })
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={22} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading…</span>
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-red-500">
        <AlertCircle size={16} />
        Failed to load record.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
          <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
            <Receipt size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Edit Tax &amp; Duty</h2>
            <p className="mt-1 text-sm text-gray-500">{detail.customerName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Customer */}
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Customer</label>
              <Controller
                name="customerId"
                control={control}
                render={({ field, fieldState }) => (
                  <PaginatedCombobox
                    type="customer"
                    value={field.value || null}
                    onValueChange={(v) => field.onChange(v ?? 0)}
                    hasError={!!fieldState.error}
                  />
                )}
              />
              {errors.customerId && <p className="mt-1 text-xs text-red-500">{errors.customerId.message}</p>}
            </div>

            {/* AIT % */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">AIT Percentage (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                {...register('customerAitPercentage', { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
              {errors.customerAitPercentage && <p className="mt-1 text-xs text-red-500">{errors.customerAitPercentage.message}</p>}
            </div>

            {/* VAT % */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">VAT Percentage (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                {...register('customerVatPercentage', { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
              {errors.customerVatPercentage && <p className="mt-1 text-xs text-red-500">{errors.customerVatPercentage.message}</p>}
            </div>

            {/* Effective Date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Effective Date</label>
              <input
                type="date"
                max={today}
                {...register('effectiveDate')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
              {errors.effectiveDate && <p className="mt-1 text-xs text-red-500">{errors.effectiveDate.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="action-update flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
