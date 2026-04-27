import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { piSchema } from '@/schemas/lcTrackingSchema'
import type { PiFormValues } from '@/schemas/lcTrackingSchema'
import { useCreatePi } from '@/hooks/useLcTracking'
import { useToastStore } from '@/stores/toastStore'
import { PiForm } from './PiForm'

export function CreatePiPage() {
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)
  const [serverError, setServerError] = useState('')

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

  const createMutation = useCreatePi()

  const onSubmit = (data: PiFormValues) => {
    setServerError('')
    createMutation.mutate(
      {
        piCustmomerId: data.piCustmomerId,
        piDate: data.piDate,
        piRef: data.piRef ?? '',
        piCurrency: data.piCurrency,
        piConversionRate: data.piConversionRate,
        piBenificaryBankId: data.piBenificaryBankId,
        piBranchBankLocationId: data.piBranchBankLocationId,
        lcPaymentTermsId: data.lcPaymentTermsId,
        piNote: data.piNote ?? '',
        piNumberMapped: data.piNumberMapped ?? null,
        piProductDetails: data.items.map((item) => ({
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
            showToast({ message: 'Proforma Invoice created successfully', type: 'success' })
            navigate('/lc/pi')
          }
        },
        onError: (err) => setServerError((err as Error).message || 'Something went wrong'),
      },
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
          <h1 className="text-xl font-bold text-gray-900">Create Proforma Invoice</h1>
          <p className="text-xs text-gray-500">Fill in the details to create a new PI</p>
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
            isSubmitting={createMutation.isPending}
          />

          <div className="mt-8 flex items-center gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
            >
              {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Create PI
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
