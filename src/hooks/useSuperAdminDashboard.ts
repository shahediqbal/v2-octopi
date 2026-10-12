import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/types/customer'
import type { CreditRiskSummary, FinanceAnalysisSummary, OperationsSummary, StockMovementSummary, StockSummary } from '@/types/superAdminDashboard'
import type { SuperAdminPurchaseDetailsSummary } from '@/types/superAdminOverviewDetails'

export function useSuperAdminCreditRisk(asOfDate: string, enabled = true) {
  return useQuery({
    queryKey: ['superAdminDashboard', 'creditRisk', asOfDate],
    queryFn: () => apiClient
      .get<ApiResponse<CreditRiskSummary>>(`/SuperAdminDashboard/CreditRisk?asOfDate=${asOfDate}`)
      .then(response => response.dataObj),
    enabled: enabled && Boolean(asOfDate),
    staleTime: 5 * 60_000,
  })
}

export function useSuperAdminStockMovement(startDate: string, endDate: string, channelId = 0, enabled = true) {
  return useQuery({
    queryKey: ['superAdminDashboard', 'stockMovement', startDate, endDate, channelId],
    queryFn: () => apiClient.get<ApiResponse<StockMovementSummary>>(`/SuperAdminDashboard/StockMovement?startDate=${startDate}&endDate=${endDate}&channelId=${channelId}`).then(response => response.dataObj),
    enabled: enabled && Boolean(startDate && endDate), staleTime: 5 * 60_000,
  })
}

export function useSuperAdminOperations(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ['superAdminDashboard', 'operations', startDate, endDate],
    queryFn: () => apiClient
      .get<ApiResponse<OperationsSummary>>(`/SuperAdminDashboard/Operations?startDate=${startDate}&endDate=${endDate}`)
      .then(response => response.dataObj),
    enabled: enabled && Boolean(startDate && endDate),
    staleTime: 5 * 60_000,
  })
}

export function useSuperAdminStockSummary(channelId = 0, enabled = true) {
  return useQuery({
    queryKey: ['superAdminDashboard', 'stockSummary', channelId],
    queryFn: () => apiClient
      .get<ApiResponse<StockSummary>>(`/SuperAdminDashboard/StockSummary?channelId=${channelId}`)
      .then(response => response.dataObj),
    enabled,
    staleTime: 5 * 60_000,
  })
}

export function useSuperAdminPurchaseDetails(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ['superAdminDashboard', 'purchaseDetails', startDate, endDate],
    queryFn: () => apiClient
      .get<ApiResponse<SuperAdminPurchaseDetailsSummary>>(
        `/SuperAdminDashboard/PurchaseDetails?startDate=${startDate}&endDate=${endDate}`,
      )
      .then(response => response.dataObj),
    enabled: enabled && Boolean(startDate && endDate),
    staleTime: 5 * 60_000,
  })
}

export function useSuperAdminFinanceAnalysis(asOfDate: string, enabled = true) {
  return useQuery({
    queryKey: ['superAdminDashboard', 'financeAnalysis', asOfDate],
    queryFn: () => apiClient
      .get<ApiResponse<FinanceAnalysisSummary>>(
        `/SuperAdminDashboard/FinanceAnalysis?asOfDate=${asOfDate}`,
      )
      .then(response => response.dataObj),
    enabled: enabled && Boolean(asOfDate),
    staleTime: 5 * 60_000,
  })
}
