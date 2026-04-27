import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, Loader2, AlertCircle, Pencil } from 'lucide-react'
import { useLcEditList } from '@/hooks/useLcTracking'
import { PaginatedCombobox } from '@/components/dropdowns/PaginatedCombobox'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { LcEditListFilters } from '@/types/lcTracking'

const filterSchema = z.object({
  customerId: z.number().nullable().default(null),
  fromDate: z.string().default(''),
  toDate: z.string().default(''),
})
type FilterValues = z.infer<typeof filterSchema>

const INPUT =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
const LABEL = 'mb-1 block text-sm font-medium text-gray-700'

export function LcEditListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<LcEditListFilters>({})
  const [searched, setSearched] = useState(false)

  const { data: lcList = [], isLoading, isError } = useLcEditList(filters, searched)

  const { control, handleSubmit, register } = useForm<FilterValues>({
    resolver: zodResolver(filterSchema) as Resolver<FilterValues>,
    defaultValues: { customerId: null, fromDate: '', toDate: '' },
  })

  const onSearch = (data: FilterValues) => {
    setFilters({
      customerId: data.customerId ?? undefined,
      fromDate: data.fromDate || undefined,
      toDate: data.toDate || undefined,
    })
    setSearched(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">LC Edit List</h1>
        <p className="mt-0.5 text-sm text-gray-500">Search and edit existing LC documents</p>
      </div>

      {/* Filter form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSearch)} noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={LABEL}>Customer</label>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <PaginatedCombobox
                    type="customer"
                    value={field.value}
                    onValueChange={(v) => field.onChange(v ?? null)}
                    placeholder="All customers"
                  />
                )}
              />
            </div>
            <div>
              <label className={LABEL}>From Date</label>
              <input type="date" {...register('fromDate')} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>To Date</label>
              <input type="date" {...register('toDate')} className={INPUT} />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
            >
              <Search size={14} /> Search
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {searched && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={26} className="animate-spin text-gray-400" />
            </div>
          ) : isError ? (
            <div className="flex items-start gap-3 p-6">
              <AlertCircle size={18} className="mt-0.5 text-red-500" />
              <p className="text-sm text-red-700">Failed to load LC list.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-3 text-left">LC Number</th>
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-left">LC Date</th>
                    <th className="px-5 py-3 text-right">LC Amount</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lcList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                        No LCs found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    lcList.map((lc) => (
                      <tr key={lc.lcDocId} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 font-medium text-gray-900">{lc.lcNumber}</td>
                        <td className="px-5 py-3 text-gray-700">{lc.customerName}</td>
                        <td className="px-5 py-3 text-gray-500">
                          {lc.lcDate ? formatDate(lc.lcDate) : '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(lc.lcAmount ?? 0)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/lc/${lc.lcDocId}/limited-update`)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <Pencil size={12} /> Edit
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
      )}
    </div>
  )
}
