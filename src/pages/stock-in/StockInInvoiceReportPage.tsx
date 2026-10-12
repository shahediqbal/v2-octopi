// ============================================================
// Stock-In — Invoice Report Page
// Enter a SI System ID → view formatted report → print/PDF
// Mirrors legacy: ProdctInReport.js
// ============================================================
import { useRef, useState } from 'react'
import { Search, Printer, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStockInDetail } from '@/hooks/useStockIn'

export function StockInInvoiceReportPage() {
  const [inputId, setInputId] = useState('')
  const [searchId, setSearchId] = useState<number | undefined>()
  const printRef = useRef<HTMLDivElement>(null)

  const { data: detail, isLoading, isError } = useStockInDetail(searchId)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseInt(inputId, 10)
    if (!Number.isNaN(parsed) && parsed > 0) {
      setSearchId(parsed)
    }
  }

  function handlePrint() {
    if (!printRef.current) return
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>Stock-In Invoice Report</title>
          <style>
            body { font-family: sans-serif; font-size: 12px; color: #111; margin: 32px; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            h2 { font-size: 14px; margin: 16px 0 8px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; }
            th { background: #f0f0f0; font-weight: 600; text-align: left; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
            .label { font-size: 10px; color: #888; }
            .value { font-weight: 500; }
            .summary { margin-left: auto; width: 240px; }
            .summary div { display: flex; justify-content: space-between; padding: 3px 0; }
            .total { font-weight: 700; border-top: 1px solid #ccc; padding-top: 4px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  const g = detail?.stockInGeneralData
  const b = detail?.stockInBillData
  const items = detail?.stockInItemsData ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/stock-in/invoices"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock-In Invoice Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter a Stock-In System ID to generate the report.
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="number"
          min="1"
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          placeholder="Enter Stock-In System ID"
          className="block w-64 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
        <button
          type="submit"
          className="action-report inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          <Search className="h-4 w-4" /> Load Report
        </button>
      </form>

      {/* Loading / Error / Report */}
      {isLoading && (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {isError && (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-red-600">
          <AlertCircle className="h-6 w-6" />
          <p className="text-sm font-medium">Failed to load the stock-in order. Check the ID and try again.</p>
        </div>
      )}

      {detail && g && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <span className="text-sm font-medium text-gray-700">Report Preview</span>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
          </div>

          {/* Printable content */}
          <div ref={printRef} className="p-6 space-y-6">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Stock-In Invoice</h1>
              <p className="text-sm text-gray-500">{g.siSystemNo}</p>
            </div>

            {/* Summary grid */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-4">
              <div>
                <p className="label text-xs text-gray-500">Invoice No.</p>
                <p className="value font-medium text-gray-900">{g.siInvoiceNo ?? '—'}</p>
              </div>
              <div>
                <p className="label text-xs text-gray-500">Invoice Date</p>
                <p className="value font-medium text-gray-900">{g.siInvoiceDate?.slice(0, 10) ?? '—'}</p>
              </div>
              <div>
                <p className="label text-xs text-gray-500">Order Type</p>
                <p className="value font-medium text-gray-900">{g.jobTypeName ?? '—'}</p>
              </div>
              <div>
                <p className="label text-xs text-gray-500">Supplier</p>
                <p className="value font-medium text-gray-900">{g.supplierName ?? g.customerName ?? '—'}</p>
              </div>
              <div>
                <p className="label text-xs text-gray-500">Source Channel</p>
                <p className="value font-medium text-gray-900">{g.siSourceChannelName ?? '—'}</p>
              </div>
              <div>
                <p className="label text-xs text-gray-500">Destination Channel</p>
                <p className="value font-medium text-gray-900">{g.siDestinationChannelName ?? '—'}</p>
              </div>
              {g.siRemarks && (
                <div className="col-span-2">
                  <p className="label text-xs text-gray-500">Remarks</p>
                  <p className="value font-medium text-gray-900">{g.siRemarks}</p>
                </div>
              )}
            </div>

            {/* Items table */}
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-700">Items</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-right">Declared Qty</th>
                      <th className="px-3 py-2 text-right">Confirmed Qty</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, i) => (
                      <tr key={item.sidProductId}>
                        <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                        <td className="px-3 py-2 text-gray-900">
                          {item.productName}
                          {item.sidProductStrength && (
                            <span className="ml-1 text-xs text-gray-500">({item.sidProductStrength})</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">{item.sidDeclaredQty}</td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {item.sidConfirmedQty ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {item.sidDeclaredUnitPrice?.toFixed(4) ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                          {item.sidDeclaredQty != null && item.sidDeclaredUnitPrice != null
                            ? (item.sidDeclaredQty * item.sidDeclaredUnitPrice).toFixed(2)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill Summary */}
            {b && (
              <div className="summary ml-auto w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {b.sibCalculatedAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
                    {b.sibCurrencyName ? ` ${b.sibCurrencyName}` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-red-600">
                    -{b.sibDiscountAmouunt?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Adjustment</span>
                  <span className="font-medium">
                    {b.sibAdjustedAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                  </span>
                </div>
                <div className="total flex justify-between border-t border-gray-200 pt-1.5 font-semibold text-gray-900">
                  <span>Final Amount</span>
                  <span>
                    {b.sibFinalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
                    {b.sibCurrencyName ? ` ${b.sibCurrencyName}` : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
