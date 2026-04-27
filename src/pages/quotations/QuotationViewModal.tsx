import { X, Loader2, FileText, AlertCircle } from 'lucide-react'
import { useQuotationDetail } from '@/hooks/useQuotation'
import { formatDate, formatCurrency } from '@/lib/utils'

interface QuotationViewModalProps {
  quotationId: number
  onClose: () => void
}

export function QuotationViewModal({ quotationId, onClose }: QuotationViewModalProps) {
  const { data, isLoading, isError } = useQuotationDetail(quotationId)

  const master = data?.priceQuotationMasterData
  const items = data?.priceQuotationDetailList ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-gray-500" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">Quotation Details</h2>
              {master && (
                <p className="text-xs text-gray-500">
                  {master.pqSystemNo} · {master.customerName}
                </p>
              )}
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
        <div className="p-6 space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading quotation…</span>
            </div>
          )}

          {isError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle size={18} className="mt-0.5 text-red-500" />
              <p className="text-sm text-red-700">Failed to load quotation details.</p>
            </div>
          )}

          {!isLoading && !isError && master && (
            <>
              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Quotation #</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">{master.pqSystemNo}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Customer</p>
                  <p className="mt-0.5 text-sm text-gray-900">{master.customerName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Currency</p>
                  <p className="mt-0.5 text-sm text-gray-900">{master.pqCurrencyName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Date</p>
                  <p className="mt-0.5 text-sm text-gray-600">
                    {master.pqOrderDate ? formatDate(master.pqOrderDate) : '—'}
                  </p>
                </div>
              </div>

              {/* Line items */}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">VAT %</th>
                      <th className="px-4 py-3 text-right">AIT %</th>
                      <th className="px-4 py-3 text-right">Adj.</th>
                      <th className="px-4 py-3 text-right">Final Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                          No line items.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {formatCurrency(item.pqdProductUnitPrice, master.pqCurrencyName)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {item.pqdAppliedVatPercantage}%
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {item.pqdAppliedAitPercantage}%
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {item.pqdAdustedAmount !== 0
                              ? formatCurrency(item.pqdAdustedAmount, master.pqCurrencyName)
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {formatCurrency(item.pqdFinalPrice, master.pqCurrencyName)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
