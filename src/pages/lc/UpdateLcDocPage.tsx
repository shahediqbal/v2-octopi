import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lcDocUpdateSchema } from '@/schemas/lcTrackingSchema'
import type { LcDocUpdateFormValues } from '@/schemas/lcTrackingSchema'
import { useLcDetail, useUpdateLcDoc } from '@/hooks/useLcTracking'
import { useToastStore } from '@/stores/toastStore'

const INPUT =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
const LABEL = 'mb-1 block text-sm font-medium text-gray-700'

// Format ISO date string to yyyy-MM-dd for <input type="date">
function toDateInput(val: string | null | undefined): string {
  if (!val) return ''
  return val.split('T')[0]
}

export function UpdateLcDocPage() {
  const { id } = useParams<{ id: string }>()
  const lcDocId = Number(id)
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)
  const [serverError, setServerError] = useState('')

  const { data, isLoading, isError } = useLcDetail(lcDocId)
  const updateMutation = useUpdateLcDoc()

  // Conditional stage visibility — same logic as legacy:
  // Part-2 visible when Part-1 (docPrepDate + docSumbitDate) are saved
  // Part-3 visible when Part-2 (docBenificerySubmissionDate + docCustomerAcceptedDate) are saved
  const part2Visible = !!(data?.docPrepDate && data?.docSumbitDate)
  const part3Visible = !!(data?.docBenificerySubmissionDate && data?.docCustomerAcceptedDate)

  const {
    handleSubmit,
    reset,
    register,
  } = useForm<LcDocUpdateFormValues>({
    resolver: zodResolver(lcDocUpdateSchema),
    defaultValues: {
      docPrepDate: null,
      docSumbitDate: null,
      docCustomerAcceptedDate: null,
      docBenificerySubmissionDate: null,
      ibcNumber: null,
      bankAcceptanceDate: null,
      maturityDate: null,
      revisedMaturityDate: null,
    },
  })

  useEffect(() => {
    if (data) {
      reset({
        docPrepDate: toDateInput(data.docPrepDate) || null,
        docSumbitDate: toDateInput(data.docSumbitDate) || null,
        docCustomerAcceptedDate: toDateInput(data.docCustomerAcceptedDate) || null,
        docBenificerySubmissionDate: toDateInput(data.docBenificerySubmissionDate) || null,
        ibcNumber: data.ibcNumber ?? null,
        bankAcceptanceDate: toDateInput(data.bankAcceptanceDate) || null,
        maturityDate: toDateInput(data.maturityDate) || null,
        revisedMaturityDate: toDateInput(data.revisedMaturityDate) || null,
      })
    }
  }, [data, reset])

  const onSubmit = (formData: LcDocUpdateFormValues) => {
    setServerError('')
    const { ibcNumber, ...rest } = formData
    updateMutation.mutate(
      { lcDocId, piSystemId: data.piSystemId, lcIbcNumber: ibcNumber, ...rest },
      {
        onSuccess: (res) => {
          if (res.errMsg) setServerError(res.errMsg)
          else {
            showToast({ message: 'LC document updated successfully', type: 'success' })
            navigate('/lc/documents')
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
          <p className="text-sm text-red-700">Failed to load LC document.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          to="/lc/documents"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Update LC Document</h1>
        </div>
      </div>

      {/* ── Document Information (matches legacy header box) ── */}
      <div className="rounded-xl border border-gray-300 bg-gray-50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Document Information</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <div>
            <span className="font-medium text-gray-600">LC Document ID: </span>
            <span className="text-gray-900">{lcDocId}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Customer Name: </span>
            <span className="text-gray-900">{data.customerName || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">PI System ID: </span>
            <span className="text-gray-900">{data.piSystemId}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">LC Number: </span>
            <span className="text-gray-900">{data.lcNumber}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">LC Date: </span>
            <span className="text-gray-900">
              {data.lcDate ? new Date(data.lcDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* ── Part-1: Document Preparation (always visible) ── */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Part-1 Fields</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Document Preparation Date</label>
              <input type="date" {...register('docPrepDate')} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Document Submission Date</label>
              <input type="date" {...register('docSumbitDate')} className={INPUT} />
            </div>
          </div>
        </div>

        {/* ── Part-2: Acceptance — only when Part-1 is saved ── */}
        {part2Visible && (
          <div className="mb-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Part-2 Fields</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Customer Document Receive Date</label>
                <input type="date" {...register('docCustomerAcceptedDate')} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Beneficiary Submission Date</label>
                <input type="date" {...register('docBenificerySubmissionDate')} className={INPUT} />
              </div>
            </div>
          </div>
        )}

        {/* ── Part-3: Maturity — only when Part-2 is saved ── */}
        {part3Visible && (
          <div className="mb-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Part-3 Fields</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>IBC Number</label>
                <input {...register('ibcNumber')} className={INPUT} placeholder="Enter IBC number" />
              </div>
              <div>
                <label className={LABEL}>Bank Acceptance Date</label>
                <input type="date" {...register('bankAcceptanceDate')} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Maturity Date</label>
                <input type="date" {...register('maturityDate')} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Revised Maturity Date</label>
                <input type="date" {...register('revisedMaturityDate')} className={INPUT} />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="action-update inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
          >
            {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Save Changes
          </button>
          <Link
            to="/lc/documents"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
