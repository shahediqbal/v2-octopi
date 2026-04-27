import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lcCreateSchema } from '@/schemas/lcTrackingSchema'
import type { LcCreateFormValues } from '@/schemas/lcTrackingSchema'
import { useCreateLc } from '@/hooks/useLcTracking'
import { useToastStore } from '@/stores/toastStore'
import { DropdownSelect } from '@/components/dropdowns/DropdownSelect'
import { PaginatedCombobox } from '@/components/dropdowns/PaginatedCombobox'

const INPUT =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
const ERROR_INPUT =
  'w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200'
const LABEL = 'mb-1 block text-sm font-medium text-gray-700'
const ERR_MSG = 'mt-1 text-xs text-red-600'

export function CreateLcPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const piId = Number(searchParams.get('piId') ?? 0)
  const showToast = useToastStore((s) => s.showToast)
  const [serverError, setServerError] = useState('')

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<LcCreateFormValues>({
    resolver: zodResolver(lcCreateSchema),
    defaultValues: {
      lcNumber: '',
      lcAmount: 0,
      lcDate: '',
      chequeBankId: 0,
      locationId: 0,
    },
  })

  const createMutation = useCreateLc()

  const onSubmit = (data: LcCreateFormValues) => {
    setServerError('')
    createMutation.mutate(
      {
        piSystemId: piId,
        lcNumber: data.lcNumber,
        lcAmount: data.lcAmount,
        lcDate: data.lcDate,
        chequeBankId: data.chequeBankId,
        locationId: data.locationId,
      },
      {
        onSuccess: (res) => {
          if (res.errMsg) setServerError(res.errMsg)
          else {
            showToast({ message: 'LC created successfully', type: 'success' })
            navigate('/lc/documents')
          }
        },
        onError: (err) => setServerError((err as Error).message || 'Something went wrong'),
      },
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          to="/lc/operations"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create LC Document</h1>
          {piId > 0 && <p className="text-xs text-gray-500">PI ID: {piId}</p>}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {serverError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* LC Number */}
            <div>
              <label className={LABEL}>LC Number *</label>
              <input
                {...register('lcNumber')}
                className={errors.lcNumber ? ERROR_INPUT : INPUT}
                placeholder="Enter LC number"
              />
              {errors.lcNumber && <p className={ERR_MSG}>{errors.lcNumber.message}</p>}
            </div>

            {/* LC Date */}
            <div>
              <label className={LABEL}>LC Date *</label>
              <input
                type="date"
                {...register('lcDate')}
                className={errors.lcDate ? ERROR_INPUT : INPUT}
              />
              {errors.lcDate && <p className={ERR_MSG}>{errors.lcDate.message}</p>}
            </div>

            {/* LC Amount */}
            <div>
              <label className={LABEL}>LC Amount *</label>
              <Controller
                name="lcAmount"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className={errors.lcAmount ? ERROR_INPUT : INPUT}
                    placeholder="0.00"
                  />
                )}
              />
              {errors.lcAmount && <p className={ERR_MSG}>{errors.lcAmount.message}</p>}
            </div>

            {/* Issuer Bank */}
            <div>
              <label className={LABEL}>Issuer Bank *</label>
              <Controller
                name="chequeBankId"
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
              {errors.chequeBankId && <p className={ERR_MSG}>{errors.chequeBankId.message}</p>}
            </div>

            {/* Branch Location */}
            <div>
              <label className={LABEL}>Branch Location *</label>
              <Controller
                name="locationId"
                control={control}
                render={({ field }) => (
                  <PaginatedCombobox
                    type="location"
                    value={field.value || null}
                    onValueChange={(v) => field.onChange(v ?? 0)}
                    hasError={!!errors.locationId}
                  />
                )}
              />
              {errors.locationId && <p className={ERR_MSG}>{errors.locationId.message}</p>}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
            >
              {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Create LC
            </button>
            <Link
              to="/lc/operations"
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
