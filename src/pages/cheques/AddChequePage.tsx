import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ChequeForm } from './ChequeForm'
import { buildChequePayload, extractApiErrorMessage, todayStr } from './chequePageUtils'
import type { ChequeFormData } from '@/schemas/chequeSchema'
import { useCreateCheque } from '@/hooks/useCheques'
import { useState } from 'react'

export function AddChequePage() {
  const navigate = useNavigate()
  const createMutation = useCreateCheque()
  const [serverError, setServerError] = useState('')

  const handleSubmit = (data: ChequeFormData) => {
    setServerError('')

    createMutation.mutate(buildChequePayload(data), {
      onSuccess: (response) => {
        if (response.errMsg) {
          setServerError(response.errMsg)
          return
        }

        navigate('/cheques')
      },
      onError: (error) => {
        setServerError(extractApiErrorMessage(error))
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/cheques" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Cheque</h1>
          <p className="mt-0.5 text-sm text-gray-500">Create a new cheque record</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ChequeForm
          defaultValues={{
            chequeCollectionDate: todayStr(),
            chequeDate: todayStr(),
            chequePlacementDate: todayStr(),
            chequeExpireDate: todayStr(),
            chequeActionDate: todayStr(),
            chequeStatusId: 1,
          }}
          showStatusFields={false}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          submitLabel="Create Cheque"
          serverError={serverError}
        />
      </div>
    </div>
  )
}