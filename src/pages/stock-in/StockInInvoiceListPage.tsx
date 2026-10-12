// ============================================================
// Stock-In — Invoice List Page
// Mirrors legacy: StockInInvoiceList.js
// ============================================================
import { useState } from 'react'
import { Loader2, AlertCircle, RefreshCw, Eye, Search } from 'lucide-react'
import { useStockInInvoiceList, useStockInLookups } from '@/hooks/useStockIn'
import { PaginatedCombobox } from '@/components/dropdowns/PaginatedCombobox'
import { STOCK_IN_ORDER_TYPES, type StockInInvoiceFilters } from '@/types/stockIn'
import { ChallanModal } from './ChallanModal'

export function StockInInvoiceListPage() {
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [jobTypeId, setJobTypeId] = useState<number | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appliedFilters, setAppliedFilters] = useState<StockInInvoiceFilters>({})
  const [hasSearched, setHasSearched] = useState(false)
  const [challanId, setChallanId] = useState<number | null>(null)
  const { data: lookups } = useStockInLookups()

  const orderTypes = lookups?.orderTypes?.length ? lookups.orderTypes : STOCK_IN_ORDER_TYPES
  const labelCls = 'block text-sm font-medium text-gray-700'
  const inputCls = 'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'

  const {
    data: rows,
    isLoading,
    isError,
    refetch,
  } = useStockInInvoiceList(appliedFilters, hasSearched)

  function applyFilters() {
    const filters: StockInInvoiceFilters = {}
    if (supplierId) filters.supplierId = supplierId
    if (customerId) filters.customerId = customerId
    if (jobTypeId) filters.jobTypeId = jobTypeId
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate
    setAppliedFilters(filters)
    setHasSearched(true)
  }

  function resetFilters() {
    setSupplierId(null)
    setCustomerId(null)
    setJobTypeId(null)
    setStartDate('')
    setEndDate('')
    setAppliedFilters({})
    setHasSearched(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock-In Invoice List</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse stock-in invoices and view challan details.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div>
            <label className={labelCls}>Supplier</label>
            <PaginatedCombobox
              type="supplier"
              value={supplierId}
              onValueChange={(id) => setSupplierId(id)}
              placeholder="All suppliers"
              className="mt-1"
            />
          </div>
          <div>
            <label className={labelCls}>Customer</label>
            <PaginatedCombobox
              type="customer"
              value={customerId}
              onValueChange={(id) => setCustomerId(id)}
              placeholder="All customers"
              className="mt-1"
            />
          </div>
          <div>
            <label className={labelCls}>Job Type</label>
            <select
              value={jobTypeId ?? ''}
              onChange={(e) => setJobTypeId(Number(e.target.value) || null)}
              className={inputCls}
            >
              <option value="">All job types</option>
              {orderTypes.map((orderType) => (
                <option key={orderType.id} value={orderType.id}>
                  {orderType.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={applyFilters}
              className="action-report inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              <Search className="h-4 w-4" /> Search
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="action-report inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="flex h-40 flex-col items-center justify-center gap-3 text-red-600">
            <AlertCircle className="h-6 w-6" />
            <p className="text-sm font-medium">Failed to load invoices.</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        ) : !hasSearched ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-500">
            Choose any filter combination above, or click Search to load all invoices.
          </div>
        ) : !rows?.length ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-500">
            No invoices found. Adjust filters and search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">SI No.</th>
                  <th className="px-4 py-3">Invoice No.</th>
                  <th className="px-4 py-3">Invoice Date</th>
                  <th className="px-4 py-3">Partner</th>
                  <th className="px-4 py-3">Order Type</th>
                  <th className="px-4 py-3 text-right">Final Amount</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.siSystemId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.siSystemNo}</td>
                    <td className="px-4 py-3 text-gray-600">{row.siInvoiceNo ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.siInvoiceDate?.slice(0, 10) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.supplierName ?? row.customerName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.jobTypeName ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {row.sibFinalAmount != null
                        ? row.sibFinalAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setChallanId(row.siSystemId)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        <Eye className="h-3.5 w-3.5" /> Challan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {challanId != null && (
        <ChallanModal
          stockInId={challanId}
          onClose={() => setChallanId(null)}
        />
      )}
    </div>
  )
}
