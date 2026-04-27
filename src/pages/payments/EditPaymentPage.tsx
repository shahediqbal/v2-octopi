import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { PaymentForm, buildPaymentPayload } from './PaymentForm'
import { usePaymentDetail, useUpdatePayment } from '@/hooks/usePayments'
import { PAYMENT_TYPES } from '@/types/payment'
import type { PaymentType, PaymentDetail, UpdatePaymentPayload } from '@/types/payment'
import type { PaymentFormData } from '@/schemas/paymentSchema'
import { useState } from 'react'

// Reverse-engineer payment type from stored data
function determinePaymentReference(detail: PaymentDetail): PaymentType {
  const mid = detail.paymentMethodId
  if (mid === 9) return PAYMENT_TYPES.AIT
  if (mid === 10) return PAYMENT_TYPES.VAT
  if (mid === 11) return PAYMENT_TYPES.CREDIT_ADJUSTMENT
  if (mid === 12) return PAYMENT_TYPES.LC_PAYMENT
  if ([4, 7, 8].includes(mid)) return PAYMENT_TYPES.TRANSFER
  if (detail.paymentChequeId !== null) return PAYMENT_TYPES.CHEQUE
  if (detail.paymentRelatedJobId !== null) return PAYMENT_TYPES.INVOICE
  return PAYMENT_TYPES.OPEN
}

// Map PaymentDetail API response → PaymentFormData for the form
function mapDetailToFormData(detail: PaymentDetail): PaymentFormData {
  const ref = determinePaymentReference(detail)

  const isCheque = ref === PAYMENT_TYPES.CHEQUE
  const isInvoice = ref === PAYMENT_TYPES.INVOICE

  return {
    paymentReference: ref,
    customerId: detail.paymentCustomerId,
    employeeId: detail.paymentCollectedBy ?? (null as unknown as number),
    paymentDate: detail.paymentDate ? detail.paymentDate.slice(0, 10) : '',
    paymentModeId: [
      PAYMENT_TYPES.AIT,
      PAYMENT_TYPES.VAT,
      PAYMENT_TYPES.CREDIT_ADJUSTMENT,
      PAYMENT_TYPES.LC_PAYMENT,
    ].includes(ref as PaymentType)
      ? null
      : detail.paymentMethodId ?? null,
    invoiceChequeId: isInvoice
      ? (detail.paymentRelatedJobId ?? null)
      : isCheque
        ? (detail.paymentChequeId ?? null)
        : null,
    receiveAmount:
      isCheque
        ? (detail.chequeAmount ?? null)
        : (detail.paymentAmount ?? null),
    adjustedAmount: detail.paymentAdjustedAmount ?? null,
    moneyReceiptNo: detail.moenyRecepitNo ?? '',
    bankId: detail.chequeBeneficiaryBankId ?? null,
    chequeStatusId: detail.chequeStatusId ?? null,
    chequeActionDate: detail.chequeActionDate ? detail.chequeActionDate.slice(0, 10) : '',
    paymentNote: detail.paymentNote ?? '',
  }
}

export function EditPaymentPage() {
  const { id } = useParams<{ id: string }>()
  const numericId = id ? parseInt(id, 10) : undefined
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: detail, isLoading, isError } = usePaymentDetail(numericId)
  const updatePayment = useUpdatePayment()

  const defaultValues = useMemo(
    () => (detail ? mapDetailToFormData(detail) : undefined),
    [detail],
  )

  // Derive labels for pre-selected dropdowns
  const employeeLabel = detail
    ? [detail.empFirstName, detail.empLastName].filter(Boolean).join(' ') || detail.employeeCode || null
    : null
  const customerLabel = detail?.customerName ?? null

  const handleSubmit = (payload: ReturnType<typeof buildPaymentPayload>) => {
    setServerError(undefined)
    updatePayment.mutate(payload as UpdatePaymentPayload, {
      onSuccess: () => {
        navigate('/payments')
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Failed to update payment. Please try again.'
        setServerError(message)
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Loading payment…
        </div>
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load payment. Please go back and try again.
        </div>
        <Link
          to="/payments"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={14} />
          Back to Payments
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/payments"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={14} />
          Back to Payments
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Edit Payment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Payment #{detail.paymentSystemId}
          {detail.customerName ? ` — ${detail.customerName}` : ''}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <PaymentForm
          mode="edit"
          defaultValues={defaultValues}
          paymentId={detail.paymentSystemId}
          employeeLabel={employeeLabel}
          customerLabel={customerLabel}
          onSubmit={handleSubmit}
          isSubmitting={updatePayment.isPending}
          submitLabel={updatePayment.isPending ? 'Saving…' : 'Update Payment'}
          serverError={serverError}
        />
      </div>
    </div>
  )
}
