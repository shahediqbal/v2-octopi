import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, Database, FileSpreadsheet, Loader2, RefreshCw, Search, TrendingUp } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { usePurchasePriceHistory } from '@/hooks/usePurchasePriceHistory'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { PurchasePriceHistoryFilters } from '@/types/purchasePriceHistory'

function fmtDate(value: string | null) {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtCurrency(value: number | null) {
  if (value == null) return '-'
  return value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const EXCEL_COLUMNS = [
  { key: 'supplierId', header: 'Supplier ID', format: 'integer' as const },
  { key: 'supplierName', header: 'Supplier Name' },
  { key: 'productId', header: 'Product ID', format: 'integer' as const },
  { key: 'productName', header: 'Product Name' },
  { key: 'confirmedUnitPrice', header: 'Unit Price', format: 'number' as const },
  { key: 'invoiceDate', header: 'Invoice Date', format: 'date' as const },
] as const

export function PurchasePriceHistoryPage() {
  const [productId, setProductId] = useState<number | null>(null)
  const [productLabel, setProductLabel] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadRequested, setLoadRequested] = useState(false)

  const filters: PurchasePriceHistoryFilters = useMemo(
    () => ({ productId: productId ?? 0 }),
    [productId],
  )

  const {
    data: reportData = [],
    isLoading,
    isError,
    error,
    refetch,
  } = usePurchasePriceHistory(filters, loadRequested)

  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return reportData
    return reportData.filter(
      (item) =>
        item.supplierName?.toLowerCase().includes(q) ||
        item.productName?.toLowerCase().includes(q),
    )
  }, [reportData, searchTerm])

  const uniqueSuppliers = useMemo(
    () => new Set(reportData.filter((i) => i.supplierId).map((i) => i.supplierId)).size,
    [reportData],
  )
  const prices = useMemo(
    () => reportData.map((i) => i.confirmedUnitPrice ?? 0).filter((p) => p > 0),
    [reportData],
  )
  const avgPrice = useMemo(() => (prices.length > 0 ? prices.reduce((s, p) => s + p, 0) / prices.length : 0), [prices])
  const minPrice = useMemo(() => (prices.length > 0 ? Math.min(...prices) : 0), [prices])
  const maxPrice = useMemo(() => (prices.length > 0 ? Math.max(...prices) : 0), [prices])

  const handleLoad = useCallback(() => {
    setLoadRequested(true)
    void refetch()
  }, [refetch])

  const handleExport = useCallback(async () => {
    if (filteredData.length === 0) return
    const showProductColumns = productId == null
    const columns = showProductColumns ? [...EXCEL_COLUMNS] : EXCEL_COLUMNS.filter((c) => c.key !== 'productId' && c.key !== 'productName')
    await exportExcelOnDemand({
      fileName: `Purchase_Price_History${productLabel ? `_${productLabel}` : ''}`,
      title: 'Purchase Price History',
      subtitle: productLabel ? `Product: ${productLabel}` : 'All Products',
      sheetName: 'Price History',
      columns,
      data: filteredData as unknown as Record<string, unknown>[],
      filters: [['Product', productLabel || 'All']],
      summaryCards: [
        ['Total Records', reportData.length],
        ['Unique Suppliers', uniqueSuppliers],
        ['Avg Unit Price', fmtCurrency(avgPrice)],
        ['Min Price', fmtCurrency(minPrice)],
        ['Max Price', fmtCurrency(maxPrice)],
      ],
    })
  }, [filteredData, productId, productLabel, reportData.length, uniqueSuppliers, avgPrice, minPrice, maxPrice])

  const noData = reportData.length === 0
  const showProductCols = productId == null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Purchase Price History</h1>
        <p className="mt-1 text-sm text-gray-500">View historical purchase prices per product and supplier.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 px-4 py-4">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Product</label>
            <PaginatedCombobox
              type="product"
              value={productId}
              onValueChange={(v, l) => { setProductId(v); setProductLabel(l ?? null); setLoadRequested(false) }}
              placeholder="All Products"
            />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Supplier, product…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputCls} pl-8`} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {noData ? (
              <button onClick={handleLoad} disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? 'Loading…' : 'Load Data'}
              </button>
            ) : (
              <>
                <button onClick={handleExport} disabled={filteredData.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
                  <FileSpreadsheet size={14} />Excel
                </button>
                <button onClick={handleLoad} disabled={isLoading} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />Refresh
                </button>
              </>
            )}
          </div>
        </div>

        {isLoading && <div className="h-1 w-full overflow-hidden bg-gray-100"><div className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] rounded bg-gray-400" /></div>}
        {isError && <div className="mx-4 my-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"><AlertCircle size={14} /> {(error as Error)?.message ?? 'Failed to load data'}</div>}

        {!isLoading && noData && !loadRequested && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"><TrendingUp size={28} /></div>
            <h2 className="text-lg font-semibold text-gray-900">No Data Loaded</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">Select a product (or leave blank for all) and click Load Data.</p>
          </div>
        )}
        {!isLoading && loadRequested && noData && !isError && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"><Database size={28} /></div>
            <h2 className="text-lg font-semibold text-gray-900">No Records Found</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">No price history found for the selected product.</p>
          </div>
        )}

        {!noData && (
          <>
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <StatCard label="Total Records" value={String(reportData.length)} />
                <StatCard label="Unique Suppliers" value={String(uniqueSuppliers)} />
                <StatCard label="Avg Unit Price" value={fmtCurrency(avgPrice)} />
                <StatCard label="Min Price" value={fmtCurrency(minPrice)} />
                <StatCard label="Max Price" value={fmtCurrency(maxPrice)} accent />
              </div>
            </div>

            <div className="max-h-[calc(100vh-380px)] overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Supplier</th>
                    {showProductCols && <th className="px-4 py-3 font-semibold">Product</th>}
                    <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                    <th className="px-4 py-3 font-semibold">Invoice Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.length === 0 ? (
                    <tr><td colSpan={showProductCols ? 4 : 3} className="px-4 py-10 text-center text-gray-400">No records match your search</td></tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-700">{item.supplierName || '-'}</td>
                        {showProductCols && <td className="px-4 py-2.5 font-medium text-gray-900">{item.productName || '-'}</td>}
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-gray-900">{fmtCurrency(item.confirmedUnitPrice)}</td>
                        <td className="px-4 py-2.5 text-gray-600">{fmtDate(item.invoiceDate)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
              <p className="text-xs text-gray-500">Showing {filteredData.length} of {reportData.length} records</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const inputCls = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'
function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-gray-800' : 'text-gray-700'}`}>{value}</p>
    </div>
  )
}
