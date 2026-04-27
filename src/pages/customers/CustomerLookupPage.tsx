import { useState } from 'react'
import { Loader2, Search, User, Package } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { useCustomerDetail } from '@/hooks/useCustomers'
import { useProductDetail } from '@/hooks/useProducts'
import { useCurrentStock } from '@/hooks/useStockOut'

export function CustomerLookupPage() {
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [productId, setProductId] = useState<number | null>(null)

  const {
    data: customer,
    isLoading: customerLoading,
  } = useCustomerDetail(customerId ?? undefined)

  const {
    data: product,
    isLoading: productLoading,
  } = useProductDetail(productId ?? undefined)

  // Stock requires both product and a channel — use channel 0 for all / skip channel requirement
  // We'll show per-channel stock only when product is selected; channel defaults to first available
  // For lookup purposes we pass productId + channelId=0 (handled by the hook: enabled only when both set)
  // So we'll display a note that channel must be paired for stock
  const { data: stockItems = [], isLoading: stockLoading } = useCurrentStock(
    productId ?? undefined,
    undefined, // not showing stock without channel selection — shows placeholder instead
  )

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
            <Search size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Customer Lookup</h2>
            <p className="mt-1 text-sm text-gray-500">
              Look up customer info or product details instantly.
            </p>
          </div>
        </div>
      </div>

      {/* ── Two panels ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* ── Product Panel ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Package size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">Product Info</h3>
          </div>
          <div className="mt-4">
            <PaginatedCombobox
              type="product"
              value={productId}
              onChange={(id) => setProductId(id)}
              placeholder="Search product…"
            />
          </div>

          {productLoading && (
            <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={15} className="animate-spin" /> Loading…
            </div>
          )}

          {!productLoading && product && (
            <dl className="mt-4 divide-y divide-gray-100 text-sm">
              <InfoRow label="Product ID" value={String(product.productId)} />
              <InfoRow label="Name" value={product.productName} />
              <InfoRow label="Category" value={product.productCategoryName ?? '-'} />
              <InfoRow label="Function" value={product.functionName ?? '-'} />
              <InfoRow label="Brand" value={product.brandName ?? '-'} />
              <InfoRow label="Group" value={product.groupName ?? '-'} />
              <InfoRow label="HS Code" value={product.hsCode ?? '-'} />
              <InfoRow label="Pack Size" value={product.productPackSize ?? '-'} />
              <InfoRow label="Shelf Life" value={product.productShelfLife != null ? `${product.productShelfLife} days` : '-'} />
            </dl>
          )}

          {!productLoading && !product && productId && (
            <p className="mt-6 text-xs text-gray-400">No product data found.</p>
          )}

          {!productId && (
            <p className="mt-6 text-xs text-gray-400">Select a product to view details.</p>
          )}
        </div>

        {/* ── Customer Panel ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <User size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">Customer Info</h3>
          </div>
          <div className="mt-4">
            <PaginatedCombobox
              type="customer"
              value={customerId}
              onChange={(id) => setCustomerId(id)}
              placeholder="Search customer…"
            />
          </div>

          {customerLoading && (
            <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={15} className="animate-spin" /> Loading…
            </div>
          )}

          {!customerLoading && customer && (
            <dl className="mt-4 divide-y divide-gray-100 text-sm">
              <InfoRow label="Customer ID" value={String(customer.customerId)} />
              <InfoRow label="Name" value={customer.customerName} />
              <InfoRow label="Contact" value={customer.contactNumber ?? '-'} />
              <InfoRow label="Address" value={customer.customerAddress ?? '-'} />
              <InfoRow label="Channel" value={customer.channelName ?? '-'} />
              <InfoRow
                label="Belongs To"
                value={
                  [customer.empFirstName, customer.empLastName].filter(Boolean).join(' ').trim() || '-'
                }
              />
              <InfoRow label="Payment Mode" value={customer.paymentMode ?? '-'} />
              <InfoRow label="Status" value={customer.currentStatus ?? '-'} />
              <InfoRow label="Special Note" value={customer.specialNote ?? '-'} />
            </dl>
          )}

          {!customerLoading && !customer && customerId && (
            <p className="mt-6 text-xs text-gray-400">No customer data found.</p>
          )}

          {!customerId && (
            <p className="mt-6 text-xs text-gray-400">Select a customer to view details.</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Helper ─── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="shrink-0 text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-right text-xs text-gray-900">{value}</dd>
    </div>
  )
}
