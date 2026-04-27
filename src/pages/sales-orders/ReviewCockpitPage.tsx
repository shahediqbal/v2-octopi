import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useBulkEscalate, useStockOutDetail } from '@/hooks/useStockOut'
import { CustomerBasicInfo } from '@/pages/sales-orders/review-cockpit/CustomerBasicInfo'
import { LifetimeSummary } from '@/pages/sales-orders/review-cockpit/LifetimeSummary'
import { CreditSection } from '@/pages/sales-orders/review-cockpit/CreditSection'
import { ProductLoanSection } from '@/pages/sales-orders/review-cockpit/ProductLoanSection'
import { ChequeSection } from '@/pages/sales-orders/review-cockpit/ChequeSection'
import { LCSection } from '@/pages/sales-orders/review-cockpit/LCSection'
import { TaxAitSection } from '@/pages/sales-orders/review-cockpit/TaxAitSection'
import { toCurrency, toNumber } from '@/pages/sales-orders/review-cockpit/format'

function toSafeId(raw: string | undefined): number | null {
  const numeric = Number(raw)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

export function ReviewCockpitPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const salesOrderId = useMemo(() => toSafeId(id), [id])

  const { data: detail, isLoading, isError, error } = useStockOutDetail(salesOrderId ?? undefined)
  const customerId = detail?.stockOutGeneralData?.soCustomerId ?? null

  const orderNo = detail?.stockOutGeneralData?.soSystemNo ?? (salesOrderId ?? '')
  const orderDate = detail?.stockOutGeneralData?.invoiceDate ?? detail?.stockOutGeneralData?.dateOfIssue ?? '—'
  const partnerName = detail?.stockOutGeneralData?.customerName ?? '—'
  const orderValue = toNumber(
    detail?.stockOutBillData?.sobFinalConvertedBill ?? detail?.stockOutBillData?.finalBill ?? detail?.stockOutBillData?.calculatedBill,
  )

  const bulkEscalate = useBulkEscalate()
  const [confirmEscalate, setConfirmEscalate] = useState(false)

  const handleOpenEscalate = useCallback(() => {
    if (!salesOrderId) return
    setConfirmEscalate(true)
  }, [salesOrderId])

  const handleConfirmEscalate = useCallback(async () => {
    if (!salesOrderId) return
    try {
      await bulkEscalate.mutateAsync([salesOrderId])
      setConfirmEscalate(false)
    } catch {
      // handled by mutation state
    }
  }, [salesOrderId, bulkEscalate])

  if (!salesOrderId) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Invalid sales order id.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sales order <span className="font-medium text-gray-700">{orderNo}</span> • {partnerName} • {orderDate}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <Link
            to={`/sales-orders/${salesOrderId}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Edit
          </Link>

          <button
            type="button"
            onClick={handleOpenEscalate}
            disabled={bulkEscalate.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
          >
            {bulkEscalate.isPending && <Loader2 size={16} className="animate-spin" />}
            Escalate
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading review cockpit…</span>
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load sales order</p>
            <p className="mt-1 text-xs text-red-600">{(error as Error)?.message}</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <CustomerBasicInfo customerId={customerId} />
            <LifetimeSummary customerId={customerId} />
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Order Summary</div>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Order Value</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">{toCurrency(orderValue)}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Customer ID</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">{customerId ?? '—'}</div>
                </div>
              </div>
            </div>

            <CreditSection customerId={customerId} orderValue={orderValue} orderNumber={orderNo} />
            <ProductLoanSection customerId={customerId} />
            <ChequeSection customerId={customerId} />
            <LCSection customerId={customerId} />
            <TaxAitSection customerId={customerId} />
          </div>
        </div>
      )}

      {confirmEscalate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-base font-semibold text-gray-900">Escalate Order</h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to escalate this order? This data will be sent to the operation team.
            </p>
            <div className="mt-2 text-xs text-gray-500">Order value: {toCurrency(orderValue)}</div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmEscalate(false)}
                disabled={bulkEscalate.isPending}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEscalate}
                disabled={bulkEscalate.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
              >
                {bulkEscalate.isPending && <Loader2 size={14} className="animate-spin" />}
                Escalate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
