export interface Employee {
  employeeId: number
  employeeCode: string | null
  empName: string | null
  empFirstName: string | null
  empLastName: string | null
  empPresentAddress: string | null
  empParmanentAddress: string | null
  dateOfJoining: string | null
  empContactNo: string | null
  guardianContactNo: string | null
  designationId: number | null
  designation: string | null
  departmentId: number | null
  departmentName: string | null
  channelId: number | null
  channelName: string | null
  bloodGroup: string | null
  empTypeId: number | null
}

export interface EmployeeType {
  empTypeId: number
  employeeTypeName: string
}

export interface CreateEmployeePayload {
  employeeCode: string
  empFirstName: string
  empLastName: string
  empPresentAddress: string
  empParmanentAddress: string
  bloodGroup: string
  dateOfJoining: string
  empContactNo: string
  guardianContactNo: string
  designationId: number
  departmentId: number
  channelId: number
  empTypeId: number
}

export interface UpdateEmployeePayload extends CreateEmployeePayload {
  employeeId: number
}

export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}