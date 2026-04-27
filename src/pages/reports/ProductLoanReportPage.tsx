import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, Database, FileSpreadsheet, Loader2, Package, RefreshCw, Search } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { useProductLoanDetails, useProductLoanSummary } from '@/hooks/useProductLoanReport'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { ProductLoanFilters } from '@/types/productLoanReport'

function fmtDate(value: string | null) {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtQty(value: number | null) {
  if (value == null) return '-'
  return value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const DETAIL_EXCEL_COLUMNS = [
  { key: 'manualInvoice', header: 'Invoice No' },
  { key: 'invoiceDate', header: 'Invoice Date', format: 'date' as const },
  { key: 'productName', header: 'Product Name' },
  { key: 'loanReceivedQty', header: 'Loan Received Qty', format: 'number' as const },
  { key: 'loanGivenQty', header: 'Loan Given Qty', format: 'number' as const },
] as const

const SUMMARY_EXCEL_COLUMNS = [
  { key: 'productName', header: 'Product Name' },
  { key: 'loanReceivedQty', header: 'Loan Received Qty', format: 'number' as const },
  { key: 'loanGivenQty', header: 'Loan Given Qty', format: 'number' as const },
  { key: 'balanceQty', header: 'Balance Qty', format: 'number' as const },
] as const

export function ProductLoanReportPage() {
  const [activeTab, setActiveTab] = useState<'details' | 'summary'>('details')
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [customerLabel, setCustomerLabel] = useState<string | null>(null)
  const [productId, setProductId] = useState<number | null>(null)
  const [productLabel, setProductLabel] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadRequested, setLoadRequested] = useState(false)

  const filters: ProductLoanFilters = useMemo(
    () => ({ customerId: customerId ?? 0, productId: productId ?? 0 }),
    [customerId, productId],
  )

  const {
    data: detailData = [],
    isLoading: detailLoading,
    isError: detailError,
    error: detailErr,
    refetch: refetchDetail,
  } = useProductLoanDetails(filters, loadRequested)

  const {
    data: summaryData = [],
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErr,
    refetch: refetchSummary,
  } = useProductLoanSummary(filters, loadRequested)

  const isLoading = detailLoading || summaryLoading
  const isError = activeTab === 'details' ? detailError : summaryError
  const errorMsg = ((activeTab === 'details' ? detailErr : summaryErr) as Error)?.message ?? 'Failed to load data'

  const activeData = activeTab === 'details' ? detailData : summaryData

  const filteredDetailData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return detailData
    return detailData.filter(
      (item) => item.manualInvoice?.toLowerCase().includes(q) || item.productName?.toLowerCase().includes(q),
    )
  }, [detailData, searchTerm])

  const filteredSummaryData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return summaryData
    return summaryData.filter((item) => item.productName?.toLowerCase().includes(q))
  }, [summaryData, searchTerm])

  const filteredData = activeTab === 'details' ? filteredDetailData : filteredSummaryData

  // Detail stats
  const detailTotalReceived = useMemo(() => detailData.reduce((s, i) => s + (i.loanReceivedQty ?? 0), 0), [detailData])
  const detailTotalGiven = useMemo(() => detailData.reduce((s, i) => s + (i.loanGivenQty ?? 0), 0), [detailData])
  // Summary stats
  const summaryTotalReceived = useMemo(() => summaryData.reduce((s, i) => s + (i.loanReceivedQty ?? 0), 0), [summaryData])
  const summaryTotalGiven = useMemo(() => summaryData.reduce((s, i) => s + (i.loanGivenQty ?? 0), 0), [summaryData])
  const summaryNetBalance = useMemo(() => summaryData.reduce((s, i) => s + (i.balanceQty ?? 0), 0), [summaryData])

  const handleLoad = useCallback(() => {
    setLoadRequested(true)
    void refetchDetail()
    void refetchSummary()
  }, [refetchDetail, refetchSummary])

  const handleExportDetail = useCallback(async () => {
    if (filteredDetailData.length === 0) return
    await exportExcelOnDemand({
      fileName: `Product_Loan_Details`,
      title: 'Product Loan Details',
      sheetName: 'Details',
      columns: [...DETAIL_EXCEL_COLUMNS],
      data: filteredDetailData as unknown as Record<string, unknown>[],
      filters: [
        ['Customer', customerLabel || 'All'],
        ['Product', productLabel || 'All'],
      ],
      summaryCards: [
        ['Total Records', detailData.length],
        ['Total Received Qty', fmtQty(detailTotalReceived)],
        ['Total Given Qty', fmtQty(detailTotalGiven)],
      ],
    })
  }, [filteredDetailData, customerLabel, productLabel, detailData.length, detailTotalReceived, detailTotalGiven])

  const handleExportSummary = useCallback(async () => {
    if (filteredSummaryData.length === 0) return
    await exportExcelOnDemand({
      fileName: `Product_Loan_Summary`,
      title: 'Product Loan Summary',
      sheetName: 'Summary',
      columns: [...SUMMARY_EXCEL_COLUMNS],
      data: filteredSummaryData as unknown as Record<string, unknown>[],
      filters: [
        ['Customer', customerLabel || 'All'],
        ['Product', productLabel || 'All'],
      ],
      summaryCards: [
        ['Total Products', summaryData.length],
        ['Total Received', fmtQty(summaryTotalReceived)],
        ['Total Given', fmtQty(summaryTotalGiven)],
        ['Net Balance', fmtQty(summaryNetBalance)],
      ],
    })
  }, [filteredSummaryData, customerLabel, productLabel, summaryData.length, summaryTotalReceived, summaryTotalGiven, summaryNetBalance])

  const noData = activeData.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Loan Details</h1>
        <p className="mt-1 text-sm text-gray-500">View product loan transactions and balances by customer.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* ── Filters ── */}
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 px-4 py-4">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Customer</label>
            <PaginatedCombobox
              type="customer"
              value={customerId}
              onValueChange={(v, label) => { setCustomerId(v); setCustomerLabel(label ?? null); setLoadRequested(false) }}
              placeholder="All Customers"
            />
          </div>
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Product</label>
            <PaginatedCombobox
              type="product"
              value={productId}
              onValueChange={(v, label) => { setProductId(v); setProductLabel(label ?? null); setLoadRequested(false) }}
              placeholder="All Products"
            />
          </div>
          <div className="min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Invoice, product…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {noData ? (
              <button
                onClick={handleLoad}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? 'Loading…' : 'Load Data'}
              </button>
            ) : (
              <>
                <button
                  onClick={activeTab === 'details' ? handleExportDetail : handleExportSummary}
                  disabled={filteredData.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileSpreadsheet size={14} />
                  Excel
                </button>
                <button
                  onClick={handleLoad}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="h-1 w-full overflow-hidden bg-gray-100">
            <div className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] rounded bg-gray-400" />
          </div>
        )}
        {isError && (
          <div className="mx-4 my-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}

        {!isLoading && !isError && noData && !loadRequested && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Package size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Loaded</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Select a customer and/or product and click Load Data.
            </p>
          </div>
        )}

        {!isLoading && loadRequested && noData && !isError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Database size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Found</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">No loan records found for the selected filters.</p>
          </div>
        )}

        {/* ── Tabs ── */}
        {(detailData.length > 0 || summaryData.length > 0) && (
          <>
            <div className="flex border-b border-gray-200 px-4">
              {(['details', 'summary'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`mr-4 border-b-2 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-gray-800 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'details' ? `Details (${detailData.length})` : `Summary (${summaryData.length})`}
                </button>
              ))}
            </div>

            {/* Summary stats */}
            {activeTab === 'details' && detailData.length > 0 && (
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <StatCard label="Total Records" value={String(detailData.length)} />
                  <StatCard label="Total Received Qty" value={fmtQty(detailTotalReceived)} />
                  <StatCard label="Total Given Qty" value={fmtQty(detailTotalGiven)} />
                </div>
              </div>
            )}
            {activeTab === 'summary' && summaryData.length > 0 && (
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard label="Total Products" value={String(summaryData.length)} />
                  <StatCard label="Total Received" value={fmtQty(summaryTotalReceived)} />
                  <StatCard label="Total Given" value={fmtQty(summaryTotalGiven)} />
                  <StatCard label="Net Balance" value={fmtQty(summaryNetBalance)} accent />
                </div>
              </div>
            )}

            {/* Tables */}
            {activeTab === 'details' && (
              <div className="max-h-[calc(100vh-420px)] overflow-x-auto overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Invoice No</th>
                      <th className="px-4 py-3 font-semibold">Invoice Date</th>
                      <th className="px-4 py-3 font-semibold">Product Name</th>
                      <th className="px-4 py-3 font-semibold text-right">Loan Received Qty</th>
                      <th className="px-4 py-3 font-semibold text-right">Loan Given Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDetailData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                          No records match your search
                        </td>
                      </tr>
                    ) : (
                      filteredDetailData.map((item, idx) => (
                        <tr key={`${item.manualInvoice ?? 'pl'}-${idx}`} className="transition-colors hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-900">{item.manualInvoice || '-'}</td>
                          <td className="px-4 py-2.5 text-gray-600">{fmtDate(item.invoiceDate)}</td>
                          <td className="px-4 py-2.5 text-gray-700">{item.productName || '-'}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtQty(item.loanReceivedQty)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtQty(item.loanGivenQty)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="max-h-[calc(100vh-420px)] overflow-x-auto overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Product Name</th>
                      <th className="px-4 py-3 font-semibold text-right">Loan Received Qty</th>
                      <th className="px-4 py-3 font-semibold text-right">Loan Given Qty</th>
                      <th className="px-4 py-3 font-semibold text-right">Balance Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSummaryData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                          No records match your search
                        </td>
                      </tr>
                    ) : (
                      filteredSummaryData.map((item, idx) => (
                        <tr key={`${item.productName ?? 'pls'}-${idx}`} className="transition-colors hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-900">{item.productName || '-'}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtQty(item.loanReceivedQty)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtQty(item.loanGivenQty)}</td>
                          <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${(item.balanceQty ?? 0) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                            {fmtQty(item.balanceQty)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {filteredData.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
                <p className="text-xs text-gray-500">
                  Showing {filteredData.length} of {activeData.length} records
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-gray-800' : 'text-gray-700'}`}>{value}</p>
    </div>
  )
}
