import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { purchasePriceSchema } from '@/schemas/priceSchema'
import type { PurchasePriceFormValues } from '@/schemas/priceSchema'
import { useCreatePurchasePrice } from '@/hooks/usePrice'
import { useToastStore } from '@/stores/toastStore'
import { PurchasePriceForm } from './PurchasePriceForm'

export function AddPurchasePricePage() {
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)
  const createMutation = useCreatePurchasePrice()
  const [stayOnPage, setStayOnPage] = useState(false)
  const [serverError, setServerError] = useState('')

  const form = useForm<PurchasePriceFormValues>({
    resolver: zodResolver(purchasePriceSchema),
    defaultValues: { productId: 0, purchasePrice: 0 },
  })

  const onSubmit = (data: PurchasePriceFormValues) => {
    setServerError('')
    createMutation.mutate(
      {
        purchasePriceAtuoId: 0,    // send 0 for new records (backend typo preserved)
        productId: data.productId,
        purchasePrice: data.purchasePrice,
        purchasePriceActiveFrom: null,
        purchasePriceActiveTo: null,
      },
      {
        onSuccess: (res) => {
          if (res.errMsg) {
            setServerError(res.errMsg)
          } else {
            showToast({ message: 'Purchase price added successfully', type: 'success' })
            if (stayOnPage) {
              form.reset()
            } else {
              navigate('/purchase-prices')
            }
          }
        },
        onError: (err) => {
          setServerError((err as Error).message || 'Something went wrong')
        },
      },
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
          <h1 className="text-xl font-bold text-gray-900">Add Purchase Price</h1>
          <p className="text-xs text-gray-500">Set the purchase price for a product</p>
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
            isSubmitting={createMutation.isPending}
            showStayOnPage
            stayOnPage={stayOnPage}
            onStayOnPageChange={setStayOnPage}
          />

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
            >
              {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Save
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
