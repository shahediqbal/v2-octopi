import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ProductFunctionForm } from './ProductFunctionForm'
import type { ProductFunctionFormData } from '@/schemas/productFunctionSchema'
import { useCreateProductFunction } from '@/hooks/useProductFunctions'

export function AddProductFunctionPage() {
  const navigate = useNavigate()
  const createMutation = useCreateProductFunction()
  const [serverError, setServerError] = useState('')

  const handleSubmit = (data: ProductFunctionFormData) => {
    setServerError('')

    createMutation.mutate(
      {
        functionId: 0,
        functionName: data.functionName,
      },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/products/functions" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Product Function</h1>
          <p className="mt-0.5 text-sm text-gray-500">Create a new product function.</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ProductFunctionForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          submitLabel="Create Function"
          serverError={serverError}
        />
      </div>
    </div>
  )
}