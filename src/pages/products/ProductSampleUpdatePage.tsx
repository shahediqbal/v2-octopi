import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, Loader2, Search, TestTubeDiagonal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProductCategories, useProductsByCategory, useUpdateProductSamples } from '@/hooks/useProducts'

export function ProductSampleUpdatePage() {
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [serverError, setServerError] = useState('')
  const [savedOnce, setSavedOnce] = useState(false)

  const { data: categories, isLoading: loadingCategories } = useProductCategories()
  const { data: categoryProducts = [], isLoading, isError, error } = useProductsByCategory(categoryId)
  const updateSamplesMutation = useUpdateProductSamples()

  useEffect(() => {
    setSavedOnce(false)
  }, [categoryId])

  useEffect(() => {
    setSelectedIds(categoryProducts.filter((product) => product.sampleProduct === 1).map((product) => product.productId))
  }, [categoryProducts])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return categoryProducts.filter((product) => {
      if (!query) return true
      return product.productName?.toLowerCase().includes(query)
    })
  }, [categoryProducts, search])

  const handleToggle = (productId: number) => {
    setSelectedIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    )
  }

  const handleSave = () => {
    if (!categoryId) {
      setServerError('Please select a category')
      return
    }

    setServerError('')
    updateSamplesMutation.mutate(
      categoryProducts.map((product) => ({
        productId: product.productId,
        sampleProduct: selectedIds.includes(product.productId) ? 1 : 0,
      })),
      {
        onSuccess: (res) => {
          if (res.errMsg) setServerError(res.errMsg)
          else setSavedOnce(true)
        },
        onError: (err) => setServerError((err as Error).message || 'Failed to update sample products'),
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
          <h1 className="text-2xl font-bold text-gray-900">Product Sample Update</h1>
          <p className="mt-0.5 text-sm text-gray-500">Choose a category and mark which products are sample products.</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Product Category</label>
            <select
              value={categoryId ?? ''}
              onChange={(event) => setCategoryId(event.target.value === '' ? null : Number(event.target.value))}
              className={inputCls}
              disabled={loadingCategories}
            >
              <option value="">Select category</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Search Products</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products in this category"
                className={`${inputCls} pl-8`}
                disabled={!categoryId}
              />
            </div>
          </div>
        </div>

        {serverError && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>}
        {savedOnce && !serverError && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Sample products updated successfully.</div>}

        {!categoryId && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12 text-center">
            <TestTubeDiagonal size={28} className="text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-700">Select a category first</p>
            <p className="mt-1 text-sm text-gray-500">Products in that category will appear here for sample assignment.</p>
          </div>
        )}

        {categoryId && isLoading && (
          <div className="mt-8 flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin text-gray-400" />
            <span className="ml-3 text-sm text-gray-500">Loading products…</span>
          </div>
        )}

        {isError && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to load category products</p>
              <p className="mt-1 text-xs text-red-600">{(error as Error)?.message}</p>
            </div>
          </div>
        )}

        {categoryId && !isLoading && !isError && (
          <div className="mt-6 space-y-4">
            <div className="max-h-[520px] overflow-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Sample</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-gray-400">No products found for this category.</td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.productId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(product.productId)}
                            onChange={() => handleToggle(product.productId)}
                            className="h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-800">{product.productName}</td>
                        <td className="px-4 py-3 text-gray-500">{product.productId}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={updateSamplesMutation.isPending || !categoryId}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateSamplesMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                Save Sample Assignment
              </button>
              <p className="text-sm text-gray-500">{selectedIds.length} sample product(s) selected</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'