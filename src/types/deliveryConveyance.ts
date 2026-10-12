/* ─── Delivery Conveyance Report types ─── */

export interface DeliveryConveyanceItem {
  taskId: number | null
  taskName: string | null
  taskDescription: string | null
  description?: string | null
  taskDestination: string | null
  taskDestinationAddress?: string | null
  vehicleName: string | null
  taskTransportationCost: number | null
  startLocation: string | null
  endLocation: string | null
  taskTransportationStartLocation?: string | null
  taskTransportationEndLocation?: string | null
  taskAssignedTo?: number | null
  insertedAt?: string | null
  employeeId: number | null
  employeeName: string | null
  billBy?: string | null
  invoiceNo: string | null
  soSystemNo?: string | null
}

export interface DeliveryConveyanceFilters {
  startDate: string
  endDate: string
  employeeId: number
}
