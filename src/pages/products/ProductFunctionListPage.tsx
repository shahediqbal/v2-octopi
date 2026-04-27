import { useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, Loader2, Pencil, Plus, Search, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProductFunctionsList } from '@/hooks/useProductFunctions'

export function ProductFunctionListPage() {
  const [search, setSearch] = useState('')
  const { data: functions = [], isLoading, isError, error } = useProductFunctionsList()

  const filteredFunctions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return functions
    return functions.filter((item) => item.functionName.toLowerCase().includes(query))
  }, [functions, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/products" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Functions</h1>
            <p className="mt-1 text-sm text-gray-500">{functions.length} total function(s)</p>
          </div>
        </div>

        <Link to="/products/functions/add" className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700">
          <Plus size={16} /> Add Function
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search function names…"
          className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading product functions…</span>
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load product functions</p>
            <p className="mt-1 text-xs text-red-600">{(error as Error)?.message}</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Function Name</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredFunctions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Workflow size={24} className="text-gray-300" />
                        <span>{search ? 'No matching functions found.' : 'No product functions yet.'}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFunctions.map((item) => (
                    <tr key={item.functionId} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-gray-500">{item.functionId}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{item.functionName}</td>
                      <td className="px-5 py-3 text-center">
                        <Link
                          to={`/products/functions/${item.functionId}/edit`}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <Pencil size={12} /> Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}