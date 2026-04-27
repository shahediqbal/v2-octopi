/* ─── Allowance Checking types ─── */

export interface AllowanceCheckingItem {
  taskId: number | null
  customerName: string | null
  taskRelatedInvoiceId: number | null
  atInvoicing: string | null
  taskAssignTime: string | null
  taskStartTime: string | null
  delivered: string | null
  taskEndTime: string | null
}

export interface AllowanceCheckingFilters {
  startDate: string
  endDate: string
  employeeId: number
}
