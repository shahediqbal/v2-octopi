import { useEffect, useState } from 'react'
import { AlertCircle, FileBadge2, FileText, Loader2, Package2, Receipt, Tags } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { usePackagingDetail, useStockOutDetail } from '@/hooks/useStockOut'
import { KarjadeshView } from '@/pages/sales-orders/KarjadeshView'
import { SalesOrderChalaanModal } from '@/pages/sales-orders/SalesOrderChalaanModal'
import { SalesOrderInternalModal } from '@/pages/sales-orders/SalesOrderInternalModal'
import { SalesOrderStickerModal } from '@/pages/sales-orders/SalesOrderStickerModal'
import { formatPrintDate } from '@/pages/sales-orders/printUtils'

type PreviewKind = 'invoice' | 'packing' | 'chalaan' | 'sticker'

export function PackingPrintPage() {
  const [searchParams] = useSearchParams()
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [activeModal, setActiveModal] = useState<PreviewKind | null>(null)

  const { data: previewDetail, isLoading: loadingPreview, error: previewError } = usePackagingDetail(previewId ?? undefined)
  const { data: orderDetail, isLoading: loadingOrderDetail, error: orderDetailError } = useStockOutDetail(previewId ?? undefined)

  useEffect(() => {
    const orderId = Number(searchParams.get('orderId') ?? '')
    if (Number.isFinite(orderId) && orderId > 0) {
      setPreviewId(orderId)
    }
  }, [searchParams])

  const closeModal = () => setActiveModal(null)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
          <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
            <Package2 size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Packing List Preview Source</h2>
            <p className="mt-1 text-sm text-gray-500">The selected package-done order stays loaded here so you can switch between invoice, packing list, chalaan, and sticker outputs without leaving the page.</p>
          </div>
        </div>

        {!previewId && (
          <div className="py-12 text-center text-sm text-gray-400">No order selected. Navigate here from the Packages Done list.</div>
        )}

        {previewId && (loadingPreview || loadingOrderDetail) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-gray-400" />
            <span className="ml-3 text-sm text-gray-500">Loading package detail...</span>
          </div>
        )}

        {previewId && !loadingPreview && !loadingOrderDetail && previewDetail && (
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
              <DetailMetric label="Order" value={previewDetail.soSystemNo ?? String(previewId)} />
              <DetailMetric label="Partner" value={orderDetail?.stockOutGeneralData.customerName ?? orderDetail?.stockOutGeneralData.supplierName ?? previewDetail.customerName ?? previewDetail.supplierName ?? '---'} />
              <DetailMetric label="Order Type" value={orderDetail?.stockOutGeneralData.jobTypeName ?? previewDetail.jobType ?? '---'} />
              <DetailMetric label="Invoice Date" value={formatPrintDate(orderDetail?.stockOutGeneralData.invoiceDate ?? previewDetail.invoiceDate)} />
            </div>

            {orderDetail && (
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-3">
                <DetailMetric label="Address" value={orderDetail.stockOutGeneralData.customerAddress ?? orderDetail.stockOutGeneralData.supplierAddress ?? '---'} />
                <DetailMetric label="Reference" value={orderDetail.stockOutGeneralData.soCustomerReferance ?? '---'} />
                <DetailMetric label="Remarks" value={orderDetail.stockOutGeneralData.soRemarks?.trim() ? orderDetail.stockOutGeneralData.soRemarks : 'No remarks'} />
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3">Pack Type</th>
                    <th className="px-4 py-3 text-right">Pack Size</th>
                    <th className="px-4 py-3 text-right">Pack No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {previewDetail.stockOutPackagingItems.map((item, index) => (
                    <tr key={`${item.sopProductId}-${index}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.productName ?? '---'}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatAmount(item.sopProductQty)}</td>
                      <td className="px-4 py-3 text-gray-700">{item.packTypeName ?? item.packInfo ?? '---'}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatAmount(item.sopPackSize)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatAmount(item.sopNoPack)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <ActionButton icon={FileText} label="Open Invoice" onClick={() => setActiveModal('invoice')} />
              <ActionButton icon={Receipt} label="Open Packing List" onClick={() => setActiveModal('packing')} />
              <ActionButton icon={FileBadge2} label="Open Chalaan" onClick={() => setActiveModal('chalaan')} />
              <ActionButton icon={Tags} label="Open Sticker" onClick={() => setActiveModal('sticker')} />
            </div>
          </div>
        )}

        {previewId && !loadingPreview && !!previewError && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{(previewError as Error).message}</p>
          </div>
        )}
      </div>

      <SalesOrderInternalModal
        isOpen={activeModal === 'invoice'}
        detail={orderDetail}
        isLoading={loadingOrderDetail}
        errorMessage={(orderDetailError as Error | undefined)?.message}
        title="Invoice / Detail"
        viewVariant="packing-print"
        onClose={closeModal}
      />

      <KarjadeshView
        isOpen={activeModal === 'packing'}
        detail={orderDetail}
        isLoading={loadingOrderDetail}
        errorMessage={(orderDetailError as Error | undefined)?.message}
        onClose={closeModal}
      />

      <SalesOrderChalaanModal
        isOpen={activeModal === 'chalaan'}
        packagingDetail={previewDetail}
        orderDetail={orderDetail}
        isLoading={loadingPreview}
        errorMessage={(previewError as Error | undefined)?.message}
        onClose={closeModal}
      />

      <SalesOrderStickerModal
        isOpen={activeModal === 'sticker'}
        packagingDetail={previewDetail}
        orderDetail={orderDetail}
        isLoading={loadingPreview}
        errorMessage={(previewError as Error | undefined)?.message}
        onClose={closeModal}
      />
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick }: { icon: typeof FileText; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-800">{value}</p>
    </div>
  )
}

function formatAmount(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0)
  if (Number.isNaN(numeric)) return '0.00'
  return numeric.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
