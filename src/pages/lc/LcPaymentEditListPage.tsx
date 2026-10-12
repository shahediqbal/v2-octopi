import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, Loader2, AlertCircle, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLcPaymentEditList } from '@/hooks/useLcTracking'
import { PaginatedCombobox } from '@/components/dropdowns/PaginatedCombobox'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { LcPaymentListFilters } from '@/types/lcTracking'

const formatDateLocal = (d: Date) => d.toISOString().split('T')[0]
const getDefaultDates = () => {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 7)
  return { startDate: formatDateLocal(start), endDate: formatDateLocal(today) }
}

const filterSchema = z.object({
  customerId: z.number().nullable().default(null),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
})
type FilterValues = z.infer<typeof filterSchema>

const INPUT =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 h-9'
const LABEL = 'mb-1 block text-sm font-medium text-gray-700'
const TH = 'px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap'

const PAGE_SIZE_OPTIONS = [25, 50, 100]

export function LcPaymentEditListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<LcPaymentListFilters>({})
  const [searched, setSearched] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const { data: paymentList = [], isLoading, isError } = useLcPaymentEditList(filters, searched)

  const defaults = getDefaultDates()
  const { control, handleSubmit, register } = useForm<FilterValues>({
    resolver: zodResolver(filterSchema) as Resolver<FilterValues>,
    defaultValues: { customerId: null, startDate: defaults.startDate, endDate: defaults.endDate },
  })

  const onSearch = (data: FilterValues) => {
    setFilters({
      customerId: data.customerId ?? undefined,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
    })
    setSearched(true)
    setPage(0)
  }

  const total = paymentList.length
  const pageCount = Math.ceil(total / rowsPerPage)
  const start = page * rowsPerPage
  const pageRows = paymentList.slice(start, start + rowsPerPage)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">LC Payments</h1>
        <p className="mt-0.5 text-sm text-gray-500">Search and Manage LC Payments</p>
      </div>

      {/* Filter form */}
      <div
        className="rounded-lg border p-5"
        style={{ backgroundColor: '#f8f9fa', borderColor: '#c8e6c9', boxShadow: '0 2px 8px rgba(46,125,50,0.1)' }}
      >
        <form onSubmit={handleSubmit(onSearch)} noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className={LABEL}>Start Date</label>
              <input type="date" {...register('startDate')} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>End Date</label>
              <input type="date" {...register('endDate')} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Customer Name</label>
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
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60 h-9"
                style={{ backgroundColor: '#2E7D32' }}
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                {isLoading ? 'Searching...' : 'Search LC Payments'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {searched && (
        <>
          {!isLoading && !isError && paymentList.length > 0 && (
            <div
              className="rounded-md px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}
            >
              Found {paymentList.length} LC payment(s)
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={26} className="animate-spin text-gray-400" />
              </div>
            ) : isError ? (
              <div className="flex items-start gap-3 p-6">
                <AlertCircle size={18} className="mt-0.5 text-red-500" />
                <p className="text-sm text-red-700">Failed to load payment list.</p>
              </div>
            ) : paymentList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-base font-semibold text-gray-500">No LC Payments Found</p>
                <p className="mt-1 text-sm text-gray-400">Try adjusting your search criteria or date range</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: '#2E7D32' }}>
                        <th className={TH}>ID</th>
                        <th className={TH}>Actions</th>
                        <th className={TH}>Payment Date</th>
                        <th className={TH}>Customer Name</th>
                        <th className={TH}>Received Amount</th>
                        <th className={TH}>PI Number</th>
                        <th className={TH}>LC Number</th>
                        <th className={TH}>LC Amount</th>
                        <th className={TH}>LC Date</th>
                        <th className={TH}>Payment Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pageRows.map((payment) => (
                        <tr
                          key={payment.paymentSystemId}
                          className="cursor-pointer hover:bg-green-50"
                          onClick={() => navigate(`/lc/payment/${payment.paymentSystemId}/edit`)}
                        >
                          <td className="px-3 py-3 text-center font-semibold" style={{ color: '#1B5E20' }}>
                            {payment.paymentSystemId}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/lc/payment/${payment.paymentSystemId}/edit`)
                              }}
                              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90"
                              style={{ backgroundColor: '#1976d2' }}
                            >
                              <Pencil size={11} /> Edit
                            </button>
                          </td>
                          <td className="px-3 py-3 text-center text-gray-600" style={{ color: '#1B5E20' }}>
                            {payment.paymentDate ? formatDate(payment.paymentDate) : '—'}
                          </td>
                          <td className="px-3 py-3 text-center" style={{ color: '#1B5E20' }}>
                            {payment.customerName ?? '—'}
                          </td>
                          <td className="px-3 py-3 text-center font-medium" style={{ color: '#1B5E20' }}>
                            {formatCurrency(payment.paymentAmount ?? 0)}
                          </td>
                          <td className="px-3 py-3 text-center" style={{ color: '#1B5E20' }}>
                            {payment.piNumber || '—'}
                          </td>
                          <td className="px-3 py-3 text-center" style={{ color: '#1B5E20' }}>
                            {payment.lcNumber || '—'}
                          </td>
                          <td className="px-3 py-3 text-center font-medium" style={{ color: '#1B5E20' }}>
                            {formatCurrency(payment.lcAmount ?? 0)}
                          </td>
                          <td className="px-3 py-3 text-center" style={{ color: '#1B5E20' }}>
                            {payment.lcDate ? formatDate(payment.lcDate) : '—'}
                          </td>
                          <td className="px-3 py-3 text-center" style={{ color: '#1B5E20' }}>
                            {payment.paymentMethodName || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div
                  className="flex items-center justify-end gap-6 border-t px-4 py-3 text-sm"
                  style={{ backgroundColor: '#E8F5E9', borderColor: '#c8e6c9', color: '#2E7D32' }}
                >
                  <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0) }}
                      className="rounded border px-1 py-0.5 text-sm focus:outline-none"
                      style={{ borderColor: '#c8e6c9' }}
                    >
                      {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <span>{start + 1}–{Math.min(start + rowsPerPage, total)} of {total}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="rounded p-1 hover:bg-green-100 disabled:opacity-30"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                      disabled={page >= pageCount - 1}
                      className="rounded p-1 hover:bg-green-100 disabled:opacity-30"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

