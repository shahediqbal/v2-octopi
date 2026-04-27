// ============================================================
// Stock-In — Edit Page (standard / price-edit / admin-revert)
// ============================================================
import { useMemo, useState } from 'react'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useStockInDetail,
  useUpdateStockIn,
  useRevertStockIn,
} from '@/hooks/useStockIn'
import { StockInForm } from '@/pages/stock-in/StockInForm'
import { ConfirmDialog } from '@/pages/stock-in/ConfirmDialog'
import {
  mapPriceEditItemToPayload,
  mapStockInItemToPayload,
  normalizeStockInItemForForm,
} from '@/pages/stock-in/stockInMappers'
import type { StockInFormData } from '@/schemas/stockInSchema'
import type { StockInEditMode } from '@/types/stockIn'
import { EDIT_MODE_CONFIG } from '@/features/stock-in/modes'

interface EditStockInPageProps {
  mode?: StockInEditMode
}

function extractError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred.'
}

function buildListPath(mode: StockInEditMode): string {
  switch (mode) {
    case 'price-edit':
      return '/stock-in/price-update'
    case 'admin-revert':
      return '/stock-in/admin/approved'
    default:
      return '/stock-in'
  }
}

export function EditStockInPage({ mode = 'standard' }: EditStockInPageProps) {
  const { id } = useParams<{ id: string }>()
  const orderId = Number(id)
  const navigate = useNavigate()
  const config = EDIT_MODE_CONFIG[mode]

  const { data: detail, isLoading, isError } = useStockInDetail(orderId)
  const updateMutation = useUpdateStockIn()
  const revertMutation = useRevertStockIn()
  const [serverError, setServerError] = useState<string>()
  const [showRevertConfirm, setShowRevertConfirm] = useState(false)

  const listPath = buildListPath(mode)

  // Map API data to form defaults
  const defaultValues: Partial<StockInFormData> | undefined = useMemo(() => {
    if (!detail) return undefined
    const g = detail.stockInGeneralData
    const b = detail.stockInBillData
    return {
      siSystemId: g.siSystemId,
      siSystemNo: g.siSystemNo,
      siInvoiceNo: g.siInvoiceNo ?? '',
      siInvoiceDate: g.siInvoiceDate?.slice(0, 10) ?? '',
      siJobTypeId: g.siJobTypeId ?? 0,
      jobTypeName: g.jobTypeName ?? '',
      siRemarks: g.siRemarks ?? null,
      siSourceChannelId: g.siSourceChannelId ?? 0,
      siSourceChannelName: g.siSourceChannelName ?? null,
      siDestinationChannelId: g.siDestinationChannelId ?? 0,
      siDestinationChannelName: g.siDestinationChannelName ?? null,
      siSupplierId: g.siSupplierId ?? null,
      supplierName: g.supplierName ?? null,
      supplierAddress: g.supplierAddress ?? null,
      siCustomerId: g.siCustomerId ?? null,
      customerName: g.customerName ?? null,
      customerAddress: g.customerAddress ?? null,
      siInvoiceReceiveStatus: g.siInvoiceReceiveStatus ?? false,
      siInvoiceReceiveDate: g.siInvoiceReceiveDate ?? null,
      sibCalculatedAmount: b?.sibCalculatedAmount ?? 0,
      sibDiscountAmouunt: b?.sibDiscountAmouunt ?? 0,
      sibAdjustedAmount: b?.sibAdjustedAmount ?? 0,
      sibFinalAmount: b?.sibFinalAmount ?? 0,
      sibCurrencyName: b?.sibCurrencyName ?? 'BDT',
      items: (detail.stockInItemsData ?? []).map((item) => normalizeStockInItemForForm(item)),
    }
  }, [detail])

  async function handleSubmit(values: StockInFormData) {
    setServerError(undefined)
    try {
      const originalGeneral = mode === 'price-edit' ? detail.stockInGeneralData : undefined
      const payload = {
        stockInGeneralData: {
          siSystemId: orderId,
          siSystemNo: originalGeneral?.siSystemNo ?? values.siSystemNo ?? '',
          siInvoiceNo: values.siInvoiceNo,
          siInvoiceDate: originalGeneral?.siInvoiceDate ?? values.siInvoiceDate,
          siInvoiceDateInText:
            originalGeneral?.siInvoiceDateInText ?? originalGeneral?.siInvoiceDate ?? values.siInvoiceDate,
          siJobTypeId: originalGeneral?.siJobTypeId ?? values.siJobTypeId,
          jobTypeName: originalGeneral?.jobTypeName ?? values.jobTypeName,
          siRemarks: values.siRemarks ?? null,
          siSourceChannelId: originalGeneral?.siSourceChannelId ?? values.siSourceChannelId,
          siSourceChannelName: originalGeneral?.siSourceChannelName ?? values.siSourceChannelName ?? null,
          siDestinationChannelId:
            originalGeneral?.siDestinationChannelId ?? values.siDestinationChannelId,
          siDestinationChannelName:
            originalGeneral?.siDestinationChannelName ?? values.siDestinationChannelName ?? null,
          siSupplierId: originalGeneral?.siSupplierId ?? values.siSupplierId ?? null,
          supplierName: originalGeneral?.supplierName ?? values.supplierName ?? null,
          supplierAddress: originalGeneral?.supplierAddress ?? values.supplierAddress ?? null,
          siCustomerId: originalGeneral?.siCustomerId ?? values.siCustomerId ?? null,
          customerName: originalGeneral?.customerName ?? values.customerName ?? null,
          customerAddress: originalGeneral?.customerAddress ?? values.customerAddress ?? null,
          siInvoiceReceiveStatus:
            originalGeneral?.siInvoiceReceiveStatus ?? values.siInvoiceReceiveStatus ?? false,
          siInvoiceReceiveDate:
            originalGeneral?.siInvoiceReceiveDate ?? values.siInvoiceReceiveDate ?? null,
        },
        stockInItemsData: values.items.map((item) =>
          mode === 'price-edit'
            ? mapPriceEditItemToPayload(item)
            : mapStockInItemToPayload(item),
        ),
        stockInBillData: {
          sibCalculatedAmount: values.sibCalculatedAmount,
          sibDiscountAmouunt: values.sibDiscountAmouunt,
          sibAdjustedAmount: values.sibAdjustedAmount,
          sibFinalAmount: values.sibFinalAmount,
          sibCurrencyName: values.sibCurrencyName,
        },
      }
      const response = await updateMutation.mutateAsync(payload)
      if (response?.errMsg) {
        setServerError(response.errMsg)
        return
      }
      navigate(listPath)
    } catch (error) {
      setServerError(extractError(error))
    }
  }

  async function handleAdminRevert() {
    if (!detail) return
    setServerError(undefined)
    try {
      const items = detail.stockInItemsData.map((item) => ({
        sidProductId: item.sidProductId,
        sidConfirmedQty: item.sidConfirmedQty ?? 0,
      }))
      const response = await revertMutation.mutateAsync({ siSystemId: orderId, items })
      if ((response as { errMsg?: string })?.errMsg) {
        setServerError((response as { errMsg: string }).errMsg)
        return
      }
      navigate(listPath)
    } catch (error) {
      setServerError(extractError(error))
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-red-600">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium">Failed to load stock-in order details.</p>
        <Link to={listPath} className="text-sm text-gray-500 underline">
          Back to list
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={listPath}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {config.description}{' '}
            <span className="font-medium text-gray-700">
              {detail.stockInGeneralData.siSystemNo}
            </span>
          </p>
        </div>
      </div>

      {mode === 'admin-revert' ? (
        <>
          {/* Admin Revert: read-only view + revert action */}
          <StockInForm
            mode="admin-revert"
            defaultValues={defaultValues}
            onSubmit={() => {}}   // Not used in revert mode
            isSubmitting={false}
            submitLabel="(read-only)"
            serverError={serverError}
          />
          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowRevertConfirm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-600"
            >
              Revert This Stock-In
            </button>
          </div>
          <ConfirmDialog
            open={showRevertConfirm}
            title="Revert Approved Stock-In"
            message="This will remove the confirmed quantities from inventory and restore the order to pending status. Are you sure?"
            confirmLabel="Yes, Revert"
            cancelLabel="Cancel"
            confirmVariant="danger"
            onConfirm={handleAdminRevert}
            onCancel={() => setShowRevertConfirm(false)}
            isLoading={revertMutation.isPending}
          />
        </>
      ) : (
        <StockInForm
          mode={mode}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          submitLabel={mode === 'price-edit' ? 'Update Prices' : 'Save Changes'}
          serverError={serverError}
        />
      )}
    </div>
  )
}
