import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2, Pencil, Plus, Search, UserX } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { usePaginatedEmployees, useDeactivateEmployee } from '@/hooks/useEmployees'
import type { Employee } from '@/types/employee'

function formatEmployeeName(employee: Employee) {
  return employee.empName
    ?? [employee.empFirstName, employee.empLastName].filter(Boolean).join(' ').trim()
    ?? '—'
}

export function EmployeeListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const deactivateMutation = useDeactivateEmployee()

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePaginatedEmployees(debouncedSearch)

  const employees = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  )
  const totalRecords = data?.pages[0]?.totalRecords ?? 0

  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (isFetchingNextPage) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      })
      if (node) observerRef.current.observe(node)
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  )

  const handleDeactivate = (employee: Employee) => {
    if (!employee.employeeCode) return
    if (!window.confirm(`Deactivate "${[employee.empFirstName, employee.empLastName].filter(Boolean).join(' ')}"?`)) return
    deactivateMutation.mutate(employee.employeeCode)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalRecords > 0 ? `${totalRecords} total employees` : isLoading ? 'Loading…' : 'No employees'}
          </p>
        </div>
        <Link
          to="/employees/add"
          className="action-insert inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
        >
          <Plus size={16} />
          Add New
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by code, name, phone, or address…"
          className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading employees…</span>
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load employees</p>
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
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Present Address</th>
                  <th className="px-5 py-3">Permanent Address</th>
                  <th className="px-5 py-3">Joining Date</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-gray-400">
                      {search ? 'No matching employees found.' : 'No employees yet.'}
                    </td>
                  </tr>
                ) : (
                  employees.map((employee, index) => (
                    <tr
                      key={employee.employeeId}
                      ref={index === employees.length - 1 ? sentinelRef : undefined}
                      className="transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-5 py-3 text-gray-500">{employee.employeeId}</td>
                      <td className="px-5 py-3 text-gray-700">{employee.employeeCode ?? '—'}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{formatEmployeeName(employee)}</td>
                      <td className="px-5 py-3 text-gray-700">{employee.empContactNo ?? '—'}</td>
                      <td className="max-w-[220px] truncate px-5 py-3 text-gray-600">{employee.empPresentAddress ?? '—'}</td>
                      <td className="max-w-[220px] truncate px-5 py-3 text-gray-600">{employee.empParmanentAddress ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{employee.dateOfJoining ? employee.dateOfJoining.split('T')[0] : '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{employee.departmentName ?? employee.departmentId ?? '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/employees/${employee.employeeId}/edit`)}
                            className="action-update inline-flex items-center justify-center rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeactivate(employee)}
                            disabled={!employee.employeeCode || deactivateMutation.isPending}
                            className="action-delete inline-flex items-center justify-center rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Deactivate"
                          >
                            <UserX size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={20} className="animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading more…</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}