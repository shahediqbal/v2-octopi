import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sellingPriceSchema } from '@/schemas/priceSchema'
import type { SellingPriceFormValues } from '@/schemas/priceSchema'
import { useCreateSellingPrice } from '@/hooks/usePrice'
import { useToastStore } from '@/stores/toastStore'
import { SellingPriceForm } from './SellingPriceForm'

export function AddSellingPricePage() {
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)
  const createMutation = useCreateSellingPrice()
  const [stayOnPage, setStayOnPage] = useState(false)
  const [serverError, setServerError] = useState('')

  const form = useForm<SellingPriceFormValues>({
    resolver: zodResolver(sellingPriceSchema),
    defaultValues: { productId: 0, productPrice: 0 },
  })

  const onSubmit = (data: SellingPriceFormValues) => {
    setServerError('')
    createMutation.mutate(
      {
        productId: data.productId,
        productPrice: data.productPrice,
        productPriceCode: 'NoOffer',
        productProfitPercentage: 0,
        productDicsountedPrice: data.productPrice,
        productPriceActiveFrom: null,
        productPriceActiveTo: null,
      },
      {
        onSuccess: (res) => {
          if (res.errMsg) {
            setServerError(res.errMsg)
          } else {
            showToast({ message: 'Selling price added successfully', type: 'success' })
            if (stayOnPage) {
              form.reset()
            } else {
              navigate('/selling-prices')
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
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Link
          to="/selling-prices"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add Selling Price</h1>
          <p className="text-xs text-gray-500">Set the selling price for a product</p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {serverError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <SellingPriceForm
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
              className="action-insert inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
            >
              {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
            <Link
              to="/selling-prices"
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
