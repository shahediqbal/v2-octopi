import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ChevronDown, GitCompareArrows, Loader2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PaginatedCombobox } from '@/components/dropdowns'
import {
  useMapProduct,
  useMappedProductsForProduct,
  useProducts,
} from '@/hooks/useProducts'
import type { ProductLookupOption } from '@/types/product'

export function ProductMappingPage() {
  const [targetProductId, setTargetProductId] = useState<number | null>(null)
  const [mappedItems, setMappedItems] = useState<ProductLookupOption[]>([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [serverError, setServerError] = useState('')
  const [savedOnce, setSavedOnce] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: allProducts = [], isLoading: loadingProducts } = useProducts()
  const { data: alreadyMapped = [], isLoading: loadingMapped } = useMappedProductsForProduct(targetProductId)
  const mapMutation = useMapProduct()

  // Pre-fill from already mapped when target changes
  useEffect(() => {
    if (!targetProductId) {
      setMappedItems([])
      setSavedOnce(false)
      setServerError('')
      return
    }
    setMappedItems(alreadyMapped)
  }, [alreadyMapped, targetProductId])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // All products as lookup options, excluding target, filtered by search
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allProducts
      .filter((p) => p.productId !== targetProductId)
      .filter((p) => !q || p.productName.toLowerCase().includes(q))
      .slice(0, 100)
      .map((p) => ({ id: p.productId, label: p.productName }))
  }, [allProducts, search, targetProductId])

  const handleAddItem = (item: ProductLookupOption) => {
    setMappedItems((prev) => (prev.some((p) => p.id === item.id) ? prev : [...prev, item]))
    setSearch('')
    setShowDropdown(false)
  }

  const handleRemove = (id: number) => setMappedItems((prev) => prev.filter((p) => p.id !== id))

  const handleReset = () => {
    setTargetProductId(null)
    setMappedItems([])
    setSearch('')
    setServerError('')
    setSavedOnce(false)
  }

  const handleSave = () => {
    if (!targetProductId) {
      setServerError('Please select a target product')
      return
    }
    setServerError('')
    mapMutation.mutate(
      { productId: targetProductId, mappedIds: mappedItems.map((p) => p.id) },
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
          <h1 className="text-2xl font-bold text-gray-900">Map Control</h1>
          <p className="mt-0.5 text-sm text-gray-500">Map a product</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Target Product */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Target Product *</label>
            <PaginatedCombobox
              type="product"
              value={targetProductId}
              onValueChange={setTargetProductId}
              placeholder="Search product"
            />
          </div>

          {/* Mapped With multi-select */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mapped With</label>
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => targetProductId && setShowDropdown((v) => !v)}
                disabled={!targetProductId || loadingProducts}
                className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <span>{loadingProducts ? 'Loading…' : 'Add product to map'}</span>
                <ChevronDown size={14} className="shrink-0 text-gray-400" />
              </button>

              {showDropdown && (
                <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                  <div className="border-b border-gray-100 p-2">
                    <input
                      autoFocus
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search…"
                      className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                  </div>
                  <ul className="max-h-60 overflow-y-auto py-1">
                    {filteredOptions.length === 0 ? (
                      <li className="px-4 py-3 text-sm text-gray-400">No products found</li>
                    ) : (
                      filteredOptions.map((opt) => (
                        <li key={opt.id}>
                          <button
                            type="button"
                            onClick={() => handleAddItem(opt)}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${mappedItems.some((p) => p.id === opt.id) ? 'font-semibold text-green-700' : 'text-gray-800'}`}
                          >
                            {opt.label}
                            {mappedItems.some((p) => p.id === opt.id) && <span className="ml-2 text-xs text-green-600">✓</span>}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected (Mapped With) tags */}
        {loadingMapped && targetProductId ? (
          <div className="mt-4 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">Loading mapped products…</span>
          </div>
        ) : mappedItems.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {mappedItems.map((item) => (
              <span key={item.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800">
                {item.label}
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="ml-0.5 rounded-full p-0.5 text-gray-500 hover:text-gray-900"
                  aria-label={`Remove ${item.label}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        ) : targetProductId ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 text-center">
            <GitCompareArrows size={26} className="text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No products mapped yet. Use the dropdown above to add.</p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12 text-center">
            <GitCompareArrows size={28} className="text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-700">Select a target product</p>
            <p className="mt-1 text-sm text-gray-500">Then add the products to map with it.</p>
          </div>
        )}

        {serverError && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>}
        {savedOnce && !serverError && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Mapped successfully.</div>}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={mapMutation.isPending || !targetProductId}
            className="action-update inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mapMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Map Product
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="action-report rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Reset
          </button>
          <p className="text-sm text-gray-500">{mappedItems.length} product(s) selected</p>
        </div>
      </div>
    </div>
  )
}
