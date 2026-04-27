import { useCallback, useMemo, useRef, useState } from 'react'
import { AlertCircle, Boxes, GitCompareArrows, Loader2, Pencil, Plus, Search, TestTubeDiagonal, Trash2, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'
import { useDeleteProduct, usePaginatedProducts } from '@/hooks/useProducts'

export function ProductListPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePaginatedProducts(debouncedSearch)
  const deleteMutation = useDeleteProduct()

  const products = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  )
  const totalRecords = data?.pages[0]?.totalRecords ?? 0

  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (isFetchingNextPage) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      })
      if (node) observerRef.current.observe(node)
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  )

  const handleDelete = (productId: number) => {
    if (!window.confirm('Delete this product? This action cannot be undone.')) return
    deleteMutation.mutate(productId)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalRecords > 0 ? `${totalRecords} total products` : isLoading ? 'Loading…' : 'No products'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/products/functions" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
            <Workflow size={16} /> Functions
          </Link>
          <Link to="/products/mapping" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
            <GitCompareArrows size={16} /> Mapping
          </Link>
          <Link to="/products/samples" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
            <TestTubeDiagonal size={16} /> Sample Update
          </Link>
          <Link to="/products/add" className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700">
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by product, category, function, level…"
          className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading products…</span>
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load products</p>
            <p className="mt-1 text-xs text-red-600">{(error as Error)?.message}</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Function</th>
                  <th className="px-5 py-3">Level</th>
                  <th className="px-5 py-3">Pack Size</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Boxes size={24} className="text-gray-300" />
                        <span>{search ? 'No matching products found.' : 'No products yet.'}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr
                      key={product.productId}
                      ref={index === products.length - 1 ? sentinelRef : undefined}
                      className="transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-5 py-3 text-gray-500">{product.productId}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{product.productName}</td>
                      <td className="px-5 py-3 text-gray-700">{product.productCategoryName ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-700">{product.functionName ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{product.productLevel ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{product.productPackSize ?? '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/products/${product.productId}/edit`}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <Pencil size={12} /> Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.productId)}
                            disabled={deleteMutation.isPending}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={20} className="animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading more…</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}