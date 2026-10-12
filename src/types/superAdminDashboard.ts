export interface CreditRiskCustomer {
  customerId: number
  customerName: string
  marketingName: string
  totalDue: number
  overdueAmount: number
  days0To30: number
  days31To60: number
  days61To90: number
  daysOver90: number
  oldestInvoiceDate: string | null
  oldestDueDays: number
  invoiceCount: number
  riskLevel: 'Current' | 'Watch' | 'High' | 'Critical'
}

export interface CreditRiskSummary {
  totalDue: number
  customerCount: number
  days0To30: number
  days31To60: number
  days61To90: number
  daysOver90: number
  topCustomers: CreditRiskCustomer[]
}

export interface StockSummaryProduct {
  productId: number
  productName: string
  categoryName: string
  currentQuantity: number
  latestPurchasePrice: number | null
  latestPurchaseDate: string | null
  priceSource: string
  stockValue: number
}

export interface StockSummary {
  totalQuantity: number
  totalStockValue: number
  productCount: number
  outOfStockCount: number
  negativeStockCount: number
  missingPriceCount: number
  products: StockSummaryProduct[]
  highestValueProducts: StockSummaryProduct[]
  missingPriceProducts: StockSummaryProduct[]
}

export interface StockMovementProduct {
  productId: number; productName: string; categoryName: string; currentQuantity: number; stockValue: number
  lastMovementDate: string | null; daysSinceLastMovement: number | null; periodIssuedQuantity: number
  periodTransactionCount: number; averageMonthlyIssue: number; monthsOfStock: number | null; movementClass: string
}
export interface StockMovementSummary {
  startDate: string; endDate: string; fastMovingCount: number; mediumMovingCount: number; slowMovingCount: number
  idleCount: number; deadCount: number; neverMovedCount: number; idleStockValue: number; deadStockValue: number
  products: StockMovementProduct[]
}

export interface NamedAmount { name: string; count: number; amount: number; quantity: number }
export interface PendingOrderDetail {
  soSystemId: number
  soSystemNo: string
  customerName: string
  invoiceDate: string | null
  currentStatusName: string
  quantity: number
  amount: number
  daysPending: number
}
export interface OperationsSummary {
  salesTypes: NamedAmount[]
  orderStatuses: NamedAmount[]
  chequeStatuses: NamedAmount[]
  lcStatuses: NamedAmount[]
  allowance: { total: number; assigned: number; started: number; delivered: number; completed: number; pending: number }
  taxAit: { recoverable: number; recovered: number; outstanding: number; recoveryRate: number }
  pendingOrderDetails: PendingOrderDetail[]
  pendingOrders: number
  cancelledOrders: number
  deliveredOrders: number
  overdueCheques: number
  overdueChequeAmount: number
  chequesDueNext7Days: number
  delayedLcCount: number
}

export interface FinanceLcRow {
  piSystemId: number
  customerId: number | null
  customerName: string
  piNumber: string
  piDate: string | null
  piAmount: number
  currency: string
  lcNumber: string
  lcDate: string | null
  paymentTerms: string
  lifecycleStageId: number | null
  lifecycleStage: string
}

export interface FinanceChequeRow {
  chequeInfoId: number
  customerId: number | null
  customerName: string
  chequeNumber: string
  amount: number
  chequeDate: string | null
  bankName: string
  collectorName: string
  statusId: number | null
  statusName: string
  daysRemaining: number | null
}

export interface FinanceTaxAitCompany {
  customerId: number
  companyName: string
  companyAddress: string
  invoiceCount: number
  taxableBase: number
  vatPayable: number
  aitPayable: number
  vatPaid: number
  aitPaid: number
  totalPayable: number
  totalPaid: number
  pendingAmount: number
  status: 'Paid' | 'Pending' | string
}

export interface FinanceAnalysisSummary {
  asOfDate: string
  upcomingChequeEndDate: string
  taxYearStartDate: string
  taxYearEndDate: string
  taxYearLabel: string
  lcRows: FinanceLcRow[]
  lcLifecycleStages: NamedAmount[]
  upcomingCheques: FinanceChequeRow[]
  chequeRows: FinanceChequeRow[]
  chequeStatuses: NamedAmount[]
  taxAitCompanies: FinanceTaxAitCompany[]
  taxYears: FinanceTaxYearAnalysis[]
}

export interface FinanceTaxYearAnalysis {
  startDate: string
  endDate: string
  label: string
  isCurrent: boolean
  companies: FinanceTaxAitCompany[]
}
