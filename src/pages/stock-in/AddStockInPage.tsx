// ============================================================
// Stock-In — Add (Create) Page
// ============================================================
import { useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '@/auth/authBridge'
import { useCreateStockIn } from '@/hooks/useStockIn'
import { StockInForm } from '@/pages/stock-in/StockInForm'
import { mapStockInItemToPayload } from '@/pages/stock-in/stockInMappers'
import type { StockInFormData } from '@/schemas/stockInSchema'

function getUserSystemId() {
  const token = getAccessToken()
  if (!token) return 0

  try {
    const decoded = jwtDecode<{ UserSystemId?: number | string }>(token)
    return Number(decoded.UserSystemId ?? 0)
  } catch {
    return 0
  }
}

function extractBodyMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null

  const candidate = body as {
    errMsg?: string
    message?: string
    title?: string
    errors?: Record<string, string[] | undefined> | null
  }

  if (typeof candidate.errMsg === 'string' && candidate.errMsg.trim()) {
    return candidate.errMsg
  }

  if (candidate.errors && typeof candidate.errors === 'object') {
    for (const messages of Object.values(candidate.errors)) {
      if (Array.isArray(messages)) {
        const firstMessage = messages.find(
          (message): message is string => typeof message === 'string' && message.trim().length > 0,
        )
        if (firstMessage) return firstMessage
      }
    }
  }

  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    return candidate.message
  }

  if (typeof candidate.title === 'string' && candidate.title.trim()) {
    return candidate.title
  }

  return null
}

function extractError(error: unknown): string {
  if (error && typeof error === 'object' && 'body' in error) {
    const apiBodyMessage = extractBodyMessage((error as { body?: unknown }).body)
    if (apiBodyMessage) return apiBodyMessage
  }

  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred.'
}

export function AddStockInPage() {
  const navigate = useNavigate()
  const createMutation = useCreateStockIn()
  const [serverError, setServerError] = useState<string>()

  async function handleSubmit(values: StockInFormData) {
    setServerError(undefined)
    try {
      const userSystemId = getUserSystemId()
      const payload = {
        stockInGeneralData: {
          siSystemNo: values.siSystemNo ?? 'CH00201',
          siSystemId: userSystemId,
          siInvoiceNo: values.siInvoiceNo,
          siInvoiceDate: new Date(values.siInvoiceDate).toISOString(),
          siInvoiceDateInText: values.siInvoiceDate,
          siJobTypeId: values.siJobTypeId,
          jobTypeName: values.jobTypeName,
          siRemarks: values.siRemarks ?? null,
          siSourceChannelId: values.siSourceChannelId,
          siSourceChannelName: values.siSourceChannelName ?? null,
          siDestinationChannelId: values.siDestinationChannelId,
          siDestinationChannelName: values.siDestinationChannelName ?? null,
          siSupplierId: values.siSupplierId ?? null,
          supplierName: values.supplierName ?? null,
          supplierAddress: values.supplierAddress ?? null,
          siCustomerId: values.siCustomerId ?? null,
          customerName: values.customerName ?? null,
          customerAddress: values.customerAddress ?? null,
          siInvoiceReceiveStatus: values.siInvoiceReceiveStatus ?? false,
          siInvoiceReceiveDate: values.siInvoiceReceiveDate ?? null,
        },
        stockInItemsData: values.items.map((item) => ({
          ...mapStockInItemToPayload(item),
          sidConfirmedUnitPrice: item.sidConfirmedUnitPrice ?? item.sidDeclaredUnitPrice,
        })),
        stockInBillData: {
          sibCalculatedAmount: values.sibCalculatedAmount,
          sibDiscountAmouunt: values.sibDiscountAmouunt,
          sibAdjustedAmount: values.sibAdjustedAmount,
          sibFinalAmount: values.sibFinalAmount,
          sibCurrencyName: values.sibCurrencyName,
        },
      }
      const response = await createMutation.mutateAsync(payload)
      if (response?.errMsg) {
        setServerError(response.errMsg)
        return
      }
      navigate('/stock-in')
    } catch (error) {
      setServerError(extractError(error))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/stock-in"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Stock-In Order</h1>
          <p className="mt-1 text-sm text-gray-500">
            Record inbound inventory from suppliers, customers, or internal transfers.
          </p>
        </div>
      </div>

      <StockInForm
        mode="standard"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitLabel="Create Stock-In Order"
        serverError={serverError}
      />
    </div>
  )
}
