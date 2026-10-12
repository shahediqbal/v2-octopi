import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { SectionCard } from '@/pages/sales-orders/review-cockpit/SectionCard'
import { toCurrency, toNumber } from '@/pages/sales-orders/review-cockpit/format'
import { getLastNDaysRange, useCustomerCreditSaleSummary } from '@/hooks/useReviewCockpit'
import { CreditDetailsModal } from '@/pages/sales-orders/review-cockpit/CreditDetailsModal'

interface CreditSectionProps {
  customerId: number | null
  /** When omitted the Current Order and New Closing Balance rows are hidden */
  orderValue?: number
  orderNumber?: string | number
}

export function CreditSection({ customerId, orderValue, orderNumber }: CreditSectionProps) {
  const range90 = getLastNDaysRange(90)
  const { data, isLoading, isError, error } = useCustomerCreditSaleSummary(
    customerId,
    range90.startDate,
    range90.endDate,
  )
  const [detailsOpen, setDetailsOpen] = useState(false)

  const row = data?.[0]
  const openingBalance = toNumber(row?.openingCredit)
  const totalSales = toNumber(row?.totalSale)
  const totalPayment = toNumber(row?.totalPaid)
  const totalAdjustment = toNumber(row?.totalAdjustment)
  const closingBalance = toNumber(row?.totalDue)
  const newClosing = orderValue !== undefined ? closingBalance + orderValue : null

  return (
    <SectionCard
      title="Credit (Last 90 Days)"
      subtitle={`${range90.startDate} → ${range90.endDate}`}
      right={isLoading ? <Loader2 size={16} className="mt-0.5 animate-spin text-gray-400" /> : null}
      action={
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          View Details
        </button>
      }
    >
      {isError && <p className="text-sm text-red-600">{(error as Error)?.message}</p>}

      <div className="overflow-hidden rounded-lg border border-gray-100">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            <Row label="Opening Balance" value={toCurrency(openingBalance)} />
            <Row label="Total Sales" value={toCurrency(totalSales)} />
            <Row label="Total Payment" value={toCurrency(totalPayment)} />
            <Row label="Total Adjustment" value={toCurrency(totalAdjustment)} />
            <Row label="Closing Balance" value={toCurrency(closingBalance)} bold />
            {orderValue !== undefined && (
              <>
                <tr className="bg-blue-50">
                  <td className="px-4 py-2.5 text-gray-800">
                    Current Order
                    {orderNumber && (
                      <span className="ml-2 inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        #{orderNumber}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{toCurrency(orderValue)}</td>
                </tr>
                <tr className="bg-green-50">
                  <td className="px-4 py-2.5 font-semibold text-gray-800">New Closing Balance</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900">{toCurrency(newClosing!)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {detailsOpen && (
        <CreditDetailsModal
          customerId={customerId}
          onClose={() => setDetailsOpen(false)}
        />
      )}
    </SectionCard>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr>
      <td className="px-4 py-2 text-gray-700">{label}</td>
      <td className={`px-4 py-2 text-right ${bold ? 'font-semibold' : ''} text-gray-900`}>{value}</td>
    </tr>
  )
}
