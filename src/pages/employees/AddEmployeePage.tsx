import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCreateEmployee } from '@/hooks/useEmployees'
import { EmployeeForm } from './EmployeeForm'
import type { EmployeeFormData } from '@/schemas/employeeSchema'

export function AddEmployeePage() {
  const navigate = useNavigate()
  const createMutation = useCreateEmployee()
  const [serverError, setServerError] = useState('')

  const handleSubmit = (data: EmployeeFormData) => {
    setServerError('')

    createMutation.mutate(
      {
        employeeCode: crypto.randomUUID(),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/employees"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Employee</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create a new employee record</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <EmployeeForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          submitLabel="Create Employee"
          serverError={serverError}
        />
      </div>
    </div>
  )
}
