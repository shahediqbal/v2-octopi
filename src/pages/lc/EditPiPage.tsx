import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { piSchema } from '@/schemas/lcTrackingSchema'
import type { PiFormValues } from '@/schemas/lcTrackingSchema'
import { usePiDetail, useUpdatePi } from '@/hooks/useLcTracking'
import { useToastStore } from '@/stores/toastStore'
import { PiForm } from './PiForm'

export function EditPiPage() {
  const { id } = useParams<{ id: string }>()
  const piId = Number(id)
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)
  const [serverError, setServerError] = useState('')

  const { data, isLoading, isError } = usePiDetail(piId)
  const updateMutation = useUpdatePi()

  const form = useForm<PiFormValues>({
    resolver: zodResolver(piSchema),
    defaultValues: {
      piCustmomerId: 0,
      piDate: '',
      piRef: '',
      piCurrency: 'USD',
      piConversionRate: 1,
      piBenificaryBankId: 0,
      piBranchBankLocationId: 0,
      lcPaymentTermsId: 0,
      piNote: '',
      piNumberMapped: null,
      items: [],
    },
  })

  const defaultValues = useMemo<PiFormValues | undefined>(() => {
    if (!data) return undefined
    return {
      piCustmomerId: data.piCustmomerId ?? data.customerId ?? 0,
      piDate: data.piDate ?? '',
      piRef: data.piRef ?? '',
      piCurrency: data.piCurrency ?? 'USD',
      piConversionRate: data.piConversionRate ?? 1,
      piBenificaryBankId: data.piBenificaryBankId ?? 0,
      piBranchBankLocationId: data.piBranchBankLocationId ?? 0,
      lcPaymentTermsId: data.lcPaymentTermsId ?? 0,
      piNote: data.piNote ?? '',
      piNumberMapped: data.piNumberMapped ?? null,
      items: (data.piProductDetails ?? []).map((item) => ({
        piProductId: item.piProductId,
        piProductQuantity: item.piProductQuantity,
        piProductPrice: item.piProductPrice,
        piProductPriceConvertionRate: item.piProductPriceConvertionRate ?? 1,
        piLineTotalAmount: item.piLineTotalAmount ?? 0,
      })),
    }
  }, [data])

  useEffect(() => {
    if (defaultValues) form.reset(defaultValues)
  }, [defaultValues, form])

  const onSubmit = (formData: PiFormValues) => {
    setServerError('')
    updateMutation.mutate(
      {
        piSystemId: piId,
        piCustmomerId: formData.piCustmomerId,
        piDate: formData.piDate,
        piRef: formData.piRef ?? '',
        piCurrency: formData.piCurrency,
        piConversionRate: formData.piConversionRate,
        piBenificaryBankId: formData.piBenificaryBankId,
        piBranchBankLocationId: formData.piBranchBankLocationId,
        lcPaymentTermsId: formData.lcPaymentTermsId,
        piNote: formData.piNote ?? '',
        piNumberMapped: formData.piNumberMapped ?? null,
        piProductDetails: formData.items.map((item) => ({
          piProductId: item.piProductId,
          piProductQuantity: item.piProductQuantity,
          piProductPrice: item.piProductPrice,
          piProductPriceConvertionRate: item.piProductPriceConvertionRate,
          piLineTotalAmount: item.piLineTotalAmount,
        })),
      },
      {
        onSuccess: (res) => {
          if (res.errMsg) setServerError(res.errMsg)
          else {
            showToast({ message: 'Proforma Invoice updated successfully', type: 'success' })
            navigate('/lc/pi')
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
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 text-red-500" />
          <p className="text-sm text-red-700">Failed to load PI details.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          to="/lc/pi"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Proforma Invoice</h1>
          <p className="text-xs text-gray-500">{data.piNumber}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {serverError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <PiForm
            control={form.control}
            errors={form.formState.errors}
            setValue={form.setValue}
            isSubmitting={updateMutation.isPending}
            lockHeader
          />

          <div className="mt-8 flex items-center gap-3">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
            >
              {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Update PI
            </button>
            <Link
              to="/lc/pi"
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
