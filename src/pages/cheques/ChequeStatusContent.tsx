import { useMemo, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { ChequeStatusForm } from './ChequeStatusForm'
import { buildChequePayload, extractApiErrorMessage } from './chequePageUtils'
import type { ChequeStatusFormData } from '@/schemas/chequeSchema'
import { useChequeDetail, useUpdateCheque } from '@/hooks/useCheques'

interface ChequeStatusContentProps {
  chequeId: number
  onSuccess?: () => void
  submitLabel?: string
}

export function ChequeStatusContent({
  chequeId,
  onSuccess,
  submitLabel = 'Update Status',
}: ChequeStatusContentProps) {
  const { data: cheque, isLoading, isError, error } = useChequeDetail(chequeId || undefined)
  const updateMutation = useUpdateCheque()
  const [serverError, setServerError] = useState('')

  const defaultValues = useMemo<Partial<ChequeStatusFormData> | undefined>(() => {
    if (!cheque) return undefined
    return {
      chequeStatusId: cheque.chequeStatusId ?? 1,
      chequeActionDate: cheque.chequeActionDate ?? '',
      chequeStatusRemarks: cheque.chequeStatusRemarks ?? '',
    }
  }, [cheque])

  const handleSubmit = (data: ChequeStatusFormData) => {
    if (!cheque) return
    setServerError('')

    updateMutation.mutate(
      buildChequePayload(
        {
          chequeCollectedBy: cheque.employeeId ?? null,
          chequeCollectionDate: cheque.chequeCollectionDate ?? '',
          chequeTypeId: cheque.chequeMethodInfoId ?? null,
          customerId: cheque.chequeCustomerId ?? null,
          chequeDate: cheque.chequeDate ?? '',
          chequePlacementDate: cheque.chequePlacementDate ?? '',
          chequeExpireDate: cheque.chequeExpireDate ?? '',
          chequeActionDate: data.chequeActionDate,
          chequeNumber: cheque.chequeNumber ?? '',
          chequeAmount: cheque.chequeAmount ?? 0,
          issuerBankId: cheque.chequeIssuerBankId ?? null,
          beneficiaryBankId: cheque.chequeBeneficiaryBankId ?? null,
          chequeStatusId: data.chequeStatusId,
          chequeStatusRemarks: data.chequeStatusRemarks ?? '',
        },
        { chequeInfoId: chequeId, existing: cheque },
      ),
      {
        onSuccess: (response) => {
          if (response.errMsg) {
            setServerError(response.errMsg)
            return
          }

          onSuccess?.()
        },
        onError: (submitError) => {
          setServerError(extractApiErrorMessage(submitError))
        },
      },
    )
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
    <ChequeStatusForm
      cheque={cheque}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isSubmitting={updateMutation.isPending}
      submitLabel={submitLabel}
      serverError={serverError}
    />
  )
}