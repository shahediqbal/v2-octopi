import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { quotationSchema } from '@/schemas/quotationSchema'
import type { QuotationFormValues } from '@/schemas/quotationSchema'
import { useQuotationDetail, useUpdateQuotation } from '@/hooks/useQuotation'
import { useToastStore } from '@/stores/toastStore'
import { QuotationForm } from './QuotationForm'

export function EditQuotationPage() {
  const { id } = useParams<{ id: string }>()
  const quotationId = Number(id)
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)
  const [serverError, setServerError] = useState('')

  const { data, isLoading, isError } = useQuotationDetail(quotationId)
  const updateMutation = useUpdateQuotation()

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: { customerId: 0, pqCurrencyName: 'BDT', items: [] },
  })

  const defaultValues = useMemo<QuotationFormValues | undefined>(() => {
    if (!data) return undefined
    const master = data.priceQuotationMasterData
    const items = data.priceQuotationDetailList ?? []
    return {
      customerId: master.customerId,
      pqCurrencyName: master.pqCurrencyName ?? 'BDT',
      items: items.map((item) => ({
        pqdProductId: item.pqdProductId,
        productName: item.productName ?? '',
        pqdProductUnitPrice: item.pqdProductUnitPrice,
        pqdAppliedVatPercantage: item.pqdAppliedVatPercantage,
        pqdAppliedAitPercantage: item.pqdAppliedAitPercantage,
        pqdIncreasedType: item.pqdIncreasedType ?? 'F',
        pqdIncreasedAmount: item.pqdIncreasedAmount ?? 0,
        pqdAdustedAmount: item.pqdAdustedAmount ?? 0,
        adjustableType: 'plus' as const,
        pqdCalculatedPrice: item.pqdCalculatedPrice,
        pqdFinalPrice: item.pqdFinalPrice,
      })),
    }
  }, [data])

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues)
    }
  }, [defaultValues, form])

  const onSubmit = (formData: QuotationFormValues) => {
    setServerError('')
    updateMutation.mutate(
      {
        pqSystemId: quotationId,
        customerId: formData.customerId,
        pqCurrencyName: formData.pqCurrencyName,
        priceQuotationProducts: formData.items.map((item) => ({
          pqdProductId: item.pqdProductId,
          pqdProductUnitPrice: item.pqdProductUnitPrice,
          pqdAppliedVatPercantage: item.pqdAppliedVatPercantage,
          pqdAppliedAitPercantage: item.pqdAppliedAitPercantage,
          pqdIncreasedType: item.pqdIncreasedType,
          pqdIncreasedAmount: item.pqdIncreasedAmount,
          pqdCalculatedPrice: item.pqdCalculatedPrice,
          pqdAdustedAmount: item.pqdAdustedAmount,
          pqdFinalPrice: item.pqdFinalPrice,
        })),
      },
      {
        onSuccess: (res) => {
          if (res.errMsg) setServerError(res.errMsg)
          else {
            showToast({ message: 'Quotation updated successfully', type: 'success' })
            navigate('/quotations')
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
          <p className="text-sm text-red-700">Failed to load quotation details.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          to="/quotations"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Quotation</h1>
          <p className="text-xs text-gray-500">{data.priceQuotationMasterData.pqSystemNo}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {serverError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <QuotationForm
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
              Update Quotation
            </button>
            <Link
              to="/quotations"
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
