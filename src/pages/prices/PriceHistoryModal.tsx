import { useState } from 'react'
import { X, Loader2, History } from 'lucide-react'
import { useSellingPriceHistory, usePurchasePriceHistory } from '@/hooks/usePrice'
import { formatDate, formatCurrency } from '@/lib/utils'

interface PriceHistoryModalProps {
  productId: number
  productName: string
  mode: 'selling' | 'purchase'
  onClose: () => void
}

export function PriceHistoryModal({
  productId,
  productName,
  mode,
  onClose,
}: PriceHistoryModalProps) {
  const sellingHistory = useSellingPriceHistory(mode === 'selling' ? productId : null)
  const purchaseHistory = usePurchasePriceHistory(mode === 'purchase' ? productId : null)

  const { data, isLoading, isError } = mode === 'selling' ? sellingHistory : purchaseHistory

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <History size={18} className="text-gray-500" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">Price History</h2>
              <p className="text-xs text-gray-500">{productName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading history…</span>
            </div>
          )}

          {isError && (
            <p className="text-center text-sm text-red-600">Failed to load price history.</p>
          )}

          {!isLoading && !isError && (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-left">Active From</th>
                    <th className="px-4 py-3 text-left">Active To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {!data || data.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                        No history found.
                      </td>
                    </tr>
                  ) : (
                    data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {formatCurrency(
                            mode === 'selling'
                              ? (row as { productPrice?: number }).productPrice ?? 0
                              : (row as { purchasePrice?: number }).purchasePrice ?? 0,
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {(row as { productPriceActiveFrom?: string | null; purchasePriceActiveFrom?: string | null })
                            .productPriceActiveFrom ||
                          (row as { purchasePriceActiveFrom?: string | null }).purchasePriceActiveFrom
                            ? formatDate(
                                (row as { productPriceActiveFrom?: string | null }).productPriceActiveFrom ??
                                  (row as { purchasePriceActiveFrom?: string | null }).purchasePriceActiveFrom!,
                              )
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {(row as { productPriceActiveTo?: string | null; purchasePriceActiveTo?: string | null })
                            .productPriceActiveTo ||
                          (row as { purchasePriceActiveTo?: string | null }).purchasePriceActiveTo
                            ? formatDate(
                                (row as { productPriceActiveTo?: string | null }).productPriceActiveTo ??
                                  (row as { purchasePriceActiveTo?: string | null }).purchasePriceActiveTo!,
                              )
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
