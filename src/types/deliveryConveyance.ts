/* ─── Delivery Conveyance Report types ─── */

export interface DeliveryConveyanceItem {
  taskId: number | null
  taskName: string | null
  taskDescription: string | null
  taskDestination: string | null
  vehicleName: string | null
  taskTransportationCost: number | null
  startLocation: string | null
  endLocation: string | null
  employeeId: number | null
  employeeName: string | null
  invoiceNo: string | null
}

export interface DeliveryConveyanceFilters {
  startDate: string
  endDate: string
  employeeId: number
}
