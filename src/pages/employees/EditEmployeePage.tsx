import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, UserX } from 'lucide-react'
import {
  useEmployeeDetail,
  useUpdateEmployee,
  useDeactivateEmployee,
} from '@/hooks/useEmployees'
import { EmployeeForm } from './EmployeeForm'
import type { EmployeeFormData } from '@/schemas/employeeSchema'

export function EditEmployeePage() {
  const { id } = useParams<{ id: string }>()
  const employeeId = Number(id)
  const navigate = useNavigate()

  const { data: employee, isLoading, isError, error } = useEmployeeDetail(employeeId || undefined)
  const updateMutation = useUpdateEmployee()
  const deactivateMutation = useDeactivateEmployee()
  const [serverError, setServerError] = useState('')

  /* map API entity → form defaults */
  const formDefaults = useMemo<Partial<EmployeeFormData> | undefined>(() => {
    if (!employee) return undefined
    return {
      empFirstName: employee.empFirstName ?? '',
      empLastName: employee.empLastName ?? '',
      empPresentAddress: employee.empPresentAddress ?? '',
      empParmanentAddress: employee.empParmanentAddress ?? '',
      bloodGroup: employee.bloodGroup ?? '',
      dateOfJoining: employee.dateOfJoining
        ? employee.dateOfJoining.split('T')[0]
        : '',
      empContactNo: employee.empContactNo ?? '',
      guardianContactNo: employee.guardianContactNo ?? '',
      designationId: employee.designationId ?? 0,
      departmentId: employee.departmentId ?? 0,
      channelId: employee.channelId ?? 0,
      empTypeId: employee.empTypeId ?? 0,
    }
  }, [employee])

  const handleSubmit = (data: EmployeeFormData) => {
    setServerError('')

    updateMutation.mutate(
      {
        employeeId,
        employeeCode: employee?.employeeCode ?? '',
        empFirstName: data.empFirstName,
        empLastName: data.empLastName,
        empPresentAddress: data.empPresentAddress,
        empParmanentAddress: data.empParmanentAddress,
        bloodGroup: data.bloodGroup,
        dateOfJoining: data.dateOfJoining,
        empContactNo: data.empContactNo,
        guardianContactNo: data.guardianContactNo ?? '',
        designationId: data.designationId,
        departmentId: data.departmentId,
        channelId: data.channelId,
        empTypeId: data.empTypeId,
      },
      {
        onSuccess: (res) => {
          if (res.errMsg) {
            setServerError(res.errMsg)
          } else {
            navigate('/employees')
          }
        },
        onError: (err) => {
          setServerError((err as Error).message || 'Something went wrong')
        },
      },
    )
  }

  const handleDeactivate = () => {
    if (!employee?.employeeCode) return
    if (!window.confirm(`Deactivate "${employee.empFirstName} ${employee.empLastName}"? This cannot be undone.`)) return

    deactivateMutation.mutate(employee.employeeCode, {
      onSuccess: (res) => {
        if ((res as { errMsg?: string })?.errMsg) {
          setServerError((res as { errMsg: string }).errMsg)
        } else {
          navigate('/employees')
        }
      },
      onError: (err) => {
        setServerError((err as Error).message || 'Deactivation failed')
      },
    })
  }

  /* loading state */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading employee…</span>
      </div>
    )
  }

  /* error state */
  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800">Failed to load employee</p>
          <p className="text-xs text-red-600 mt-1">{(error as Error)?.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/employees"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Employee</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {employee?.empFirstName} {employee?.empLastName} — ID #{employeeId}
            </p>
          </div>
        </div>

        {/* Deactivate */}
        <button
          type="button"
          onClick={handleDeactivate}
          disabled={deactivateMutation.isPending || !employee?.employeeCode}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {deactivateMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <UserX size={16} />
          )}
          Deactivate
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <EmployeeForm
          defaultValues={formDefaults}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          submitLabel="Save Changes"
          serverError={serverError}
        />
      </div>
    </div>
  )
}
