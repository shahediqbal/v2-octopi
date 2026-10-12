import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse, Customer } from '@/types/customer'
import type {
  CustomerMapSummary,
  DeliveryAuditFilter,
  DeliveryAuditSummary,
} from '@/types/mapAudit'

export function useCustomerMap(enabled = true) {
  return useQuery<CustomerMapSummary>({
    queryKey: ['superAdminDashboard', 'customerMap'],
    queryFn: async () => {
      const response = await apiClient
        .get<ApiResponse<Customer[]>>('/Customer/GetCustomerDetails')
      const customers = response.dataObj ?? []
      const markers = customers.map(customer => ({
        customerId: customer.customerId,
        customerName: customer.customerName,
        customerAddress: customer.customerAddress ?? '',
        marketingName: [
          customer.empFirstName,
          customer.empLastName,
        ].filter(Boolean).join(' ').trim(),
        latitude: customer.customerLat,
        longitude: customer.customerLong,
        currentStatus: customer.currentStatus ?? '',
        invoiceCount: 0,
        lastInvoiceDate: null,
      }))
      const hasCoordinate = (latitude: number | null, longitude: number | null) =>
        typeof latitude === 'number'
        && typeof longitude === 'number'
        && latitude >= -90
        && latitude <= 90
        && longitude >= -180
        && longitude <= 180
        && latitude !== 0
        && longitude !== 0
      const locatedCustomers = markers.filter(customer =>
        hasCoordinate(customer.latitude, customer.longitude)).length

      return {
        totalCustomers: markers.length,
        locatedCustomers,
        missingLocationCustomers: markers.length - locatedCustomers,
        customers: markers,
      }
    },
    enabled,
    staleTime: 15 * 60_000,
  })
}

export function useDeliveryAudit(filters: DeliveryAuditFilter, enabled = true) {
  const query = new URLSearchParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
  })
  if (filters.employeeId) query.set('employeeId', String(filters.employeeId))
  if (filters.taskId) query.set('taskId', String(filters.taskId))
  if (filters.customerId) query.set('customerId', String(filters.customerId))
  if (filters.vehicleId) query.set('vehicleId', String(filters.vehicleId))
  if (filters.auditStatus && filters.auditStatus !== 'All') {
    query.set('auditStatus', filters.auditStatus)
  }

  return useQuery({
    queryKey: ['superAdminDashboard', 'deliveryAudit', filters],
    queryFn: () => apiClient
      .get<ApiResponse<DeliveryAuditSummary>>(`/SuperAdminDashboard/DeliveryAudit?${query}`)
      .then(response => response.dataObj),
    enabled: enabled && Boolean(filters.startDate && filters.endDate),
    staleTime: 5 * 60_000,
  })
}
