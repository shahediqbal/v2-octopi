import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, BookOpen, Database, FileSpreadsheet, Loader2, RefreshCw, Search } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { useLoanReportDetails, useLoanReportSummary } from '@/hooks/useLoanReport'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { LoanReportFilters } from '@/types/loanReport'

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

export function LoanReportPage() {
  const [activeTab, setActiveTab] = useState<'details' | 'summary'>('details')
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [customerLabel, setCustomerLabel] = useState<string | null>(null)
  const [productId, setProductId] = useState<number | null>(null)
  const [productLabel, setProductLabel] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadRequested, setLoadRequested] = useState(false)

  const filters: LoanReportFilters = useMemo(
    () => ({ customerId: customerId ?? 0, productId: productId ?? 0 }),
    [customerId, productId],
  )

  const {
    data: detailData = [],
    isLoading: detailLoading,
    isError: detailError,
    error: detailErr,
    refetch: refetchDetail,
  } = useLoanReportDetails(filters, loadRequested)

  const {
    data: summaryData = [],
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErr,
    refetch: refetchSummary,
  } = useLoanReportSummary(filters, loadRequested)

  const isLoading = detailLoading || summaryLoading
  const isError = activeTab === 'details' ? detailError : summaryError
  const errorMsg = ((activeTab === 'details' ? detailErr : summaryErr) as Error)?.message ?? 'Failed to load data'
  const noData = detailData.length === 0 && summaryData.length === 0
  const activeData = activeTab === 'details' ? detailData : summaryData

  // Dynamic columns: hide customer cols when specific customer selected
  const customerSelected = customerId != null

  const filteredDetailData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return detailData
    return detailData.filter(
      (item) =>
        item.invoiceNo?.toLowerCase().includes(q) ||
        item.customerName?.toLowerCase().includes(q) ||
        item.productName?.toLowerCase().includes(q),
    )
  }, [detailData, searchTerm])

  const filteredSummaryData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return summaryData
    return summaryData.filter(
      (item) => item.customerName?.toLowerCase().includes(q) || item.productName?.toLowerCase().includes(q),
    )
  }, [summaryData, searchTerm])

  const filteredData = activeTab === 'details' ? filteredDetailData : filteredSummaryData

  // Detail stats
  const uniqueDetailCustomers = useMemo(() => new Set(detailData.map((i) => i.customerId)).size, [detailData])
  const detailTotalGiven = useMemo(() => detailData.reduce((s, i) => s + (i.loanGivenQuantity ?? 0), 0), [detailData])
  const detailTotalReceived = useMemo(() => detailData.reduce((s, i) => s + (i.loanReceiveQuantity ?? 0), 0), [detailData])
  // Summary stats
  const summaryTotalGiven = useMemo(() => summaryData.reduce((s, i) => s + (i.loanGivenQuantity ?? 0), 0), [summaryData])
  const summaryTotalReceived = useMemo(() => summaryData.reduce((s, i) => s + (i.loanReceiveQuantity ?? 0), 0), [summaryData])
  const summaryNetBalance = useMemo(() => summaryData.reduce((s, i) => s + (i.balanceQuantity ?? 0), 0), [summaryData])

  const handleLoad = useCallback(() => {
    setLoadRequested(true)
    void refetchDetail()
    void refetchSummary()
  }, [refetchDetail, refetchSummary])

  const buildDetailColumns = useCallback(() => {
    const base = [
      { key: 'invoiceNo', header: 'Invoice No' },
      { key: 'invoiceDate', header: 'Invoice Date', format: 'date' as const },
      { key: 'productName', header: 'Product Name' },
      { key: 'loanGivenQuantity', header: 'Loan Given', format: 'number' as const },
      { key: 'loanReceiveQuantity', header: 'Loan Received', format: 'number' as const },
    ]
    if (!customerSelected) {
      return [
        { key: 'customerId', header: 'Customer ID', format: 'integer' as const },
        { key: 'customerName', header: 'Customer Name' },
        { key: 'customerAddress', header: 'Address', width: 28 },
        ...base,
      ]
    }
    return base
  }, [customerSelected])

  const buildSummaryColumns = useCallback(() => {
    const base = [
      { key: 'productName', header: 'Product Name' },
      { key: 'loanGivenQuantity', header: 'Loan Given', format: 'number' as const },
      { key: 'loanReceiveQuantity', header: 'Loan Received', format: 'number' as const },
      { key: 'balanceQuantity', header: 'Balance', format: 'number' as const },
    ]
    if (!customerSelected) {
      return [
        { key: 'customerId', header: 'Customer ID', format: 'integer' as const },
        { key: 'customerName', header: 'Customer Name' },
        { key: 'customerAddress', header: 'Address', width: 28 },
        ...base,
      ]
    }
    return base
  }, [customerSelected])

  const handleExportDetail = useCallback(async () => {
    if (filteredDetailData.length === 0) return
    await exportExcelOnDemand({
      fileName: `Loan_Report_Details`,
      title: 'Loan Report – Details',
      sheetName: 'Details',
      columns: buildDetailColumns(),
      data: filteredDetailData as unknown as Record<string, unknown>[],
      filters: [['Customer', customerLabel || 'All'], ['Product', productLabel || 'All']],
      summaryCards: [
        ['Total Records', detailData.length],
        ['Unique Customers', uniqueDetailCustomers],
        ['Total Given', fmtQty(detailTotalGiven)],
        ['Total Received', fmtQty(detailTotalReceived)],
      ],
    })
  }, [filteredDetailData, buildDetailColumns, customerLabel, productLabel, detailData.length, uniqueDetailCustomers, detailTotalGiven, detailTotalReceived])

  const handleExportSummary = useCallback(async () => {
    if (filteredSummaryData.length === 0) return
    await exportExcelOnDemand({
      fileName: `Loan_Report_Summary`,
      title: 'Loan Report – Summary',
      sheetName: 'Summary',
      columns: buildSummaryColumns(),
      data: filteredSummaryData as unknown as Record<string, unknown>[],
      filters: [['Customer', customerLabel || 'All'], ['Product', productLabel || 'All']],
      summaryCards: [
        ['Total Products', summaryData.length],
        ['Total Given', fmtQty(summaryTotalGiven)],
        ['Total Received', fmtQty(summaryTotalReceived)],
        ['Net Balance', fmtQty(summaryNetBalance)],
      ],
    })
  }, [filteredSummaryData, buildSummaryColumns, customerLabel, productLabel, summaryData.length, summaryTotalGiven, summaryTotalReceived, summaryNetBalance])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Loan Reports</h1>
        <p className="mt-1 text-sm text-gray-500">Track product loan transactions and balances across customers.</p>
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
                placeholder="Invoice, customer, product…"
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
                className="action-report inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? 'Loading…' : 'Load Data'}
              </button>
            ) : (
              <>
                <button
                  onClick={activeTab === 'details' ? handleExportDetail : handleExportSummary}
                  disabled={filteredData.length === 0}
                  className="action-report inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileSpreadsheet size={14} />
                  Excel
                </button>
                <button
                  onClick={handleLoad}
                  disabled={isLoading}
                  className="action-report inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
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
              <BookOpen size={28} />
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
        {!noData && (
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

            {/* Detail stats */}
            {activeTab === 'details' && detailData.length > 0 && (
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard label="Total Records" value={String(detailData.length)} />
                  <StatCard label="Unique Customers" value={String(uniqueDetailCustomers)} />
                  <StatCard label="Total Given" value={fmtQty(detailTotalGiven)} />
                  <StatCard label="Total Received" value={fmtQty(detailTotalReceived)} />
                </div>
              </div>
            )}
            {/* Summary stats */}
            {activeTab === 'summary' && summaryData.length > 0 && (
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard label="Total Products" value={String(summaryData.length)} />
                  <StatCard label="Total Given" value={fmtQty(summaryTotalGiven)} />
                  <StatCard label="Total Received" value={fmtQty(summaryTotalReceived)} />
                  <StatCard label="Net Balance" value={fmtQty(summaryNetBalance)} accent />
                </div>
              </div>
            )}

            {/* Detail table */}
            {activeTab === 'details' && (
              <div className="max-h-[calc(100vh-420px)] overflow-x-auto overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      {!customerSelected && (
                        <>
                          <th className="px-4 py-3 font-semibold">Customer ID</th>
                          <th className="px-4 py-3 font-semibold">Customer Name</th>
                          <th className="px-4 py-3 font-semibold">Address</th>
                        </>
                      )}
                      <th className="px-4 py-3 font-semibold">Invoice No</th>
                      <th className="px-4 py-3 font-semibold">Invoice Date</th>
                      <th className="px-4 py-3 font-semibold">Product Name</th>
                      <th className="px-4 py-3 font-semibold text-right">Loan Given</th>
                      <th className="px-4 py-3 font-semibold text-right">Loan Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDetailData.length === 0 ? (
                      <tr>
                        <td colSpan={customerSelected ? 5 : 8} className="px-4 py-10 text-center text-gray-400">
                          No records match your search
                        </td>
                      </tr>
                    ) : (
                      filteredDetailData.map((item, idx) => (
                        <tr key={`${item.invoiceNo ?? 'lr'}-${idx}`} className="transition-colors hover:bg-gray-50">
                          {!customerSelected && (
                            <>
                              <td className="px-4 py-2.5 text-gray-600">{item.customerId ?? '-'}</td>
                              <td className="px-4 py-2.5 text-gray-700">{item.customerName || '-'}</td>
                              <td className="max-w-[160px] truncate px-4 py-2.5 text-gray-500" title={item.customerAddress ?? ''}>
                                {item.customerAddress || '-'}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-2.5 font-medium text-gray-900">{item.invoiceNo || '-'}</td>
                          <td className="px-4 py-2.5 text-gray-600">{fmtDate(item.invoiceDate)}</td>
                          <td className="px-4 py-2.5 text-gray-700">{item.productName || '-'}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtQty(item.loanGivenQuantity)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtQty(item.loanReceiveQuantity)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary table */}
            {activeTab === 'summary' && (
              <div className="max-h-[calc(100vh-420px)] overflow-x-auto overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      {!customerSelected && (
                        <>
                          <th className="px-4 py-3 font-semibold">Customer ID</th>
                          <th className="px-4 py-3 font-semibold">Customer Name</th>
                          <th className="px-4 py-3 font-semibold">Address</th>
                        </>
                      )}
                      <th className="px-4 py-3 font-semibold">Product Name</th>
                      <th className="px-4 py-3 font-semibold text-right">Loan Given</th>
                      <th className="px-4 py-3 font-semibold text-right">Loan Received</th>
                      <th className="px-4 py-3 font-semibold text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSummaryData.length === 0 ? (
                      <tr>
                        <td colSpan={customerSelected ? 4 : 7} className="px-4 py-10 text-center text-gray-400">
                          No records match your search
                        </td>
                      </tr>
                    ) : (
                      filteredSummaryData.map((item, idx) => (
                        <tr key={`${item.productName ?? 'lrs'}-${idx}`} className="transition-colors hover:bg-gray-50">
                          {!customerSelected && (
                            <>
                              <td className="px-4 py-2.5 text-gray-600">{item.customerId ?? '-'}</td>
                              <td className="px-4 py-2.5 text-gray-700">{item.customerName || '-'}</td>
                              <td className="max-w-[160px] truncate px-4 py-2.5 text-gray-500" title={item.customerAddress ?? ''}>
                                {item.customerAddress || '-'}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-2.5 font-medium text-gray-900">{item.productName || '-'}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtQty(item.loanGivenQuantity)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmtQty(item.loanReceiveQuantity)}</td>
                          <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${(item.balanceQuantity ?? 0) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                            {fmtQty(item.balanceQuantity)}
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
