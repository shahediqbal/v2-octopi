import type { Customer } from '@/types/customer'

export interface CustomerAssignmentLists {
  employeeId: number
  assignedCustomers: Customer[]
  unAssignedCustomers: Customer[]
}

export interface CustomerEmployeeAssignmentPayload {
  customerId: number
  employeeId: number
}