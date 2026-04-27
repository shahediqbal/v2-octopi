import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCreateStockOut } from '@/hooks/useStockOut'
import { SalesOrderForm } from '@/pages/sales-orders/SalesOrderForm'
import { extractApiErrorMessage, extractApiResponseErrorMessage, mapFormValuesToMutationPayload } from '@/pages/sales-orders/stockOutMappers'
import type { StockOutFormValues } from '@/schemas/stockOutSchema'

export function CreateSalesOrderPage() {
  const navigate = useNavigate()
  const createMutation = useCreateStockOut()
  const [serverError, setServerError] = useState<string>()

  const handleSubmit = async (values: StockOutFormValues) => {
    setServerError(undefined)

    try {
      const response = await createMutation.mutateAsync(
        mapFormValuesToMutationPayload(values, undefined, { mode: 'standard', useLegacyStandardPricing: true }),
      )
      const responseError = extractApiResponseErrorMessage(response)
      if (responseError) {
        setServerError(responseError)
        return
      }
      navigate('/sales-orders')
    } catch (error) {
      setServerError(extractApiErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/sales-orders"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Sales Order</h1>
          <p className="mt-1 text-sm text-gray-500">Initial V2 stock-out creation flow using the new typed calculations and query invalidation model.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <SalesOrderForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          submitLabel="Create sales order"
          serverError={serverError}
        />
      </div>
    </div>
  )
}