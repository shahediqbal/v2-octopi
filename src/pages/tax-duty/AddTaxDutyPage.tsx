import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft, Receipt } from 'lucide-react'
import { useCreateTaxDuty } from '@/hooks/useTaxAndDuty'
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

const defaultValues: FormValues = {
  customerId: 0,
  customerAitPercentage: 0,
  customerVatPercentage: 0,
  effectiveDate: today,
}

export function AddTaxDutyPage() {
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)
  const createMutation = useCreateTaxDuty()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues })

  function onSubmit(values: FormValues) {
    createMutation.mutate(values, {
      onSuccess: () => {
        showToast({ message: 'Tax & Duty record created', type: 'success' })
        navigate('/tax-duty')
      },
      onError: () => {
        showToast({ message: 'Failed to create record', type: 'error' })
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
          <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
            <Receipt size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Add Tax &amp; Duty</h2>
            <p className="mt-1 text-sm text-gray-500">Define AIT and VAT percentages for a customer.</p>
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
              onClick={() => reset(defaultValues)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
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
              disabled={createMutation.isPending}
              className="action-insert flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
