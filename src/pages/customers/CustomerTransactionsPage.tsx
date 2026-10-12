// ============================================================
// Customer Transactions Page
// Route: /customers/transactions  (picker only)
//        /customers/:id/transactions  (picker + sections)
//
// The customer is selected from a dropdown at the top of the
// page. Picking a different customer navigates to the new
// /customers/:id/transactions URL, which updates all sections.
// ============================================================
import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { PaginatedCombobox } from '@/components/dropdowns'
import { CustomerBasicInfo } from '@/pages/sales-orders/review-cockpit/CustomerBasicInfo'
import { LifetimeSummary } from '@/pages/sales-orders/review-cockpit/LifetimeSummary'
import { CreditSection } from '@/pages/sales-orders/review-cockpit/CreditSection'
import { ProductLoanSection } from '@/pages/sales-orders/review-cockpit/ProductLoanSection'
import { ChequeSection } from '@/pages/sales-orders/review-cockpit/ChequeSection'
import { LCSection } from '@/pages/sales-orders/review-cockpit/LCSection'
import { TaxAitSection } from '@/pages/sales-orders/review-cockpit/TaxAitSection'
import { useCustomerDetail } from '@/hooks/useCustomers'

function toSafeCustomerId(raw: string | undefined): number | null {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function CustomerTransactionsPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const customerId = useMemo(() => toSafeCustomerId(id), [id])

  const { data: customer, isLoading: customerLoading } = useCustomerDetail(customerId ?? undefined)

  const customerName = customer?.customerName ?? null

  function handleCustomerChange(newId: number | null) {
    if (newId) {
      navigate(`/customers/${newId}/transactions`)
    } else {
      navigate('/customers/transactions')
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Transactions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select a customer to view their full transaction history.
        </p>
      </div>

      {/* ── Customer Picker ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Customer
            </label>
            <PaginatedCombobox
              type="customer"
              value={customerId}
              onValueChange={handleCustomerChange}
              placeholder="Search customer…"
              selectedLabel={customerName}
            />
          </div>

          {customerId && (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
              {customerLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
              {!customerLoading && (
                <span className="font-medium text-gray-900">
                  ID: {customerId}
                  {customerName ? ` — ${customerName}` : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Transaction Sections ─────────────────────────────────── */}
      {!customerId && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-sm text-gray-500">Pick a customer above to load their transaction data.</p>
        </div>
      )}

      {customerId && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <CustomerBasicInfo customerId={customerId} />
            <LifetimeSummary customerId={customerId} />
          </div>

          <div className="space-y-6">
            {/* CreditSection without orderValue hides the Current Order rows */}
            <CreditSection customerId={customerId} />
            <ProductLoanSection customerId={customerId} />
            <ChequeSection customerId={customerId} />
            <LCSection customerId={customerId} />
            <TaxAitSection customerId={customerId} />
          </div>
        </div>
      )}
    </div>
  )
}
