import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Search } from 'lucide-react'
import { jwtDecode } from 'jwt-decode'
import { getAccessToken } from '@/auth/authBridge'
import { apiClient } from '@/lib/api'
import { extractApiErrorMessage } from '@/pages/sales-orders/stockOutMappers'
import { fetchCurrentStockByProductAndChannel, useRestoreInventoryForReturn } from '@/hooks/useStockOut'
import type { StockOutApiResponse, StockOutOrderDetail, StockOutPackagingDetail, StockOutRestorePreviewItem } from '@/types/stockOut'

interface DecodedToken {
  ChannelId?: number
  channelId?: number
  channel_id?: number
}

function getChannelIdFromToken() {
  const token = getAccessToken()
  if (!token) return 1

  try {
    const decoded = jwtDecode<DecodedToken>(token)
    return Number(decoded.ChannelId ?? decoded.channelId ?? decoded.channel_id ?? 1)
  } catch {
    return 1
  }
}

export function DeliveryReturnPage() {
  const [soSystemId, setSoSystemId] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [serverError, setServerError] = useState('')
  const [restoreSuccess, setRestoreSuccess] = useState('')
  const [orderDetail, setOrderDetail] = useState<StockOutOrderDetail | null>(null)
  const [previewItems, setPreviewItems] = useState<StockOutRestorePreviewItem[]>([])

  const restoreMutation = useRestoreInventoryForReturn()
  const channelId = useMemo(() => getChannelIdFromToken(), [])

  const handleCheckData = async () => {
    const parsedId = Number(soSystemId)
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      setValidationErrors(['SO System ID must be a positive number.'])
      return
    }

    setLoadingPreview(true)
    setValidationErrors([])
    setServerError('')
    setRestoreSuccess('')
    setOrderDetail(null)
    setPreviewItems([])

    try {
      const detailResponse = await apiClient.get<StockOutApiResponse<StockOutOrderDetail>>(`/StockOut/GetStockOutOrderDetails/${parsedId}`)
      const detail = detailResponse.dataObj

      const businessErrors: string[] = []
      if (detail.stockOutGeneralData.soCurrentStatus !== 4) {
        businessErrors.push('This order is not at delivery status. Returns are only allowed for orders at delivery.')
      }
      if (detail.stockOutGeneralData.soAssociateCurrentStatus === 54) {
        businessErrors.push('This order has already been returned and inventory restored.')
      }

      if (businessErrors.length > 0) {
        setValidationErrors(businessErrors)
        return
      }

      let packagingDetail: StockOutPackagingDetail | null = null
      try {
        const packagingResponse = await apiClient.get<StockOutApiResponse<StockOutPackagingDetail>>(`/StockOut/GetPackagingInfo/${parsedId}`)
        packagingDetail = packagingResponse.dataObj
      } catch {
        packagingDetail = null
      }

      const sourceItems = packagingDetail?.stockOutPackagingItems?.length
        ? packagingDetail.stockOutPackagingItems.map((item) => ({
            originalProductId: item.sodProductId ?? item.sopProductId,
            effectiveProductId: item.sodMappedProductId ?? item.sodProductId ?? item.sopProductId,
            quantityToRestore: Number(item.sodConfirmedQty ?? item.sopProductQty ?? 0),
            productName: item.productName ?? 'Product',
            mappedProductName: item.mappedProductName ?? null,
          }))
        : detail.stockOutItemsData.map((item) => ({
            originalProductId: item.sodProductId,
            effectiveProductId: item.sodMappedProductId ?? item.sodProductId,
            quantityToRestore: Number(item.sodConfirmedQty ?? item.sodQty ?? 0),
            productName: item.productName ?? 'Product',
            mappedProductName: item.mappedProductName ?? null,
          }))

      if (sourceItems.length === 0) {
        setValidationErrors(['No packaging or item data was found for this order.'])
        return
      }

      const preview = await Promise.all(
        sourceItems.map(async (item) => {
          const stockData = await fetchCurrentStockByProductAndChannel(item.effectiveProductId, channelId)
          const currentStock = Number(stockData[0]?.currentQty ?? 0)

          return {
            productName: item.productName,
            originalProductId: item.originalProductId,
            mappedProductName: item.mappedProductName,
            effectiveProductId: item.effectiveProductId,
            quantityToRestore: item.quantityToRestore,
            currentStock,
            estimatedAfterStock: currentStock + item.quantityToRestore,
          } satisfies StockOutRestorePreviewItem
        }),
      )

      setOrderDetail(detail)
      setPreviewItems(preview)
    } catch (error) {
      setServerError(extractApiErrorMessage(error))
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleRestore = async () => {
    const parsedId = Number(soSystemId)
    try {
      const response = await restoreMutation.mutateAsync(parsedId)
      setRestoreSuccess(response.message ?? 'Inventory restored successfully.')
    } catch (error) {
      setServerError(extractApiErrorMessage(error))
    }
  }

  const resetState = () => {
    setSoSystemId('')
    setValidationErrors([])
    setServerError('')
    setRestoreSuccess('')
    setOrderDetail(null)
    setPreviewItems([])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Out Revert</h1>
        <p className="mt-1 text-sm text-gray-500">Restore inventory for returned sales orders.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[18rem_auto_auto]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              inputMode="numeric"
              value={soSystemId}
              onChange={(event) => setSoSystemId(event.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Enter SO System ID"
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleCheckData()}
            disabled={loadingPreview || restoreMutation.isPending || soSystemId.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingPreview && <Loader2 size={16} className="animate-spin" />}
            Check Data
          </button>
          <button
            type="button"
            onClick={resetState}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <RefreshCw size={16} /> Reset
          </button>
        </div>

        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Current channel resolved from the login token: <span className="font-semibold">{channelId}</span>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Cannot process this return.</p>
          <ul className="mt-2 list-disc pl-5">
            {validationErrors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {serverError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">Delivery return failed</p>
            <p className="mt-1 text-xs text-red-600">{serverError}</p>
          </div>
        </div>
      )}

      {restoreSuccess && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-medium text-emerald-900">Restoration Completed Successfully!</p>
            <p className="mt-1 text-xs text-emerald-700">{restoreSuccess}</p>
            <p className="mt-1 text-xs text-emerald-600">Inventory has been restored for {previewItems.length} product(s). Order has been marked as returned and stock levels have been updated.</p>
            <button
              type="button"
              onClick={resetState}
              className="mt-3 inline-flex items-center gap-1 rounded border border-emerald-400 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              Restore Another Order
            </button>
          </div>
        </div>
      )}

      {orderDetail && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MetricCard label="Customer" value={orderDetail.stockOutGeneralData.customerName ?? '—'} />
            <MetricCard label="Invoice" value={orderDetail.stockOutGeneralData.soSystemNo ?? String(orderDetail.stockOutGeneralData.soSystemId)} />
            <MetricCard label="Source Channel" value={String((orderDetail.stockOutGeneralData as unknown as Record<string, unknown>).soSourceChannelId ?? channelId)} />
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Products to Restore</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    <th className="px-5 py-3">Product Name</th>
                    <th className="px-5 py-3">Original Product ID</th>
                    <th className="px-5 py-3">Mapped Product</th>
                    <th className="px-5 py-3 text-right">Quantity to Restore</th>
                    <th className="px-5 py-3 text-right">Current Stock</th>
                    <th className="px-5 py-3 text-right">Estimated After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {previewItems.map((item) => (
                    <tr key={`${item.effectiveProductId}-${item.originalProductId ?? 'base'}`} className="transition-colors hover:bg-gray-50/60">
                      <td className="px-5 py-3 font-medium text-gray-900">{item.productName}</td>
                      <td className="px-5 py-3 text-gray-700">{item.originalProductId ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-700">{item.mappedProductName ?? '—'}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{formatNumber(item.quantityToRestore)}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{formatNumber(item.currentStock)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">
                        <strong>{formatNumber(item.estimatedAfterStock)}</strong>
                        <span className="block text-xs font-normal text-gray-400">({formatNumber(item.currentStock)} + {formatNumber(item.quantityToRestore)})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
              <button
                type="button"
                onClick={() => void handleRestore()}
                disabled={restoreMutation.isPending || previewItems.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {restoreMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                Revert Inventory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function formatNumber(value: number) {
  return value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}