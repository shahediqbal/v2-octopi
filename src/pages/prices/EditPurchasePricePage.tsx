import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { purchasePriceSchema } from '@/schemas/priceSchema'
import type { PurchasePriceFormValues } from '@/schemas/priceSchema'
import { usePurchasePriceDetail, useUpdatePurchasePrice } from '@/hooks/usePrice'
import { useToastStore } from '@/stores/toastStore'
import { PurchasePriceForm } from './PurchasePriceForm'

export function EditPurchasePricePage() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)
  const [serverError, setServerError] = useState('')

  const { data, isLoading, isError } = usePurchasePriceDetail(productId)
  const updateMutation = useUpdatePurchasePrice()

  const form = useForm<PurchasePriceFormValues>({
    resolver: zodResolver(purchasePriceSchema),
    defaultValues: { productId: 0, purchasePrice: 0 },
  })

  useEffect(() => {
    if (data) {
      form.reset({
        productId: data.productId,
        purchasePrice: data.purchasePrice,
      })
    }
  }, [data, form])

  const onSubmit = (formData: PurchasePriceFormValues) => {
    setServerError('')
    updateMutation.mutate(
      {
        productId: formData.productId,
        productName: data?.productName ?? '',
        purchasePrice: formData.purchasePrice,
        purchasePriceActiveFrom: null,
        purchasePriceActiveTo: null,
        purchasePriceActiveStatus: 1,
      },
      {
        onSuccess: (res) => {
          if (res.errMsg) {
            setServerError(res.errMsg)
          } else {
            showToast({ message: 'Purchase price updated successfully', type: 'success' })
            navigate('/purchase-prices')
          }
        },
        onError: (err) => {
          setServerError((err as Error).message || 'Something went wrong')
        },
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
          <p className="text-sm text-red-700">Failed to load purchase price details.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          to="/purchase-prices"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Purchase Price</h1>
          <p className="text-xs text-gray-500">{data.productName}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {serverError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <PurchasePriceForm
          control={form.control}
          errors={form.formState.errors}
          isSubmitting={updateMutation.isPending}
          selectedProductName={data.productName}
        />

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="action-update inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
            >
              {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Update
            </button>
            <Link
              to="/purchase-prices"
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
