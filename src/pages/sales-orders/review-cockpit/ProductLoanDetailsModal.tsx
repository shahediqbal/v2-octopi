import { useMemo, useState } from 'react'
import { Download, Loader2, Search, X } from 'lucide-react'
import { useProductLoanDetails } from '@/hooks/useReviewCockpit'
import { formatQuantity, toNumber, balanceColorClass, toDateLabel } from '@/pages/sales-orders/review-cockpit/format'
import { exportExcel } from '@/utils/exportExcel'
import type { CustomerLoanSummaryRow } from '@/types/reviewCockpit'

interface ProductLoanDetailsModalProps {
  customerId: number | null
  summaryData: CustomerLoanSummaryRow[]
  totals: { issued: number; received: number; balance: number }
  onClose: () => void
}

export function ProductLoanDetailsModal({
  customerId,
  summaryData,
  totals,
  onClose,
}: ProductLoanDetailsModalProps) {
  const [tab, setTab] = useState<'summary' | 'details'>('summary')
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const { data: detailRows, isLoading: detailLoading } = useProductLoanDetails(
    customerId,
    tab === 'details' ? (selectedProductId ?? (summaryData[0]?.productId ?? null)) : null,
  )

  const filteredDetails = useMemo(() => {
    const rows = detailRows ?? []
    if (!search.trim()) return rows
    const lower = search.toLowerCase()
    return rows.filter(
      (r) =>
        (r.productName ?? '').toLowerCase().includes(lower) ||
        (r.manualInvoice ?? '').toLowerCase().includes(lower) ||
        (r.invoiceDate ?? '').toLowerCase().includes(lower),
    )
  }, [detailRows, search])

  const detailTotals = useMemo(() => {
    let received = 0, given = 0
    for (const r of filteredDetails) {
      received += toNumber(r.loanReceiveQty)
      given += toNumber(r.loanGivenQty)
    }
    return { received, given, balance: given - received }
  }, [filteredDetails])

  function handleExportSummary() {
    exportExcel({
      fileName: `ProductLoan_Summary_${new Date().toISOString().slice(0, 10)}`,
      title: 'Product Loan Summary',
      columns: [
        { key: 'serial_no', header: 'S/N', format: 'integer' },
        { key: 'productName', header: 'Product Name' },
        { key: 'received', header: 'Received', format: 'number' },
        { key: 'given', header: 'Given', format: 'number' },
        { key: 'balance', header: 'Balance', format: 'number' },
      ],
      data: summaryData.map((r, idx) => ({
        serial_no: idx + 1,
        productName: r.productName ?? '',
        received: toNumber(r.loanReceivedQty ?? r.returnQty),
        given: toNumber(r.loanGivenQty ?? r.loanQty),
        balance: toNumber(r.balanceQty ?? r.currentLoanQty),
      })),
    })
  }

  function handleExportDetails() {
    exportExcel({
      fileName: `ProductLoan_Details_${new Date().toISOString().slice(0, 10)}`,
      title: 'Product Loan Details',
      columns: [
        { key: 'serial_no', header: 'S/N', format: 'integer' },
        { key: 'manualInvoice', header: 'Invoice No' },
        { key: 'invoiceDate', header: 'Date' },
        { key: 'productName', header: 'Product' },
        { key: 'loanReceiveQty', header: 'Received', format: 'number' },
        { key: 'loanGivenQty', header: 'Given', format: 'number' },
      ],
      data: filteredDetails.map((r, idx) => ({
        serial_no: idx + 1,
        manualInvoice: r.manualInvoice ?? '',
        invoiceDate: toDateLabel(r.invoiceDate),
        productName: r.productName ?? '',
        loanReceiveQty: toNumber(r.loanReceiveQty),
        loanGivenQty: toNumber(r.loanGivenQty),
      })),
    })
  }

  const tabCls = (active: boolean) =>
    active
      ? 'border-b-2 border-gray-800 pb-2 text-sm font-semibold text-gray-900'
      : 'pb-2 text-sm font-medium text-gray-500 hover:text-gray-700'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Product Loan Details</h2>
            <p className="mt-1 text-sm text-gray-500">Full loan information</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-100 px-6 pt-3">
          <button type="button" className={tabCls(tab === 'summary')} onClick={() => setTab('summary')}>Summary</button>
          <button type="button" className={tabCls(tab === 'details')} onClick={() => setTab('details')}>Details</button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
          {tab === 'summary' && (
            <>
              {/* Metric cards */}
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-gray-100 p-3 text-center">
                  <div className="text-xs text-gray-500">Total Issued</div>
                  <div className="mt-1 text-sm font-bold text-gray-900">{formatQuantity(totals.issued)}</div>
                </div>
                <div className="rounded-lg bg-gray-100 p-3 text-center">
                  <div className="text-xs text-gray-500">Total Received</div>
                  <div className="mt-1 text-sm font-bold text-gray-900">{formatQuantity(totals.received)}</div>
                </div>
                <div className="rounded-lg bg-gray-100 p-3 text-center">
                  <div className="text-xs text-gray-500">Total Balance</div>
                  <div className={`mt-1 text-sm font-bold ${balanceColorClass(totals.balance)}`}>{formatQuantity(totals.balance)}</div>
                </div>
              </div>

              {/* Summary table */}
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 text-left text-gray-600">
                    <tr>
                      <th className="px-3 py-2" style={{ width: '50%' }}>Product</th>
                      <th className="px-3 py-2 text-right">Received</th>
                      <th className="px-3 py-2 text-right">Given</th>
                      <th className="px-3 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summaryData.map((row, idx) => {
                      const bal = toNumber(row.balanceQty ?? row.currentLoanQty)
                      return (
                        <tr key={`${row.productId ?? idx}`} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-800">{row.productName ?? '—'}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatQuantity(row.loanReceivedQty ?? row.returnQty)}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatQuantity(row.loanGivenQty ?? row.loanQty)}</td>
                          <td className={`px-3 py-2 text-right font-medium ${balanceColorClass(bal)}`}>{formatQuantity(bal)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex justify-end">
                <button type="button" onClick={handleExportSummary} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  <Download size={14} /> Export Summary
                </button>
              </div>
            </>
          )}

          {tab === 'details' && (
            <>
              {/* Filters */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search invoice, product, date…"
                    className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                <select
                  value={selectedProductId ?? ''}
                  onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : null)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <option value="">All Products</option>
                  {summaryData.map((r) => (
                    <option key={r.productId} value={r.productId ?? ''}>{r.productName}</option>
                  ))}
                </select>
                <button type="button" onClick={handleExportDetails} disabled={filteredDetails.length === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  <Download size={14} /> Excel
                </button>
              </div>

              {detailLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading…</span>
                </div>
              )}

              {!detailLoading && (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="max-h-[calc(92vh-380px)] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-100 text-left text-gray-600">
                        <tr>
                          <th className="px-3 py-2">Invoice No</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Product</th>
                          <th className="px-3 py-2 text-right">Received</th>
                          <th className="px-3 py-2 text-right">Given</th>
                          <th className="px-3 py-2 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredDetails.map((r, idx) => {
                          const bal = toNumber(r.loanGivenQty) - toNumber(r.loanReceiveQty)
                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-mono text-gray-800">{r.manualInvoice ?? '—'}</td>
                              <td className="px-3 py-2 text-gray-700">{toDateLabel(r.invoiceDate)}</td>
                              <td className="px-3 py-2 text-gray-800">{r.productName ?? '—'}</td>
                              <td className="px-3 py-2 text-right text-green-700">{formatQuantity(r.loanReceiveQty)}</td>
                              <td className="px-3 py-2 text-right text-blue-700">{formatQuantity(r.loanGivenQty)}</td>
                              <td className={`px-3 py-2 text-right font-medium ${balanceColorClass(bal)}`}>{formatQuantity(bal)}</td>
                            </tr>
                          )
                        })}
                        {filteredDetails.length === 0 && (
                          <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500">No detail records found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Detail totals footer */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Showing {filteredDetails.length} records</span>
                <div className="flex gap-4">
                  <span>Received: <span className="font-semibold text-green-700">{formatQuantity(detailTotals.received)}</span></span>
                  <span>Given: <span className="font-semibold text-blue-700">{formatQuantity(detailTotals.given)}</span></span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
