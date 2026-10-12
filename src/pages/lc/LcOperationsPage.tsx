import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, FileText } from 'lucide-react'
import { usePiByStatus } from '@/hooks/useLcTracking'

export function LcOperationsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: piList = [], isLoading, isError } = usePiByStatus(1)

  const filtered = piList.filter(
    (pi) =>
      pi.piNumber?.toLowerCase().includes(search.toLowerCase()) ||
      pi.customerName?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">LC Operations</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Proforma invoices ready for LC creation (status: Submitted)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Search by PI number or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={26} className="animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="flex items-start gap-3 p-6">
            <AlertCircle size={18} className="mt-0.5 text-red-500" />
            <p className="text-sm text-red-700">Failed to load submitted PIs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr style={{ backgroundColor: '#4a4a4a' }} className="text-xs uppercase text-white">
                  <th className="px-4 py-3 text-center font-bold">PI System Id</th>
                  <th className="px-4 py-3 text-center font-bold">PI Number</th>
                  <th className="px-4 py-3 text-center font-bold">PI Ref</th>
                  <th className="px-4 py-3 text-center font-bold">PI Date</th>
                  <th className="px-4 py-3 text-center font-bold">Customer Name</th>
                  <th className="px-4 py-3 text-center font-bold">Customer Address</th>
                  <th className="px-4 py-3 text-center font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={32} className="text-gray-300" />
                        <p>No submitted PIs awaiting LC creation.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((pi) => (
                    <tr key={pi.piSystemId} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 text-center text-gray-700">{pi.piSystemId}</td>
                      <td className="px-4 py-2.5 text-center font-medium text-gray-900">{pi.piNumber}</td>
                      <td className="px-4 py-2.5 text-center text-gray-600">{pi.piRef || '—'}</td>
                      <td className="px-4 py-2.5 text-center text-gray-600">
                        {pi.piDate ? new Date(pi.piDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center text-gray-700">{pi.customerName}</td>
                      <td className="px-4 py-2.5 text-center text-gray-600">{pi.customerAddress || '—'}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/lc/create?piId=${pi.piSystemId}`)}
                          className="inline-flex items-center gap-1.5 rounded bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-600"
                        >
                          Create LC
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
