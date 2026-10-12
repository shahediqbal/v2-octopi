import { useMemo, useState } from 'react'
import { Download, Loader2, Search, X } from 'lucide-react'
import { getTaxYearRange, useTaxAitDetails, usePaymentSummary } from '@/hooks/useReviewCockpit'
import { toCurrency, toDateLabel, toNumber, dueStatusLabel } from '@/pages/sales-orders/review-cockpit/format'
import { exportExcel } from '@/utils/exportExcel'

interface TaxAitDetailsModalProps {
  customerId: number | null
  onClose: () => void
}

function buildTaxYearOptions() {
  const currentYear = new Date().getFullYear()
  const options: { label: string; startDate: string; endDate: string }[] = []
  for (let y = currentYear; y >= currentYear - 4; y--) {
    options.push({
      label: `${y - 1}-${y}`,
      startDate: `${y - 1}-07-01`,
      endDate: `${y}-06-30`,
    })
  }
  return options
}

export function TaxAitDetailsModal({ customerId, onClose }: TaxAitDetailsModalProps) {
  const taxYearOptions = useMemo(buildTaxYearOptions, [])
  const defaultRange = getTaxYearRange()
  const [selectedYear, setSelectedYear] = useState(taxYearOptions.find(o => o.startDate === defaultRange.startDate)?.label ?? taxYearOptions[0].label)
  const [tab, setTab] = useState<'summary' | 'transactions'>('transactions')
  const [search, setSearch] = useState('')

  const range = taxYearOptions.find(o => o.label === selectedYear) ?? taxYearOptions[0]
  const { data: taxRows, isLoading } = useTaxAitDetails(customerId, range.startDate, range.endDate)
  const { data: paymentRows } = usePaymentSummary(customerId)
  const payment = paymentRows?.[0]

  const filtered = useMemo(() => {
    const rows = taxRows ?? []
    if (!search.trim()) return rows
    const lower = search.toLowerCase()
    return rows.filter(r =>
      (r.challanNo ?? r.systemNo ?? '').toString().toLowerCase().includes(lower) ||
      (r.customerName ?? '').toLowerCase().includes(lower) ||
      (r.monthName ?? '').toLowerCase().includes(lower),
    )
  }, [taxRows, search])

  const metrics = useMemo(() => {
    const rows = taxRows ?? []
    let taxableBase = 0, totalVat = 0, totalAit = 0
    for (const r of rows) {
      taxableBase += toNumber(r.taxableBase)
      totalVat += toNumber(r.vatAmount)
      totalAit += toNumber(r.aitAmount ?? r.taxAmount)
    }
    const vatPaid = toNumber(payment?.totalVatPaid)
    const aitPaid = toNumber(payment?.totalAitPaid)
    return { invoices: rows.length, taxableBase, totalVat, totalAit, vatPaid, aitPaid, vatBalance: totalVat - vatPaid, aitBalance: totalAit - aitPaid }
  }, [taxRows, payment])

  const vatStatus = dueStatusLabel(metrics.vatBalance)
  const aitStatus = dueStatusLabel(metrics.aitBalance)

  function handleExport() {
    exportExcel({
      fileName: `TaxAIT_${selectedYear}_${new Date().toISOString().slice(0, 10)}`,
      title: `Tax & AIT Report — ${selectedYear}`,
      columns: [
        { key: 'serial_no', header: 'S/N', format: 'integer' },
        { key: 'invoiceNo', header: 'Invoice No' },
        { key: 'invoiceDate', header: 'Date' },
        { key: 'customerName', header: 'Customer' },
        { key: 'monthName', header: 'Month' },
        { key: 'taxableBase', header: 'Taxable Base', format: 'number' },
        { key: 'vatPercent', header: 'VAT %', format: 'number' },
        { key: 'aitPercent', header: 'AIT %', format: 'number' },
        { key: 'vatAmount', header: 'VAT Amount', format: 'number' },
        { key: 'aitAmount', header: 'AIT Amount', format: 'number' },
      ],
      data: filtered.map((r, idx) => ({
        serial_no: idx + 1,
        invoiceNo: r.challanNo ?? r.systemNo ?? '',
        invoiceDate: toDateLabel(r.challanDate ?? r.invoiceDate),
        customerName: r.customerName ?? '',
        monthName: r.monthName ?? '',
        taxableBase: toNumber(r.taxableBase),
        vatPercent: toNumber(r.vatPercent),
        aitPercent: toNumber(r.aitPercent),
        vatAmount: toNumber(r.vatAmount),
        aitAmount: toNumber(r.aitAmount ?? r.taxAmount),
      })),
      summaryCards: [
        ['Invoices', String(metrics.invoices)],
        ['Total VAT', toCurrency(metrics.totalVat)],
        ['Total AIT', toCurrency(metrics.totalAit)],
        ['VAT Paid', toCurrency(metrics.vatPaid)],
        ['AIT Paid', toCurrency(metrics.aitPaid)],
      ],
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
            <h2 className="text-lg font-semibold text-gray-900">Tax & AIT Details</h2>
            <p className="mt-1 text-sm text-gray-500">Tax year: {selectedYear}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {/* Tabs + Tax Year Selector */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 pt-3">
          <div className="flex gap-6">
            <button type="button" className={tabCls(tab === 'summary')} onClick={() => setTab('summary')}>Summary</button>
            <button type="button" className={tabCls(tab === 'transactions')} onClick={() => setTab('transactions')}>Transactions</button>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="mb-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
          >
            {taxYearOptions.map(o => (
              <option key={o.label} value={o.label}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
              <span className="ml-3 text-sm text-gray-500">Loading…</span>
            </div>
          )}

          {!isLoading && tab === 'summary' && (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
              <SummaryCard label="Invoices" value={String(metrics.invoices)} />
              <SummaryCard label="Taxable Base" value={toCurrency(metrics.taxableBase)} />
              <SummaryCard label="Total VAT" value={toCurrency(metrics.totalVat)} />
              <SummaryCard label="Total AIT" value={toCurrency(metrics.totalAit)} />
              <SummaryCard label="VAT Paid" value={toCurrency(metrics.vatPaid)} />
              <SummaryCard label="AIT Paid" value={toCurrency(metrics.aitPaid)} />
              <SummaryCard label="VAT Balance" value={toCurrency(metrics.vatBalance)} extra={<span className={`text-[10px] font-semibold ${vatStatus.cls}`}>{vatStatus.text}</span>} />
              <SummaryCard label="AIT Balance" value={toCurrency(metrics.aitBalance)} extra={<span className={`text-[10px] font-semibold ${aitStatus.cls}`}>{aitStatus.text}</span>} />
            </div>
          )}

          {!isLoading && tab === 'transactions' && (
            <>
              {/* Search & Export */}
              <div className="mb-4 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search invoice, customer, month…"
                    className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                <button type="button" onClick={handleExport} disabled={filtered.length === 0} className="action-report inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  <Download size={14} /> Excel
                </button>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="max-h-[calc(92vh-380px)] overflow-x-auto overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-100 text-left text-gray-600">
                      <tr>
                        <th className="whitespace-nowrap px-3 py-2">Invoice #</th>
                        <th className="whitespace-nowrap px-3 py-2">Date</th>
                        <th className="whitespace-nowrap px-3 py-2">Customer</th>
                        <th className="whitespace-nowrap px-3 py-2">Month</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right">Taxable Base</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right">VAT %</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right">AIT %</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right">VAT Amt</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right">AIT Amt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-3 py-2 font-mono text-gray-800">{row.challanNo ?? row.systemNo ?? '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{toDateLabel(row.challanDate ?? row.invoiceDate)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{row.customerName ?? '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{row.monthName ?? '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right text-gray-700">{toCurrency(row.taxableBase)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right text-gray-600">{row.vatPercent != null ? `${row.vatPercent}%` : '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right text-gray-600">{row.aitPercent != null ? `${row.aitPercent}%` : '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right text-gray-700">{toCurrency(row.vatAmount)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right text-gray-700">{toCurrency(row.aitAmount ?? row.taxAmount)}</td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-500">No transactions found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Showing {filtered.length} of {(taxRows ?? []).length} transactions
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

function SummaryCard({ label, value, extra }: { label: string; value: string; extra?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-gray-100 p-3 text-center">
      <div className="text-[10px] leading-tight text-gray-500">{label}</div>
      <div className="mt-0.5 text-xs font-bold text-gray-900">{value}</div>
      {extra}
    </div>
  )
}
