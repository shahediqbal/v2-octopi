import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lcDocUpdateSchema } from '@/schemas/lcTrackingSchema'
import type { LcDocUpdateFormValues } from '@/schemas/lcTrackingSchema'
import { useLcDetail, useUpdateLcDoc } from '@/hooks/useLcTracking'
import { useToastStore } from '@/stores/toastStore'

const INPUT =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
const LABEL = 'mb-1 block text-sm font-medium text-gray-700'
const ERR_MSG = 'mt-1 text-xs text-red-600'

export function UpdateLcDocPage() {
  const { id } = useParams<{ id: string }>()
  const lcDocId = Number(id)
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)
  const [serverError, setServerError] = useState('')

  const { data, isLoading, isError } = useLcDetail(lcDocId)
  const updateMutation = useUpdateLcDoc()

  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors },
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
        docPrepDate: data.docPrepDate ?? null,
        docSumbitDate: data.docSumbitDate ?? null,
        docCustomerAcceptedDate: data.docCustomerAcceptedDate ?? null,
        docBenificerySubmissionDate: data.docBenificerySubmissionDate ?? null,
        ibcNumber: data.ibcNumber ?? null,
        bankAcceptanceDate: data.bankAcceptanceDate ?? null,
        maturityDate: data.maturityDate ?? null,
        revisedMaturityDate: data.revisedMaturityDate ?? null,
      })
    }
  }, [data, reset])

  const onSubmit = (formData: LcDocUpdateFormValues) => {
    setServerError('')
    updateMutation.mutate(
      { lcDocId, ...formData },
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
          <p className="text-xs text-gray-500">LC #{data.lcNumber}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* ── Section 1: Document Preparation ──────────────────────── */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Stage 1 — Document Preparation
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Preparation Date</label>
              <input type="date" {...register('docPrepDate')} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Submission Date</label>
              <input type="date" {...register('docSumbitDate')} className={INPUT} />
            </div>
          </div>
        </div>

        {/* ── Section 2: Acceptance ─────────────────────────────────── */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Stage 2 — Acceptance</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Customer Accepted Date</label>
              <input type="date" {...register('docCustomerAcceptedDate')} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Beneficiary Submission Date</label>
              <input type="date" {...register('docBenificerySubmissionDate')} className={INPUT} />
            </div>
          </div>
        </div>

        {/* ── Section 3: Maturity ───────────────────────────────────── */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Stage 3 — Maturity</h2>
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

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
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
