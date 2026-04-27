import { Loader2 } from 'lucide-react'
import { useCustomerDetail } from '@/hooks/useCustomers'
import { SectionCard } from '@/pages/sales-orders/review-cockpit/SectionCard'

interface CustomerBasicInfoProps {
  customerId: number | null
}

function InfoChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
      {children}
    </span>
  )
}

function InfoLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-0.5 text-sm text-gray-900">{value || '—'}</div>
    </div>
  )
}

export function CustomerBasicInfo({ customerId }: CustomerBasicInfoProps) {
  const { data: customer, isLoading, isError, error } = useCustomerDetail(customerId ?? undefined)

  return (
    <SectionCard
      title="Customer"
      subtitle={customerId ? `Customer ID: ${customerId}` : 'Customer not resolved'}
      right={isLoading ? <Loader2 size={16} className="mt-0.5 animate-spin text-gray-400" /> : null}
    >
      {isError && <p className="text-sm text-red-600">{(error as Error)?.message}</p>}

      {!customerId && <p className="text-sm text-gray-600">Missing customer id for this order.</p>}

      {customer && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Column 1 — Basic */}
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500">Customer ID</div>
              <div className="mt-0.5"><InfoChip>{customer.customerId}</InfoChip></div>
            </div>
            <InfoLine label="Name" value={customer.customerName} />
            <InfoLine label="Address" value={customer.customerAddress} />
          </div>

          {/* Column 2 — Status */}
          <div className="space-y-3">
            <InfoLine label="Contact Person" value={customer.contactPersonName} />
            <InfoLine label="Phone" value={customer.contactNumber} />
            <div>
              <div className="text-xs text-gray-500">Marketing Rep</div>
              <div className="mt-0.5">
                <InfoChip>
                  {`${customer.empFirstName ?? ''} ${customer.empLastName ?? ''}`.trim() || '—'}
                </InfoChip>
              </div>
            </div>
          </div>

          {/* Column 3 — Payment & Notes */}
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div className="mt-0.5"><InfoChip>{customer.currentStatus ?? '—'}</InfoChip></div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Payment Mode</div>
              <div className="mt-0.5"><InfoChip>{customer.paymentMode ?? '—'}</InfoChip></div>
            </div>
            {customer.specialNote && (
              <div className="rounded-lg bg-yellow-50 p-3">
                <div className="text-xs font-medium text-yellow-800">Special Note</div>
                <div className="mt-0.5 text-sm text-yellow-900">{customer.specialNote}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {!isLoading && !customer && customerId && !isError && (
        <p className="text-sm text-gray-600">No customer data found.</p>
      )}
    </SectionCard>
  )
}
