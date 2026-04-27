import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getAccessToken } from '@/auth/authBridge'
import { ProductForm } from './ProductForm'
import type { ProductFormData } from '@/schemas/productSchema'
import { useCreateProduct } from '@/hooks/useProducts'
import { jwtDecode } from 'jwt-decode'

function todayStr() {
  const date = new Date()
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function getUserSystemId() {
  const token = getAccessToken()
  if (!token) return null
  try {
    const decoded = jwtDecode<{ UserSystemId?: number | string }>(token)
    return decoded.UserSystemId ?? null
  } catch {
    return null
  }
}

export function AddProductPage() {
  const navigate = useNavigate()
  const createMutation = useCreateProduct()
  const [serverError, setServerError] = useState('')

  const handleSubmit = (data: ProductFormData) => {
    setServerError('')
    if (data.categoryId == null) {
      setServerError('Please select a category')
      return
    }
    const userSystemId = getUserSystemId()
    const today = todayStr()

    createMutation.mutate(
      {
        productName: data.productName,
        functionId: data.functionId,
        categoryId: data.categoryId,
        mappedWith: null,
        hsCode: data.hsCode || null,
        cooId: data.cooId,
        brandId: data.brandId,
        groupId: data.groupId,
        sampleProduct: 1,
        productLevel: data.productLevel || null,
        productShelfLife: data.productShelfLife,
        createdBy: userSystemId,
        createdDate: today,
        modifiedBy: userSystemId,
        modifitedDate: today,
        productPackSize: data.productPackSize || null,
      },
      {
        onSuccess: (res) => {
          if (res.errMsg) setServerError(res.errMsg)
          else navigate('/products')
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
        <Link to="/products" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
          <p className="mt-0.5 text-sm text-gray-500">Create a new product record</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ProductForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          submitLabel="Create Product"
          serverError={serverError}
        />
      </div>
    </div>
  )
}