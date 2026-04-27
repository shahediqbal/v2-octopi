import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Download, Loader2, AlertCircle, History, Pencil, Tag } from 'lucide-react'
import { useSellingPrices } from '@/hooks/usePrice'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import { PriceHistoryModal } from './PriceHistoryModal'
import type { SellingPrice } from '@/types/price'

export function SellingPriceListPage() {
  const { data: prices = [], isLoading, isError, error } = useSellingPrices()
  const [search, setSearch] = useState('')
  const [historyTarget, setHistoryTarget] = useState<{ id: number; name: string } | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Client-side filter
  const filtered = prices.filter((p) =>
    p.productName.toLowerCase().includes(search.toLowerCase()),
  )

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportExcelOnDemand({
        filename: 'selling-prices',
        sheetName: 'Selling Prices',
        columns: [
          { header: 'Product', key: 'productName', width: 40 },
          { header: 'Selling Price', key: 'productPrice', width: 18 },
          { header: 'Discounted Price', key: 'productDicsountedPrice', width: 20 },
          { header: 'Price Code', key: 'productPriceCode', width: 18 },
          { header: 'Active From', key: 'productPriceActiveFrom', width: 20 },
          { header: 'Status', key: 'productPriceActiveStatus', width: 12 },
        ],
        rows: filtered.map((p) => ({
          ...p,
          productPriceActiveFrom: p.productPriceActiveFrom
            ? formatDate(p.productPriceActiveFrom)
            : '',
          productPriceActiveStatus: p.productPriceActiveStatus === 1 ? 'Active' : 'Inactive',
        })),
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Selling Prices</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Loading…' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            Export
          </button>
          <Link
            to="/selling-prices/add"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
          >
            <Plus size={15} /> Add Price
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name…"
          className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading prices…</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{(error as Error)?.message ?? 'Failed to load selling prices'}</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-right">Price</th>
                  <th className="px-5 py-3 text-right">Discounted Price</th>
                  <th className="px-5 py-3 text-left">Price Code</th>
                  <th className="px-5 py-3 text-left">Active From</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Tag size={24} className="text-gray-300" />
                        <span>{search ? 'No matching products.' : 'No selling prices yet.'}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((price: SellingPrice, idx) => (
                    <tr key={price.productId} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{price.productName}</td>
                      <td className="px-5 py-3 text-right text-gray-800">
                        {formatCurrency(price.productPrice)}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        {formatCurrency(price.productDicsountedPrice)}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{price.productPriceCode || '—'}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {price.productPriceActiveFrom
                          ? formatDate(price.productPriceActiveFrom)
                          : '—'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            price.productPriceActiveStatus === 1
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {price.productPriceActiveStatus === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setHistoryTarget({ id: price.productId, name: price.productName })
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <History size={12} /> History
                          </button>
                          <Link
                            to={`/selling-prices/${price.productId}/edit`}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <Pencil size={12} /> Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {historyTarget && (
        <PriceHistoryModal
          productId={historyTarget.id}
          productName={historyTarget.name}
          mode="selling"
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  )
}
