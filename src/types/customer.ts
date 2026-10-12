/* ─── Customer entity types ─── */

/** Shape returned by GET /Customer/GetCustomerDetails */
export interface Customer {
  customerId: number
  customerName: string
  customerFlag: 0 | 1
  customerAddress: string | null
  locationId: number | null
  contactPersonName: string | null
  contactNumber: string | null
  designationId: number | null
  designation: string | null
  channelId: number | null
  channelName: string | null
  employeeId: number | null
  empFirstName: string | null
  empLastName: string | null
  employeeCode: string | null
  customerLat: number | null
  customerLong: number | null
  paymentInterval: string | null
  paymentCycleType: string | null
  paymentCycleValue: number | null
  paymentMode: string | null
  currentStatus: string | null
  specialNote: string | null
  disputeAmount: number | null
  linkCustomerId: number | null
  linkCustomerName: string | null
}

/** Payload for POST /Customer/AddCustomer */
export interface CreateCustomerPayload {
  customerName: string
  customerAddress: string
  locationId: number | null
  contactPersonName: string | null
  contactNumber: string | null
  designationId: number | null
  channelId: number | null
  employeeId: number | null
  customerLat: number | null
  customerLong: number | null
  paymentInterval: string
  paymentCycleType: string
  paymentCycleValue: number | null
  paymentMode: string
  currentStatus: string
  linkCustomerId: number | null
  specialNote: string
  disputeAmount: number
}

/** Payload for PUT /Customer/CustomerUpdate */
export interface UpdateCustomerPayload extends CreateCustomerPayload {
  customerId: number
}

/** Wrapper returned by the legacy API */
export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}

/** Lightweight option for dropdowns */
export interface DropdownOption {
  id: string | number
  label: string
}

/** Channel from /Channel/GetChannels */
export interface Channel {
  channelId: number
  channelName: string
}

/** Department from /Department/GetDepartment */
export interface Department {
  departmentId: number
  departmentName: string
}

/** Designation from /Designation/GetDesignation */
export interface Designation {
  designationId: number
  designation1: string
}

/** Employee from /Employee/GetEmployeeByChannelId */
export interface EmployeeByChannel {
  employeeId: number
  empFirstName: string
  empLastName: string
  employeeCode: string
}
