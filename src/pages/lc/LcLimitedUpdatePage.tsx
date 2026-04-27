import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lcLimitedUpdateSchema } from '@/schemas/lcTrackingSchema'
import type { LcLimitedUpdateFormValues } from '@/schemas/lcTrackingSchema'
import { useLcDetail, useLcLimitedUpdate } from '@/hooks/useLcTracking'
import { useToastStore } from '@/stores/toastStore'
import { DropdownSelect } from '@/components/dropdowns/DropdownSelect'
import { PaginatedCombobox } from '@/components/dropdowns/PaginatedCombobox'

const INPUT =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
const ERROR_INPUT =
  'w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200'
const LABEL = 'mb-1 block text-sm font-medium text-gray-700'
const ERR_MSG = 'mt-1 text-xs text-red-600'

export function LcLimitedUpdatePage() {
  const { id } = useParams<{ id: string }>()
  const lcDocId = Number(id)
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)
  const [serverError, setServerError] = useState('')

  const { data, isLoading, isError } = useLcDetail(lcDocId)
  const updateMutation = useLcLimitedUpdate()

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<LcLimitedUpdateFormValues>({
    resolver: zodResolver(lcLimitedUpdateSchema),
    defaultValues: {
      lcNumber: '',
      lcAmount: 0,
      lcDate: '',
      chequeBankId: 0,
      locationId: 0,
    },
  })

  useEffect(() => {
    if (data) {
      reset({
        lcNumber: data.lcNumber ?? '',
        lcAmount: data.lcAmount ?? 0,
        lcDate: data.lcDate ?? '',
        chequeBankId: data.chequeBankId ?? 0,
        locationId: data.locationId ?? 0,
      })
    }
  }, [data, reset])

  const onSubmit = (formData: LcLimitedUpdateFormValues) => {
    setServerError('')
    updateMutation.mutate(
      { lcDocId, ...formData },
      {
        onSuccess: (res) => {
          if (res.errMsg) setServerError(res.errMsg)
          else {
            showToast({ message: 'LC updated successfully', type: 'success' })
            navigate('/lc/edit-list')
          }
        },
        onError: (err) => setServerError((err as Error).message || 'Something went wrong'),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 text-red-500" />
          <p className="text-sm text-red-700">Failed to load LC document.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          to="/lc/edit-list"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit LC (Limited)</h1>
          <p className="text-xs text-gray-500">LC #{data.lcNumber}</p>
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
                placeholder="LC number"
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
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
            >
              {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
            <Link
              to="/lc/edit-list"
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
