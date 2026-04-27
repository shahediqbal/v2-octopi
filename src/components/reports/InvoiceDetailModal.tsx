import { X, Loader2, AlertCircle, FileText } from 'lucide-react'
import { useInvoiceDetail } from '@/hooks/useInvoiceDetail'

const PRICE_HIDDEN_JOB_TYPES = ['Sample_Issue', 'Warehouse_Transfer']

interface InvoiceDetailModalProps {
  soSystemId: number | null
  onClose: () => void
}

function fmtNum(value: number | null, decimals = 2) {
  if (value == null) return '—'
  return value.toLocaleString('en-BD', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function InvoiceDetailModal({ soSystemId, onClose }: InvoiceDetailModalProps) {
  const { data: invoice, isLoading, isError } = useInvoiceDetail(soSystemId)

  const hidePrices = invoice?.jobType != null && PRICE_HIDDEN_JOB_TYPES.includes(invoice.jobType)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-gray-500" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Invoice Detail</h3>
              {invoice?.soSystemNo && (
                <p className="text-xs text-gray-500">{invoice.soSystemNo}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={22} className="animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading…</span>
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={14} />
              Failed to load invoice details.
            </div>
          )}

          {!isLoading && !isError && invoice && (
            <div className="space-y-5">
              {/* Customer info */}
              {(invoice.entityName || invoice.jobType) && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {invoice.entityName && (
                      <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="font-medium text-gray-800">{invoice.entityName}</p>
                        {invoice.entityAddress && <p className="text-xs text-gray-500">{invoice.entityAddress}</p>}
                      </div>
                    )}
                    {invoice.jobType && (
                      <div>
                        <p className="text-xs text-gray-500">Job Type</p>
                        <p className="font-medium text-gray-800">{invoice.jobType.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items table */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Items</h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Product</th>
                        <th className="px-3 py-2 font-semibold text-right">Qty</th>
                        {!hidePrices && (
                          <>
                            <th className="px-3 py-2 font-semibold text-right">Unit Price</th>
                            <th className="px-3 py-2 font-semibold text-right">Final Unit Price</th>
                            <th className="px-3 py-2 font-semibold text-right">Line Total</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(invoice.stockOutItemsData ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={hidePrices ? 2 : 5} className="px-3 py-6 text-center text-gray-400">
                            No items
                          </td>
                        </tr>
                      ) : (
                        (invoice.stockOutItemsData ?? []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-700">{item.productName || '—'}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-900">{fmtNum(item.sodQty, 0)}</td>
                            {!hidePrices && (
                              <>
                                <td className="px-3 py-2 text-right tabular-nums text-gray-600">{fmtNum(item.sodUnitPrice)}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-gray-600">{fmtNum(item.sodFinalCalculatedUnitPrice)}</td>
                                <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-800">
                                  {item.sodFinalCalculatedUnitPrice != null && item.sodQty != null
                                    ? fmtNum(item.sodFinalCalculatedUnitPrice * item.sodQty)
                                    : '—'}
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bill summary */}
              {!hidePrices && invoice.stockOutBillData && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Bill Summary</h4>
                  <div className="rounded-lg border border-gray-200 bg-gray-50">
                    <BillRow label="Calculated Bill" value={invoice.stockOutBillData.calculatedBill} />
                    <BillRow label="VAT %" value={invoice.stockOutBillData.billVatPercantage} suffix="%" />
                    <BillRow label="AIT %" value={invoice.stockOutBillData.billAitPercantage} suffix="%" />
                    <BillRow label="Discount" value={invoice.stockOutBillData.billDiscountAmount ?? invoice.stockOutBillData.billDiscount} />
                    <BillRow label="Adjustment" value={invoice.stockOutBillData.billAdjustment} />
                    {invoice.stockOutBillData.finalBill != null && (
                      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2.5">
                        <span className="text-sm font-bold text-gray-900">Final Bill</span>
                        <span className="text-sm font-bold text-gray-900">
                          {invoice.stockOutBillData.sobCurrencyName || 'BDT'}{' '}
                          {fmtNum(invoice.stockOutBillData.finalBill)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function BillRow({ label, value, suffix }: { label: string; value: number | null | undefined; suffix?: string }) {
  if (value == null || value === 0) return null
  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="tabular-nums text-gray-800">
        {value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        {suffix}
      </span>
    </div>
  )
}
