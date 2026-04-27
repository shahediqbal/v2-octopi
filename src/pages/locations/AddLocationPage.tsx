import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { LocationForm } from './LocationForm'
import type { LocationFormData } from '@/schemas/locationSchema'
import { useCreateLocation } from '@/hooks/useLocations'
import { useToastStore } from '@/stores/toastStore'

function extractErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'body' in error) {
    const body = (error as { body?: { errMsg?: string; message?: string } }).body
    if (body?.errMsg) return body.errMsg
    if (body?.message) return body.message
  }
  return (error as Error)?.message || 'Something went wrong'
}

export function AddLocationPage() {
  const navigate = useNavigate()
  const createMutation = useCreateLocation()
  const [serverError, setServerError] = useState('')
  const showToast = useToastStore((state) => state.showToast)

  const handleSubmit = (data: LocationFormData) => {
    setServerError('')

    createMutation.mutate(
      {
        locationId: 0,
        locationName: data.locationName,
      },
      {
        onSuccess: (response) => {
          if (response.errMsg) {
            setServerError(response.errMsg)
            showToast({ message: response.errMsg, type: 'error' })
          } else {
            showToast({ message: 'Location created successfully', type: 'success' })
            navigate('/locations')
          }
        },
        onError: (error) => {
          const message = extractErrorMessage(error)
          setServerError(message)
          showToast({ message, type: 'error' })
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/locations" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Location</h1>
          <p className="mt-0.5 text-sm text-gray-500">Create a new location record</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <LocationForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          submitLabel="Create Location"
          serverError={serverError}
        />
      </div>
    </div>
  )
}