import { useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductForm } from './ProductForm'
import type { ProductFormData } from '@/schemas/productSchema'
import { useDeleteProduct, useProductDetail, useUpdateProduct } from '@/hooks/useProducts'
import { getAccessToken } from '@/auth/authBridge'
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

export function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const navigate = useNavigate()
  const { data: product, isLoading, isError, error } = useProductDetail(productId || undefined)
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()
  const [serverError, setServerError] = useState('')

  const formDefaults = useMemo<Partial<ProductFormData> | undefined>(() => {
    if (!product) return undefined
    return {
      productName: product.productName ?? '',
      categoryId: product.categoryId ?? product.productCategoryId ?? null,
      functionId: product.functionId ?? null,
      hsCode: product.hsCode ?? '',
      cooId: product.cooId ?? null,
      brandId: product.brandId ?? null,
      groupId: product.groupId ?? null,
      productLevel: product.productLevel ?? '',
      productShelfLife: product.productShelfLife ?? 12,
      productPackSize: product.productPackSize ?? '',
    }
  }, [product])

  const handleSubmit = (data: ProductFormData) => {
    setServerError('')
    if (data.categoryId == null) {
      setServerError('Please select a category')
      return
    }
    const userSystemId = getUserSystemId()
    const today = todayStr()

    updateMutation.mutate(
      {
        productId,
        productName: data.productName,
        functionId: data.functionId,
        categoryId: data.categoryId,
        mappedWith: product?.mappedWith ?? null,
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

  const handleDelete = () => {
    if (!productId || !window.confirm('Delete this product? This action cannot be undone.')) return
    deleteMutation.mutate(productId, {
      onSuccess: () => navigate('/products'),
      onError: (err) => setServerError((err as Error).message || 'Failed to delete product'),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading product…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-800">Failed to load product</p>
          <p className="mt-1 text-xs text-red-600">{(error as Error)?.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/products" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="mt-0.5 text-sm text-gray-500">{product?.productName} — ID #{productId}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          Delete Product
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ProductForm
          defaultValues={formDefaults}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          submitLabel="Update Product"
          serverError={serverError}
        />
      </div>
    </div>
  )
}