import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lcPaymentSchema } from '@/schemas/lcTrackingSchema'
import type { LcPaymentFormValues } from '@/schemas/lcTrackingSchema'
import { useLcPaymentDetail, useUpdateLcPayment } from '@/hooks/useLcTracking'
import { useToastStore } from '@/stores/toastStore'
import { LC_PAYMENT_METHOD_ID } from '@/types/lcTracking'
import { LcPaymentForm } from './LcPaymentForm'

export function LcPaymentEditPage() {
  const { id } = useParams<{ id: string }>()
  const paymentId = Number(id)
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)
  const [serverError, setServerError] = useState('')

  const { data, isLoading, isError } = useLcPaymentDetail(paymentId)
  const updateMutation = useUpdateLcPayment()

  const form = useForm<LcPaymentFormValues>({
    resolver: zodResolver(lcPaymentSchema) as Resolver<LcPaymentFormValues>,
    defaultValues: {
      paymentCollectedBy: 0,
      paymentDate: '',
      paymentAmount: 0,
      lcAmountTransferAtBank: 0,
      lcAdjustmentAmount: 0,
      lcCollectionConversionRate: 0,
      paymentNote: '',
      isPaymentComplete: false,
    },
  })

  useEffect(() => {
    if (data) {
      form.reset({
        paymentCollectedBy: data.paymentCollectedBy ?? 0,
        paymentDate: data.paymentDate ?? '',
        paymentAmount: data.paymentAmount ?? 0,
        lcAmountTransferAtBank: data.lcAmountTransferAtBank ?? 0,
        lcAdjustmentAmount: data.lcAdjustmentAmount ?? 0,
        lcCollectionConversionRate: data.lcCollectionConversionRate ?? 0,
        paymentNote: data.paymentNote ?? '',
        isPaymentComplete: data.isPaymentComplete ?? false,
      })
    }
  }, [data, form])

  const onSubmit = (formData: LcPaymentFormValues) => {
    setServerError('')
    updateMutation.mutate(
      {
        paymentSystemId: paymentId,
        lcDocId: data?.lcDocId ?? 0,
        paymentMethodId: LC_PAYMENT_METHOD_ID,
        moenyRecepitNo: data?.moenyRecepitNo ?? '',
        paymentCollectedBy: formData.paymentCollectedBy,
        paymentCustomerId: data?.paymentCustomerId ?? 0,
        paymentDate: formData.paymentDate,
        paymentAmount: formData.paymentAmount,
        chequeAmount: null,
        lcAmountTransferAtBank: formData.lcAmountTransferAtBank,
        lcAdjustmentAmount: formData.lcAdjustmentAmount,
        lcCollectionConversionRate: formData.lcCollectionConversionRate,
        paymentNote: formData.paymentNote ?? '',
        isPaymentComplete: formData.isPaymentComplete,
        paymentRelatedJobId: null,
        paymentChequeId: null,
        paymentAdjustedAmount: null,
        modifiedBy: null,
        modifiedDate: null,
        chequeBeneficiaryBankId: null,
        chequeStatusId: null,
        chequeActionDate: null,
      },
      {
        onSuccess: (res) => {
          if (res.errMsg) setServerError(res.errMsg)
          else {
            showToast({ message: 'Payment updated successfully', type: 'success' })
            navigate('/lc/payment/edit-list')
          }
        },
        onError: (err) => setServerError((err as Error).message || 'Something went wrong'),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 text-red-500" />
          <p className="text-sm text-red-700">Failed to load payment details.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          to="/lc/payment/edit-list"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit LC Payment</h1>
          <p className="text-xs text-gray-500">Payment ID: {paymentId}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {serverError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <LcPaymentForm control={form.control} errors={form.formState.errors} />

          <div className="mt-8 flex items-center gap-3">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
            >
              {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
            <Link
              to="/lc/payment/edit-list"
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
