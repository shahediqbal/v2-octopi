import { useMemo, useState } from 'react'
import { Download, Loader2, Search, X } from 'lucide-react'
import { getLastNDaysRange, useCreditHistory } from '@/hooks/useReviewCockpit'
import { toCurrency, toDateLabel, toNumber } from '@/pages/sales-orders/review-cockpit/format'
import { exportExcel } from '@/utils/exportExcel'

interface CreditDetailsModalProps {
  customerId: number | null
  customerName?: string
  onClose: () => void
}

export function CreditDetailsModal({ customerId, customerName, onClose }: CreditDetailsModalProps) {
  const range = getLastNDaysRange(180)
  const { data, isLoading, isError, error } = useCreditHistory(customerId, range.startDate, range.endDate)
  const [search, setSearch] = useState('')

  const transactions = data?.transctionInfo ?? []
  const customerInfo = data?.customerInfo ?? null

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions
    const lower = search.toLowerCase()
    return transactions.filter(
      (t) =>
        (t.job_type ?? '').toLowerCase().includes(lower) ||
        (t.transaction_number ?? '').toLowerCase().includes(lower) ||
        (t.date ?? '').toLowerCase().includes(lower),
    )
  }, [transactions, search])

  const summary = useMemo(() => {
    const opening = toNumber(transactions[0]?.linq_calculated_due_amount)
    let sales = 0, payment = 0, adjustment = 0
    for (const t of transactions) {
      sales += toNumber(t.payable_amount)
      payment += toNumber(t.paid_amount)
      adjustment += toNumber(t.returned_amount)
    }
    const closing = opening + sales - payment - adjustment
    return { opening, sales, payment, adjustment, closing }
  }, [transactions])

  const filteredTotals = useMemo(() => {
    let sales = 0, payment = 0, adjustment = 0
    for (const t of filtered) {
      sales += toNumber(t.payable_amount)
      payment += toNumber(t.paid_amount)
      adjustment += toNumber(t.returned_amount)
    }
    return { sales, payment, adjustment }
  }, [filtered])

  function handleExport() {
    exportExcel({
      fileName: `Credit_Details_${customerName ?? customerInfo?.customerName ?? customerId}_${new Date().toISOString().slice(0, 10)}`,
      title: 'Credit Transaction Details',
      subtitle: `${range.startDate} to ${range.endDate} — ${customerName ?? customerInfo?.customerName ?? ''}`,
      columns: [
        { key: 'serial_no', header: 'S/N', format: 'integer' },
        { key: 'date', header: 'Date' },
        { key: 'job_type', header: 'Type' },
        { key: 'transaction_number', header: 'Transaction #' },
        { key: 'payable_amount', header: 'Sales Value', format: 'number' },
        { key: 'paid_amount', header: 'Payment', format: 'number' },
        { key: 'returned_amount', header: 'Adjustment', format: 'number' },
        { key: 'linq_calculated_due_amount', header: 'Balance', format: 'number' },
      ],
      data: filtered.map((t, idx) => ({
        serial_no: idx + 1,
        date: toDateLabel(t.date),
        job_type: t.job_type ?? '',
        transaction_number: t.transaction_number ?? '',
        payable_amount: toNumber(t.payable_amount),
        paid_amount: toNumber(t.paid_amount),
        returned_amount: toNumber(t.returned_amount),
        linq_calculated_due_amount: toNumber(t.linq_calculated_due_amount),
      })),
      summaryCards: [
        ['Opening', toCurrency(summary.opening)],
        ['Sales', toCurrency(summary.sales)],
        ['Payment', toCurrency(summary.payment)],
        ['Adjustment', toCurrency(summary.adjustment)],
        ['Closing', toCurrency(summary.closing)],
      ],
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Credit Transaction Details</h2>
            <p className="mt-1 text-sm text-gray-500">
              {range.startDate} → {range.endDate}
              {(customerName || customerInfo?.customerName) && (
                <span className="ml-2 font-medium text-gray-700">
                  — {customerName || customerInfo?.customerName}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
              <span className="ml-3 text-sm text-gray-500">Loading transactions…</span>
            </div>
          )}

          {isError && (
            <p className="text-sm text-red-600">{(error as Error)?.message}</p>
          )}

          {!isLoading && !isError && (
            <>
              {/* Customer Info */}
              {customerInfo && (
                <div className="mb-4 rounded-lg bg-gray-100 p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-500">ID:</span> <span className="font-medium text-gray-900">{customerInfo.customerId}</span></div>
                    <div><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{customerInfo.customerName}</span></div>
                    <div><span className="text-gray-500">Address:</span> <span className="font-medium text-gray-900">{customerInfo.customerAddress}</span></div>
                  </div>
                </div>
              )}

              {/* Summary Bar */}
              <div className="mb-4 grid grid-cols-5 gap-3">
                <SummaryCard label="Opening" value={toCurrency(summary.opening)} />
                <SummaryCard label="Total Sales" value={toCurrency(summary.sales)} />
                <SummaryCard label="Total Payment" value={toCurrency(summary.payment)} />
                <SummaryCard label="Adjustment" value={toCurrency(summary.adjustment)} />
                <SummaryCard label="Closing" value={toCurrency(summary.closing)} />
              </div>

              {/* Search & Export */}
              <div className="mb-4 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by type, transaction #, date…"
                    className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={filtered.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <Download size={14} /> Excel
                </button>
              </div>

              {/* Transaction Table */}
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="max-h-[calc(92vh-420px)] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-100 text-left text-gray-600">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Transaction #</th>
                        <th className="px-3 py-2 text-right">Sales</th>
                        <th className="px-3 py-2 text-right">Payment</th>
                        <th className="px-3 py-2 text-right">Adjustment</th>
                        <th className="px-3 py-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map((t, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-700">{toDateLabel(t.date)}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                              {t.job_type ?? '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-800">{t.transaction_number ?? '—'}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{toCurrency(t.payable_amount)}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{toCurrency(t.paid_amount)}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{toCurrency(t.returned_amount)}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900">{toCurrency(t.linq_calculated_due_amount)}</td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">No transactions found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Showing {filtered.length} of {transactions.length} transactions</span>
                <div className="flex gap-4">
                  <span>Sales: <span className="font-semibold text-gray-800">{toCurrency(filteredTotals.sales)}</span></span>
                  <span>Payment: <span className="font-semibold text-gray-800">{toCurrency(filteredTotals.payment)}</span></span>
                  <span>Adjustment: <span className="font-semibold text-gray-800">{toCurrency(filteredTotals.adjustment)}</span></span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-100 p-3 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-gray-900">{value}</div>
    </div>
  )
}
