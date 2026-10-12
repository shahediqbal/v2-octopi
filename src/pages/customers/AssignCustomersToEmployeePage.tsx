import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeftRight,
  Loader2,
  RefreshCw,
  Search,
  UserCheck,
  Users,
} from 'lucide-react'
import { useAssignmentEmployees, useCustomerAssignments, useUpdateCustomerAssignments } from '@/hooks/useCustomerAssignments'
import { useToastStore } from '@/stores/toastStore'
import { cn } from '@/lib/utils'
import type { Customer } from '@/types/customer'
import type { Employee } from '@/types/employee'
import type { CustomerEmployeeAssignmentPayload } from '@/types/customerAssignment'

export function AssignCustomersToEmployeePage() {
  const { data: employees = [], isLoading: employeesLoading, isError: employeesError, error: employeesErrorDetails } = useAssignmentEmployees()
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [unassignedSearch, setUnassignedSearch] = useState('')
  const [assignedSearch, setAssignedSearch] = useState('')
  const [selectedUnassignedIds, setSelectedUnassignedIds] = useState<number[]>([])
  const [selectedAssignedIds, setSelectedAssignedIds] = useState<number[]>([])
  const [localUnassigned, setLocalUnassigned] = useState<Customer[]>([])
  const [localAssigned, setLocalAssigned] = useState<Customer[]>([])
  const [originalAssigned, setOriginalAssigned] = useState<Customer[]>([])
  const [isDirty, setIsDirty] = useState(false)

  const { data: assignmentData, isLoading: assignmentsLoading, isError: assignmentsError, error: assignmentsErrorDetails, refetch } = useCustomerAssignments(selectedEmployeeId)
  const updateAssignments = useUpdateCustomerAssignments(selectedEmployeeId)
  const showToast = useToastStore((state) => state.showToast)

  useEffect(() => {
    if (!assignmentData) return
    setLocalUnassigned(assignmentData.unAssignedCustomers)
    setLocalAssigned(assignmentData.assignedCustomers)
    setOriginalAssigned(assignmentData.assignedCustomers)
    setSelectedUnassignedIds([])
    setSelectedAssignedIds([])
    setUnassignedSearch('')
    setAssignedSearch('')
    setIsDirty(false)
  }, [assignmentData])

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees
    const query = employeeSearch.toLowerCase()
    return employees.filter((employee) => getEmployeeLabel(employee).toLowerCase().includes(query))
  }, [employeeSearch, employees])

  const filteredUnassigned = useMemo(() => filterCustomers(localUnassigned, unassignedSearch), [localUnassigned, unassignedSearch])
  const filteredAssigned = useMemo(() => filterCustomers(localAssigned, assignedSearch), [localAssigned, assignedSearch])

  const handleAssign = () => {
    if (selectedUnassignedIds.length === 0) {
      showToast({ message: 'Please select customers to assign', type: 'error' })
      return
    }

    const toMove = localUnassigned.filter((customer) => selectedUnassignedIds.includes(customer.customerId))
    setLocalAssigned((previous) => sortCustomers([...previous, ...toMove]))
    setLocalUnassigned((previous) => previous.filter((customer) => !selectedUnassignedIds.includes(customer.customerId)))
    setSelectedUnassignedIds([])
    setIsDirty(true)
  }

  const handleRemove = () => {
    if (selectedAssignedIds.length === 0) {
      showToast({ message: 'Please select assigned customers to remove', type: 'error' })
      return
    }

    const toMove = localAssigned.filter((customer) => selectedAssignedIds.includes(customer.customerId))
    setLocalUnassigned((previous) => sortCustomers([...previous, ...toMove]))
    setLocalAssigned((previous) => previous.filter((customer) => !selectedAssignedIds.includes(customer.customerId)))
    setSelectedAssignedIds([])
    setIsDirty(true)
  }

  const handleReset = () => {
    if (!assignmentData) return
    setLocalUnassigned(assignmentData.unAssignedCustomers)
    setLocalAssigned(assignmentData.assignedCustomers)
    setOriginalAssigned(assignmentData.assignedCustomers)
    setSelectedUnassignedIds([])
    setSelectedAssignedIds([])
    setIsDirty(false)
  }

  const handleUpdate = () => {
    if (selectedEmployeeId === null) {
      showToast({ message: 'Please select an employee first', type: 'error' })
      return
    }

    if (!isDirty) {
      showToast({ message: 'No changes detected', type: 'error' })
      return
    }

    const payload = buildAssignmentPayload(selectedEmployeeId, localAssigned, originalAssigned)

    updateAssignments.mutate(payload, {
      onSuccess: (response) => {
        if (response.errMsg) {
          showToast({ message: response.errMsg, type: 'error' })
          return
        }
        showToast({ message: 'Assignments updated successfully', type: 'success' })
        refetch()
      },
      onError: (updateError) => {
        showToast({ message: (updateError as Error)?.message || 'Failed to update assignments', type: 'error' })
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assign Customers to Employee</h1>
        <p className="mt-1 text-sm text-gray-500">Select one employee, stage customer moves between lists, then save the assignment changes.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr_1fr]">
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <PanelHeader title="Employees" count={filteredEmployees.length} />
          <div className="border-b border-gray-100 px-4 py-3">
            <SearchInput value={employeeSearch} onChange={setEmployeeSearch} placeholder="Search employee..." />
          </div>
          <div className="max-h-[620px] overflow-y-auto">
            {employeesLoading ? (
              <LoadingState message="Loading employees..." />
            ) : employeesError ? (
              <ErrorState message={(employeesErrorDetails as Error)?.message || 'Failed to load employees'} />
            ) : filteredEmployees.length === 0 ? (
              <EmptyState icon={Users} message="No employees found" />
            ) : (
              filteredEmployees.map((employee) => {
                const active = employee.employeeId === selectedEmployeeId
                return (
                  <button
                    key={employee.employeeId}
                    type="button"
                    onClick={() => setSelectedEmployeeId(employee.employeeId)}
                    className={cn(
                      'flex w-full items-start justify-between border-b border-gray-50 px-4 py-3 text-left transition-colors last:border-0',
                      active ? 'bg-gray-100' : 'hover:bg-gray-50',
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{getEmployeeLabel(employee)}</p>
                      <p className="mt-1 text-xs text-gray-500">Code: {employee.employeeCode || '—'}</p>
                    </div>
                    {active && <UserCheck size={16} className="mt-0.5 text-gray-700" />}
                  </button>
                )
              })
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm">
          <PanelHeader
            title="Unassigned Customers"
            count={filteredUnassigned.length}
            actions={
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!isDirty}
                  className="action-report inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={13} /> Reset
                </button>
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={selectedUnassignedIds.length === 0}
                  className="action-select inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeftRight size={13} /> Assign
                </button>
              </div>
            }
          />
          <div className="border-b border-gray-100 px-4 py-3">
            <SearchInput
              value={unassignedSearch}
              onChange={setUnassignedSearch}
              placeholder="Search unassigned customers..."
              disabled={!selectedEmployeeId}
            />
          </div>
          {selectedEmployeeId === null ? (
            <EmptyState icon={UserCheck} message="Select an employee to load customers" />
          ) : assignmentsLoading ? (
            <LoadingState message="Loading customers..." />
          ) : assignmentsError ? (
            <ErrorState message={(assignmentsErrorDetails as Error)?.message || 'Failed to load customer assignments'} />
          ) : (
            <CustomerList
              customers={filteredUnassigned}
              selectedIds={selectedUnassignedIds}
              onToggle={(customerId) => toggleSelection(customerId, setSelectedUnassignedIds)}
              emptyMessage="No unassigned customers found"
            />
          )}
        </section>

        <section className="min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm">
          <PanelHeader
            title="Assigned Customers"
            count={filteredAssigned.length}
            actions={
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={selectedAssignedIds.length === 0}
                  className="action-delete inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeftRight size={13} /> Remove
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={updateAssignments.isPending || !selectedEmployeeId}
                  className="action-update inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updateAssignments.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  Save
                </button>
              </div>
            }
          />
          <div className="border-b border-gray-100 px-4 py-3">
            <SearchInput
              value={assignedSearch}
              onChange={setAssignedSearch}
              placeholder="Search assigned customers..."
              disabled={!selectedEmployeeId}
            />
          </div>
          {selectedEmployeeId === null ? (
            <EmptyState icon={Users} message="Assigned customers will appear here" />
          ) : assignmentsLoading ? (
            <LoadingState message="Loading assignments..." />
          ) : assignmentsError ? (
            <ErrorState message={(assignmentsErrorDetails as Error)?.message || 'Failed to load assigned customers'} />
          ) : (
            <CustomerList
              customers={filteredAssigned}
              selectedIds={selectedAssignedIds}
              onToggle={(customerId) => toggleSelection(customerId, setSelectedAssignedIds)}
              emptyMessage="No assigned customers found"
            />
          )}
        </section>
      </div>
    </div>
  )
}

function PanelHeader({
  title,
  count,
  actions,
}: {
  title: string
  count: number
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{count}</span>
      </div>
      {actions}
    </div>
  )
}

function SearchInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  )
}

function CustomerList({
  customers,
  selectedIds,
  onToggle,
  emptyMessage,
}: {
  customers: Customer[]
  selectedIds: number[]
  onToggle: (customerId: number) => void
  emptyMessage: string
}) {
  if (customers.length === 0) {
    return <EmptyState icon={Users} message={emptyMessage} compact />
  }

  return (
    <div className="max-h-[520px] overflow-y-auto">
      {customers.map((customer) => {
        const checked = selectedIds.includes(customer.customerId)
        return (
          <label
            key={customer.customerId}
            className={cn(
              'flex cursor-pointer items-start gap-3 border-b border-gray-50 px-4 py-3 transition-colors last:border-0',
              checked ? 'bg-gray-50' : 'hover:bg-gray-50/60',
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(customer.customerId)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-300"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{customer.customerName}</p>
              <p className="mt-1 truncate text-xs text-gray-500">{customer.customerAddress || 'No address provided'}</p>
            </div>
          </label>
        )
      })}
    </div>
  )
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-gray-500">
      <Loader2 size={18} className="animate-spin" />
      {message}
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-6 text-sm text-red-700">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  message,
  compact = false,
}: {
  icon: typeof Users
  message: string
  compact?: boolean
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-4 text-center text-gray-400', compact ? 'py-10' : 'py-16')}>
      <Icon size={22} className="text-gray-300" />
      <span className="text-sm">{message}</span>
    </div>
  )
}

function toggleSelection(customerId: number, setSelection: React.Dispatch<React.SetStateAction<number[]>>) {
  setSelection((previous) =>
    previous.includes(customerId)
      ? previous.filter((id) => id !== customerId)
      : [...previous, customerId],
  )
}

function getEmployeeLabel(employee: Employee) {
  const fullName = employee.empName ?? [employee.empFirstName, employee.empLastName].filter(Boolean).join(' ').trim()
  return fullName || employee.employeeCode || `Employee #${employee.employeeId}`
}

function filterCustomers(customers: Customer[], query: string) {
  if (!query.trim()) return customers
  const normalized = query.toLowerCase()
  return customers.filter((customer) =>
    [customer.customerName, customer.customerAddress ?? '', customer.contactPersonName ?? '', customer.contactNumber ?? '']
      .join(' ')
      .toLowerCase()
      .includes(normalized),
  )
}

function sortCustomers(customers: Customer[]) {
  return [...customers].sort((left, right) => left.customerName.localeCompare(right.customerName))
}

function buildAssignmentPayload(
  employeeId: number,
  localAssigned: Customer[],
  originalAssigned: Customer[],
): CustomerEmployeeAssignmentPayload[] {
  const assignedIds = new Set(localAssigned.map((customer) => customer.customerId))

  const assignedPayload = localAssigned.map((customer) => ({
    customerId: customer.customerId,
    employeeId,
  }))

  const unassignedPayload = originalAssigned
    .filter((customer) => !assignedIds.has(customer.customerId))
    .map((customer) => ({
      customerId: customer.customerId,
      employeeId: 0,
    }))

  return [...assignedPayload, ...unassignedPayload]
}