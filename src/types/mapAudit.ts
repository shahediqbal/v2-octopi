export interface CustomerMapMarker {
  customerId: number
  customerName: string
  customerAddress: string
  marketingName: string
  latitude: number | null
  longitude: number | null
  currentStatus: string
  invoiceCount: number
  lastInvoiceDate: string | null
}

export interface CustomerMapSummary {
  totalCustomers: number
  locatedCustomers: number
  missingLocationCustomers: number
  customers: CustomerMapMarker[]
}

export interface DeliveryAuditEmployee {
  employeeId: number
  employeeName: string
}

export interface DeliveryAuditVehicle {
  vehicleId: number
  vehicleName: string
}

export interface DeliveryAuditStop {
  sequence: number
  taskId: number
  customerId: number | null
  customerName: string
  customerAddress: string
  arrivedAt: string | null
  latitude: number | null
  longitude: number | null
  packageType: string
}

export interface DeliveryAuditLeg {
  sequence: number
  transportationId: number
  taskId: number
  vehicleId: number | null
  vehicleName: string
  cost: number
  startLocation: string
  endLocation: string
  startLatitude: number | null
  startLongitude: number | null
  endLatitude: number | null
  endLongitude: number | null
  wayStatus: number | null
  recordedAt: string | null
  coordinateDistanceKm: number
}

export type DeliveryAuditStatus =
  | 'Normal'
  | 'High Cost'
  | 'Cost Review'
  | 'Duration Review'
  | 'Unusual Time Gap'
  | 'Route Review'
  | 'Insufficient History'
  | string

export interface DeliveryAuditRun {
  runId: string
  deliveryDate: string
  employeeId: number
  employeeName: string
  taskIds: number[]
  customerIds: number[]
  customerNames: string
  customerStopCount: number
  packageTypes: string
  vehicleNames: string
  firstAssignmentAt: string | null
  startedAt: string | null
  lastDeliveryAt: string | null
  completedAt: string | null
  assignmentDelayMinutes: number
  grossDurationMinutes: number
  deliveryRouteMinutes: number
  returnDurationMinutes: number
  longestCustomerGapMinutes: number
  coordinateDistanceKm: number
  actualCost: number
  expectedCost: number | null
  costVariancePercent: number | null
  costPerKm: number | null
  expectedDurationMinutes: number | null
  durationVariancePercent: number | null
  potentialExcessPayment: number
  startsAtWarehouse: boolean
  returnsToWarehouse: boolean
  hasRouteDiscontinuity: boolean
  auditStatus: DeliveryAuditStatus
  stops: DeliveryAuditStop[]
  legs: DeliveryAuditLeg[]
}

export interface DeliveryAuditSummary {
  startDate: string
  endDate: string
  totalRuns: number
  totalTasks: number
  totalCustomerStops: number
  totalDistanceKm: number
  totalTransportCost: number
  averageCostPerRun: number
  potentialExcessPayment: number
  reviewRunCount: number
  highCostRunCount: number
  durationReviewRunCount: number
  employees: DeliveryAuditEmployee[]
  vehicles: DeliveryAuditVehicle[]
  runs: DeliveryAuditRun[]
}

export interface DeliveryAuditFilter {
  startDate: string
  endDate: string
  employeeId?: number
  taskId?: number
  customerId?: number
  vehicleId?: number
  auditStatus?: string
}
