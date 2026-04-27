import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useCustomerCredit, useCustomerLastPayment, useCurrentStock, useCustomerPriceSummary } from '@/hooks/useStockOut'

interface PaymentInfoProps {
  customerId: number | null | undefined
  productId: number | null | undefined
  channelId: number | null | undefined
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString('en-US')
}

export function PaymentInfo({ customerId, productId, channelId }: PaymentInfoProps) {
  const [showAllPrices, setShowAllPrices] = useState(false)

  const { data: stockItems, isLoading: stockLoading, isError: stockError } = useCurrentStock(productId ?? undefined, channelId ?? undefined)
  const { data: creditData, isLoading: creditLoading, isError: creditError } = useCustomerCredit(customerId)
  const { data: paymentData, isLoading: paymentLoading, isError: paymentError } = useCustomerLastPayment(customerId)
  const { data: priceHistory = [], isLoading: priceLoading, isError: priceError } = useCustomerPriceSummary(customerId, productId)

  const currentQty = stockItems?.[0]?.currentQty ?? null
  const productName = stockItems?.[0]?.productName ?? null
  const credit = formatNumber(creditData?.totalDue)
  const lastPaymentDate = formatDate(paymentData?.paymentDate)
  const lastPaymentAmount = formatNumber(paymentData?.paymentAmount)
  const parsedCurrentQty = currentQty == null ? null : Number(currentQty)
  const hasProduct = !!productId
  const hasCustomer = !!customerId
  const hasPaymentInfo = !!paymentData && (paymentData.paymentDate != null || paymentData.paymentAmount != null)

  const visiblePrices = showAllPrices ? priceHistory : priceHistory.slice(0, 3)

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm text-sm space-y-4">

      {/* Price History */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Price History</h4>
        {!hasProduct ? (
          <InfoMessage title="Select a product to view price history" />
        ) : priceLoading ? (
          <LoadingMessage />
        ) : priceError ? (
          <InfoMessage title="Could not load price history" tone="danger" />
        ) : priceHistory.length === 0 ? (
          <InfoMessage title="No price history available" subtitle="No previous orders found for this product" />
        ) : (
          <>
            {productName && <p className="mb-1.5 font-semibold text-gray-800">{productName}</p>}
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-1 text-left font-medium text-gray-500">Date</th>
                  <th className="pb-1 text-right font-medium text-gray-500">Price</th>
                </tr>
              </thead>
              <tbody>
                {visiblePrices.map((row, i) => (
                  <tr key={`${row.invoiceDate ?? 'unknown'}-${i}`} className="border-b border-gray-100 last:border-0">
                    <td className="py-1 text-gray-700">{formatDate(row.invoiceDate)}</td>
                    <td className="py-1 text-right font-semibold text-gray-900">{formatNumber(row.sodConfirmedUnitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {priceHistory.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllPrices((p) => !p)}
                className="mt-1 text-xs text-gray-500 underline hover:text-gray-800"
              >
                {showAllPrices ? 'Show less' : `Show all (${priceHistory.length})`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Business Intelligence / Stock */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Business Intelligence</h4>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
          <span className="text-gray-600">Stock Availability</span>
          {stockLoading ? (
            <LoadingMessage compact />
          ) : !hasProduct ? (
            <Badge tone="muted">Select product</Badge>
          ) : stockError ? (
            <Badge tone="danger">Error</Badge>
          ) : parsedCurrentQty == null ? (
            <Badge tone="muted">No stock</Badge>
          ) : (
            <Badge tone={parsedCurrentQty > 10 ? 'success' : 'danger'}>{String(parsedCurrentQty)}</Badge>
          )}
        </div>
      </div>

      {/* Credit Status */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Credit Status</h4>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
          <span className="text-gray-600">Total Due</span>
          {creditLoading ? (
            <LoadingMessage compact />
          ) : !hasCustomer ? (
            <Badge tone="muted">Select customer</Badge>
          ) : creditError ? (
            <Badge tone="danger">Error</Badge>
          ) : creditData ? (
            <span className={`font-bold ${Number(creditData.totalDue ?? 0) > 0 ? 'text-red-600' : 'text-green-700'}`}>{credit}</span>
          ) : (
            <Badge tone="muted">No data</Badge>
          )}
        </div>
      </div>

      {/* Last Payment */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Last Payment</h4>
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
          {paymentLoading ? (
            <LoadingMessage />
          ) : !hasCustomer ? (
            <InfoMessage title="Select customer" compact />
          ) : paymentError ? (
            <InfoMessage title="Could not load payment info" tone="danger" compact />
          ) : hasPaymentInfo ? (
            <>
              <div className="font-semibold text-gray-900">{paymentData?.paymentDate ? lastPaymentDate : 'Date unavailable'}</div>
              {paymentData.paymentAmount != null && (
                <div className="mt-1 text-xs text-gray-600">Amount: {lastPaymentAmount}</div>
              )}
            </>
          ) : (
            <InfoMessage title="No payments" compact />
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingMessage({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
      <Loader2 size={compact ? 12 : 14} className="animate-spin" /> Loading...
    </span>
  )
}

function InfoMessage({
  title,
  subtitle,
  tone = 'muted',
  compact = false,
}: {
  title: string
  subtitle?: string
  tone?: 'muted' | 'danger'
  compact?: boolean
}) {
  return (
    <div className={compact ? 'text-xs' : 'py-1'}>
      <p className={`font-medium ${tone === 'danger' ? 'text-red-600' : 'text-gray-700'}`}>{title}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
    </div>
  )
}

function Badge({ children, tone }: { children: string; tone: 'muted' | 'danger' | 'success' }) {
  const className =
    tone === 'success'
      ? 'border-green-200 bg-green-50 text-green-700'
      : tone === 'danger'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-gray-200 bg-gray-50 text-gray-500'

  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`}>{children}</span>
}
