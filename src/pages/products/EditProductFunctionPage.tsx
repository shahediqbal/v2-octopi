import { useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductFunctionForm } from './ProductFunctionForm'
import type { ProductFunctionFormData } from '@/schemas/productFunctionSchema'
import { useProductFunctionDetail, useUpdateProductFunction } from '@/hooks/useProductFunctions'

export function EditProductFunctionPage() {
  const { id } = useParams<{ id: string }>()
  const functionId = Number(id)
  const navigate = useNavigate()
  const { data: productFunction, isLoading, isError, error } = useProductFunctionDetail(functionId || undefined)
  const updateMutation = useUpdateProductFunction()
  const [serverError, setServerError] = useState('')

  const formDefaults = useMemo<Partial<ProductFunctionFormData> | undefined>(() => {
    if (!productFunction) return undefined
    return { functionName: productFunction.functionName ?? '' }
  }, [productFunction])

  const handleSubmit = (data: ProductFunctionFormData) => {
    setServerError('')

    updateMutation.mutate(
      { functionId, functionName: data.functionName },
      {
        onSuccess: (res) => {
          if (res.errMsg) setServerError(res.errMsg)
          else navigate('/products/functions')
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
        <span className="ml-3 text-sm text-gray-500">Loading product function…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-800">Failed to load product function</p>
          <p className="mt-1 text-xs text-red-600">{(error as Error)?.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/products/functions" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product Function</h1>
          <p className="mt-0.5 text-sm text-gray-500">{productFunction?.functionName} — ID #{functionId}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ProductFunctionForm
          defaultValues={formDefaults}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          submitLabel="Update Function"
          serverError={serverError}
        />
      </div>
    </div>
  )
}