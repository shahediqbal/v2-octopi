import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lcCreateSchema } from '@/schemas/lcTrackingSchema'
import type { LcCreateFormValues } from '@/schemas/lcTrackingSchema'
import { useCreateLc, usePiDetail } from '@/hooks/useLcTracking'
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
    setValue,
    formState: { errors },
  } = useForm<LcCreateFormValues>({
    resolver: zodResolver(lcCreateSchema),
    defaultValues: {
      lcNumber: '',
      lcAmount: 0,
      lcDate: '',
      lcIssuerBankId: 0,
      lcIssuerBranchLocationId: 0,
    },
  })

  const createMutation = useCreateLc()
  const { data: piData } = usePiDetail(piId > 0 ? piId : undefined)

  useEffect(() => {
    if (!piData) {
      return
    }

    const normalizedPiAmount = Number(piData.piAmount ?? 0)
    setValue('lcAmount', Number.isNaN(normalizedPiAmount) ? 0 : normalizedPiAmount)
  }, [piData, setValue])

  const onSubmit = (data: LcCreateFormValues) => {
    setServerError('')
    createMutation.mutate(
      {
        piSystemId: piId,
        lcNumber: data.lcNumber,
        lcAmount: data.lcAmount,
        lcDate: data.lcDate,
        lcIssuerBankId: data.lcIssuerBankId,
        lcIssuerBranchLocationId: data.lcIssuerBranchLocationId,
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

      {/* PI Information */}
      {piData && (
        <div className="rounded-xl border border-gray-300 bg-gray-50 p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">PI Information</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <span className="font-medium text-gray-600">PI System ID: </span>
              <span className="text-gray-900">{piData.piSystemId}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">PI Number: </span>
              <span className="text-gray-900">{piData.piNumber}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">PI Date: </span>
              <span className="text-gray-900">
                {piData.piDate ? new Date(piData.piDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Customer Name: </span>
              <span className="text-gray-900">{piData.customerName}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="font-medium text-gray-600">PI Amount: </span>
              <span className="text-gray-900">
                {piData.piAmount != null ? `${piData.piCurrency} ${Number(piData.piAmount).toFixed(2)}` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

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
                name="lcIssuerBankId"
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
              {errors.lcIssuerBankId && <p className={ERR_MSG}>{errors.lcIssuerBankId.message}</p>}
            </div>

            {/* Branch Location */}
            <div>
              <label className={LABEL}>Branch Location *</label>
              <Controller
                name="lcIssuerBranchLocationId"
                control={control}
                render={({ field }) => (
                  <PaginatedCombobox
                    type="location"
                    value={field.value || null}
                    onValueChange={(v) => field.onChange(v ?? 0)}
                    hasError={!!errors.lcIssuerBranchLocationId}
                  />
                )}
              />
              {errors.lcIssuerBranchLocationId && <p className={ERR_MSG}>{errors.lcIssuerBranchLocationId.message}</p>}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="action-insert inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
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
