import { useMemo, useState } from 'react'
import { AlertCircle, Loader2, Pencil, Plus, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PaginatedCombobox } from '@/components/dropdowns'
import { usePaymentList } from '@/hooks/usePayments'
import type { PaymentListFilters } from '@/types/payment'

function todayStr() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

function daysAgoStr(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

function fmtDate(value: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtAmount(value: number | null | undefined) {
  if (value == null) return '—'
  return value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'

export function PaymentListPage() {
  const navigate = useNavigate()

  // Filter state
  const [startDate, setStartDate] = useState(daysAgoStr(3))
  const [endDate, setEndDate] = useState(todayStr)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadRequested, setLoadRequested] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const filters: PaymentListFilters = useMemo(
    () => ({ startDate, endDate, customerId: customerId ?? 0 }),
    [startDate, endDate, customerId],
  )

  const { data: payments = [], isLoading, isError, error, refetch } = usePaymentList(filters, loadRequested)

  const filteredPayments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return payments
    return payments.filter(
      (p) =>
        p.customerName?.toLowerCase().includes(q) ||
        p.moenyRecepitNo?.toLowerCase().includes(q) ||
        p.paymentMethodName?.toLowerCase().includes(q) ||
        p.customerAddress?.toLowerCase().includes(q),
    )
  }, [payments, searchTerm])

  const dateError = useMemo(() => {
    if (!startDate || !endDate) return 'Both dates are required'
    if (new Date(startDate) > new Date(endDate)) return "'From' date cannot be after 'To' date"
    return ''
  }, [startDate, endDate])

  const handleSearch = () => {
    if (dateError) return
    setLoadRequested(true)
    void refetch()
  }

  const handleRowClick = (id: number) => {
    setSelectedId(id)
    navigate(`/payments/${id}/edit`)
  }

  const handleEditClick = () => {
    if (selectedId) navigate(`/payments/${selectedId}/edit`)
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Payments</h1>
          <p className="mt-1 text-sm text-gray-500">
            {loadRequested && !isLoading
              ? `${filteredPayments.length} record${filteredPayments.length !== 1 ? 's' : ''}${payments.length !== filteredPayments.length ? ` of ${payments.length}` : ''}`
              : 'Search payments by date range and customer'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedId && (
            <button
              type="button"
              onClick={handleEditClick}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Pencil size={15} /> Edit
            </button>
          )}
          <Link
            to="/payments/add"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            <Plus size={16} /> Add Payment
          </Link>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-3 px-4 py-4">
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setLoadRequested(false) }}
              className={inputCls}
            />
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setLoadRequested(false) }}
              className={inputCls}
            />
          </div>
          <div className="min-w-[220px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Customer</label>
            <PaginatedCombobox
              type="customer"
              value={customerId}
              onValueChange={(v) => { setCustomerId(v); setLoadRequested(false) }}
              placeholder="All customers"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={!!dateError || isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Search
          </button>
        </div>
        {dateError && (
          <p className="px-4 pb-3 text-xs text-red-600">{dateError}</p>
        )}
      </div>

      {/* ── Table ── */}
      {loadRequested && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* inline search */}
          {payments.length > 0 && (
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="relative max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search results…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm focus:border-gray-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 size={24} className="animate-spin" />
              <span className="ml-2 text-sm">Loading payments…</span>
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-red-600">
              <AlertCircle size={16} />
              {error instanceof Error ? error.message : 'Failed to load payments.'}
            </div>
          )}

          {!isLoading && !isError && filteredPayments.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-gray-500">No payments found.</p>
          )}

          {!isLoading && !isError && filteredPayments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Payment Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Receipt No</th>
                    <th className="px-4 py-3 text-left font-semibold">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold">Address</th>
                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    <th className="px-4 py-3 text-right font-semibold">Adjustment</th>
                    <th className="px-4 py-3 text-left font-semibold">Payment Method</th>
                    <th className="px-4 py-3 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.paymentSystemId}
                      onClick={() => handleRowClick(payment.paymentSystemId)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${selectedId === payment.paymentSystemId ? 'bg-gray-100' : ''}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{payment.paymentSystemId}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{fmtDate(payment.paymentDate)}</td>
                      <td className="px-4 py-3 text-gray-700">{payment.moenyRecepitNo || '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{payment.customerName || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{payment.customerAddress || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {fmtAmount(payment.paymentAmount ?? payment.chequeAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{fmtAmount(payment.paymentAdjustedAmount)}</td>
                      <td className="px-4 py-3 text-gray-700">{payment.paymentMethodName || '—'}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/payments/${payment.paymentSystemId}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          <Pencil size={11} /> Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
