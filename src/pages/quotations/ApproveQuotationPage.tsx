import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, AlertCircle, FileText } from 'lucide-react'
import { useQuotationDetail, useApproveQuotation } from '@/hooks/useQuotation'
import { useToastStore } from '@/stores/toastStore'
import { formatDate, formatCurrency } from '@/lib/utils'

export function ApproveQuotationPage() {
  const { id } = useParams<{ id: string }>()
  const quotationId = Number(id)
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)
  const [serverError, setServerError] = useState('')

  const { data, isLoading, isError } = useQuotationDetail(quotationId)
  const approveMutation = useApproveQuotation()

  const master = data?.priceQuotationMasterData
  const items = data?.priceQuotationDetailList ?? []

  const handleApprove = () => {
    setServerError('')
    approveMutation.mutate(
      { pqSystemId: quotationId, isApproved: true },
      {
        onSuccess: (res) => {
          if (res.errMsg) setServerError(res.errMsg)
          else {
            showToast({ message: 'Quotation approved successfully', type: 'success' })
            navigate('/quotations/unapproved')
          }
        },
        onError: (err) => setServerError((err as Error).message || 'Something went wrong'),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 text-red-500" />
          <p className="text-sm text-red-700">Failed to load quotation details.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/quotations/unapproved"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Approve Quotation</h1>
          <p className="text-xs text-gray-500">{master?.pqSystemNo} · {master?.customerName}</p>
        </div>
      </div>

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Meta summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FileText size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Quotation Summary</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Quotation #</p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">{master?.pqSystemNo}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Customer</p>
            <p className="mt-0.5 text-sm text-gray-900">{master?.customerName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Date</p>
            <p className="mt-0.5 text-sm text-gray-600">
              {master?.pqOrderDate ? formatDate(master.pqOrderDate) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Currency</p>
            <p className="mt-0.5 text-sm text-gray-600">{master?.pqCurrencyName}</p>
          </div>
        </div>
      </div>

      {/* Line items review */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Products ({items.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3 text-left">#</th>
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-right">Unit Price</th>
                <th className="px-5 py-3 text-right">VAT %</th>
                <th className="px-5 py-3 text-right">AIT %</th>
                <th className="px-5 py-3 text-right">Adj.</th>
                <th className="px-5 py-3 text-right">Calc. Price</th>
                <th className="px-5 py-3 text-right">Final Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-400">No line items.</td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{item.productName}</td>
                    <td className="px-5 py-3 text-right text-gray-700">
                      {formatCurrency(item.pqdProductUnitPrice, master?.pqCurrencyName)}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">{item.pqdAppliedVatPercantage}%</td>
                    <td className="px-5 py-3 text-right text-gray-600">{item.pqdAppliedAitPercantage}%</td>
                    <td className="px-5 py-3 text-right text-gray-600">
                      {item.pqdAdustedAmount !== 0
                        ? formatCurrency(item.pqdAdustedAmount, master?.pqCurrencyName)
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700">
                      {formatCurrency(item.pqdCalculatedPrice, master?.pqCurrencyName)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(item.pqdFinalPrice, master?.pqCurrencyName)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve action */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleApprove}
          disabled={approveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
        >
          {approveMutation.isPending
            ? <Loader2 size={14} className="animate-spin" />
            : <Check size={14} />}
          Approve Quotation
        </button>
        <Link
          to="/quotations/unapproved"
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </div>
  )
}
