import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { jwtDecode } from 'jwt-decode'
import { quotationSchema } from '@/schemas/quotationSchema'
import type { QuotationFormValues } from '@/schemas/quotationSchema'
import { useCreateQuotation } from '@/hooks/useQuotation'
import { useToastStore } from '@/stores/toastStore'
import { getAccessToken } from '@/auth/authBridge'
import { QuotationForm } from './QuotationForm'

function getUserSystemId(): number {
  const token = getAccessToken()
  if (!token) return 0
  try {
    const decoded = jwtDecode<{ UserSystemId?: number | string }>(token)
    return Number(decoded.UserSystemId ?? 0)
  } catch {
    return 0
  }
}

export function CreateQuotationPage() {
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)
  const createMutation = useCreateQuotation()
  const [serverError, setServerError] = useState('')

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      customerId: 0,
      pqCurrencyName: 'BDT',
      items: [],
    },
  })

  const onSubmit = (data: QuotationFormValues) => {
    setServerError('')
    createMutation.mutate(
      {
        pqSystemId: getUserSystemId(),
        customerId: data.customerId,
        pqCurrencyName: data.pqCurrencyName,
        priceQuotationProducts: data.items.map((item) => ({
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
          if (res.errMsg) {
            setServerError(res.errMsg)
          } else {
            showToast({ message: 'Quotation created successfully', type: 'success' })
            navigate('/quotations')
          }
        },
        onError: (err) => {
          setServerError((err as Error).message || 'Something went wrong')
        },
      },
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
          <h1 className="text-xl font-bold text-gray-900">New Quotation</h1>
          <p className="text-xs text-gray-500">Create a price quotation for a customer</p>
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
            isSubmitting={createMutation.isPending}
          />

          <div className="mt-8 flex items-center gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
            >
              {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Create Quotation
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
