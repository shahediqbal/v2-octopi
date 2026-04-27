import { useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChequeForm } from './ChequeForm'
import { buildChequePayload, extractApiErrorMessage } from './chequePageUtils'
import type { ChequeFormData } from '@/schemas/chequeSchema'
import { useChequeDetail, useUpdateCheque } from '@/hooks/useCheques'

export function EditChequePage() {
  const { id } = useParams<{ id: string }>()
  const chequeId = Number(id)
  const navigate = useNavigate()
  const { data: cheque, isLoading, isError, error } = useChequeDetail(chequeId || undefined)
  const updateMutation = useUpdateCheque()
  const [serverError, setServerError] = useState('')

  const formDefaults = useMemo<Partial<ChequeFormData> | undefined>(() => {
    if (!cheque) return undefined
    return {
      chequeCollectedBy: cheque.employeeId ?? null,
      chequeCollectionDate: cheque.chequeCollectionDate ?? '',
      chequeTypeId: cheque.chequeMethodInfoId ?? null,
      customerId: cheque.chequeCustomerId ?? null,
      chequeDate: cheque.chequeDate ?? '',
      chequePlacementDate: cheque.chequePlacementDate ?? '',
      chequeExpireDate: cheque.chequeExpireDate ?? '',
      chequeActionDate: cheque.chequeActionDate ?? '',
      chequeNumber: cheque.chequeNumber ?? '',
      chequeAmount: cheque.chequeAmount ?? 0,
      issuerBankId: cheque.chequeIssuerBankId ?? null,
      beneficiaryBankId: cheque.chequeBeneficiaryBankId ?? null,
      chequeStatusId: cheque.chequeStatusId ?? 1,
      chequeStatusRemarks: cheque.chequeStatusRemarks ?? '',
    }
  }, [cheque])

  const collectorLabel = useMemo(() => {
    if (!cheque) return null
    return [cheque.empFirstName, cheque.empLastName, cheque.employeeCode].filter(Boolean).join(' ').trim() || null
  }, [cheque])

  const handleSubmit = (data: ChequeFormData) => {
    setServerError('')

    updateMutation.mutate(buildChequePayload(data, { chequeInfoId: chequeId, existing: cheque }), {
      onSuccess: (response) => {
        if (response.errMsg) {
          setServerError(response.errMsg)
          return
        }

        navigate('/cheques')
      },
      onError: (submitError) => {
        setServerError(extractApiErrorMessage(submitError))
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading cheque…</span>
      </div>
    )
  }

  if (isError || !cheque) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-800">Failed to load cheque</p>
          <p className="mt-1 text-xs text-red-600">{(error as Error)?.message ?? 'Cheque not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/cheques" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Cheque</h1>
          <p className="mt-0.5 text-sm text-gray-500">Cheque #{cheque.chequeInfoId}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ChequeForm
          defaultValues={formDefaults}
          customerLabel={cheque.customerName}
          collectorLabel={collectorLabel}
          showStatusFields={false}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          submitLabel="Update Cheque"
          serverError={serverError}
        />
      </div>
    </div>
  )
}