import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, GitCompareArrows, Loader2, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PaginatedCombobox } from '@/components/dropdowns'
import {
  useMapProduct,
  useMappedCandidateProducts,
  useMappedProductsForProduct,
  useProductCategories,
  useProductDetail,
} from '@/hooks/useProducts'

export function ProductMappingPage() {
  const [targetProductId, setTargetProductId] = useState<number | null>(null)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [serverError, setServerError] = useState('')
  const [savedOnce, setSavedOnce] = useState(false)

  const { data: categories, isLoading: loadingCategories } = useProductCategories()
  const { data: targetProduct } = useProductDetail(targetProductId ?? undefined)
  const { data: candidates = [], isLoading: loadingCandidates, isError: candidatesError, error: candidateError } =
    useMappedCandidateProducts(categoryId)
  const { data: alreadyMapped = [] } = useMappedProductsForProduct(targetProductId)
  const mapMutation = useMapProduct()

  useEffect(() => {
    if (!targetProductId) {
      setCategoryId(null)
      setSelectedIds([])
      setSavedOnce(false)
      return
    }

    const nextCategoryId = targetProduct?.categoryId ?? targetProduct?.productCategoryId ?? null
    if (nextCategoryId) setCategoryId(nextCategoryId)
  }, [targetProduct, targetProductId])

  useEffect(() => {
    if (!targetProductId) return
    setSelectedIds(alreadyMapped.map((item) => item.id))
  }, [alreadyMapped, targetProductId])

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase()
    return candidates.filter((item) => {
      if (item.id === targetProductId) return false
      if (!query) return true
      return item.label.toLowerCase().includes(query)
    })
  }, [candidates, search, targetProductId])

  const handleToggle = (productId: number) => {
    setSelectedIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    )
  }

  const handleSave = () => {
    if (!targetProductId) {
      setServerError('Please select a target product')
      return
    }

    setServerError('')
    mapMutation.mutate(
      { productId: targetProductId, mappedIds: selectedIds },
      {
        onSuccess: (res) => {
          if (res.errMsg) setServerError(res.errMsg)
          else setSavedOnce(true)
        },
        onError: (err) => setServerError((err as Error).message || 'Failed to save product mapping'),
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
          <h1 className="text-2xl font-bold text-gray-900">Product Mapping</h1>
          <p className="mt-0.5 text-sm text-gray-500">Select a target product and assign mapped products.</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Target Product *</label>
            <PaginatedCombobox type="product" value={targetProductId} onValueChange={setTargetProductId} placeholder="Search product" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Search Candidates</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search mapped candidates"
                className={`${inputCls} pl-8`}
                disabled={!categoryId}
              />
            </div>
          </div>
        </div>

        {serverError && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>}
        {savedOnce && !serverError && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Mapping saved successfully.</div>}

        {!targetProductId && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12 text-center">
            <GitCompareArrows size={28} className="text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-700">Select a target product</p>
            <p className="mt-1 text-sm text-gray-500">The matching category will be loaded automatically.</p>
          </div>
        )}

        {targetProductId && loadingCandidates && (
          <div className="mt-8 flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin text-gray-400" />
            <span className="ml-3 text-sm text-gray-500">Loading mapped candidates…</span>
          </div>
        )}

        {candidatesError && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to load mapped candidates</p>
              <p className="mt-1 text-xs text-red-600">{(candidateError as Error)?.message}</p>
            </div>
          </div>
        )}

        {targetProductId && !loadingCandidates && !candidatesError && (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <span className="font-semibold text-gray-900">Target:</span> {targetProduct?.productName ?? `Product #${targetProductId}`}
              {targetProduct?.productCategoryName && <span className="ml-2 text-gray-500">· {targetProduct.productCategoryName}</span>}
            </div>

            <div className="max-h-[520px] overflow-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Select</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-gray-400">No candidates found for this category.</td>
                    </tr>
                  ) : (
                    filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(candidate.id)}
                            onChange={() => handleToggle(candidate.id)}
                            className="h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-800">{candidate.label}</td>
                        <td className="px-4 py-3 text-gray-500">{candidate.id}</td>
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
                disabled={mapMutation.isPending || !targetProductId}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mapMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                Save Mapping
              </button>
              <p className="text-sm text-gray-500">{selectedIds.length} product(s) selected</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'