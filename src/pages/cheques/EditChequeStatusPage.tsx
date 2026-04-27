import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChequeStatusContent } from './ChequeStatusContent'

export function EditChequeStatusPage() {
  const { id } = useParams<{ id: string }>()
  const chequeId = Number(id)
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/cheques" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Update Cheque Status</h1>
          <p className="mt-0.5 text-sm text-gray-500">Cheque #{chequeId}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ChequeStatusContent chequeId={chequeId} onSuccess={() => navigate('/cheques')} />
      </div>
    </div>
  )
}