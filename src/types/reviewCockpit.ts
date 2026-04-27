import type { StockOutApiResponse } from '@/types/stockOut'

export type ApiEnvelope<T> = StockOutApiResponse<T>

export interface CreditSaleSummaryRow {
  customerId?: number | null
  customerName?: string | null
  openingCredit?: number | null
  totalSale?: number | null
  totalPaid?: number | null
  totalAdjustment?: number | null
  totalDue?: number | null
}

export interface TopProductRow {
  productId?: number | null
  productName?: string | null
  totalQuantity?: number | null
}

export interface CustomerLoanSummaryRow {
  productId?: number | null
  productName?: string | null
  loanQty?: number | null
  returnQty?: number | null
  currentLoanQty?: number | null
  loanReceivedQty?: number | null
  loanGivenQty?: number | null
  balanceQty?: number | null
}

export interface CustomerChequeRow {
  chequeNo?: string | null
  chequeNumber?: string | null
  chequeDate?: string | null
  chequeExpireDate?: string | null
  chequeAmount?: number | null
  bankName?: string | null
  chequeBankName?: string | null
  beneficiaryBank?: string | null
  branchName?: string | null
  chequeStatusName?: string | null
  paymentChequeStatusName?: string | null
  chequeStatusId?: number | null
  customerName?: string | null
  empFirstName?: string | null
  empLastName?: string | null
  chequeCollectionDate?: string | null
  chequeActionDate?: string | null
}

export interface LcPaymentInfoRow {
  piSystemId?: number | null
  lcNo?: string | null
  piNo?: string | null
  piNumber?: string | null
  piDate?: string | null
  piRef?: string | null
  lcNumber?: string | null
  lcAmount?: number | null
  piAmount?: number | null
  piCurrency?: string | null
  paidAmount?: number | null
  dueAmount?: number | null
  lcReceivedAmount?: number | null
  lcConversionRateCollection?: number | null
  lcLifecycleName?: string | null
  customerName?: string | null
  customerAddress?: string | null
  beneficiaryBankName?: string | null
  branchLocationName?: string | null
  lcPaymetTerms?: string | null
  piNote?: string | null
  piConditions?: string | null
  lcDocId?: string | null
  lcPartialStatus?: string | null
  lcAmendmentXPi?: string | null
  issuerBankName?: string | null
  issuerBranchLocationName?: string | null
  lcIbcNumber?: string | null
  lcDate?: string | null
  lcCopyReceiveDate?: string | null
  docPrepDate?: string | null
  docSumbitDate?: string | null
  docCustomerAcceptedDate?: string | null
  docBenificerySubmissionDate?: string | null
  lcIbcFbcReceiveDate?: string | null
  bankAcceptanceDate?: string | null
  maturityDate?: string | null
  revisedMaturityDate?: string | null
  lcPaymentDate?: string | null
  aitCollectionDate?: string | null
  aitAmount?: number | null
  createdBy?: string | null
  createdDate?: string | null
  modifiedBy?: string | null
  modifiedDate?: string | null
}

export interface TaxAitDetailRow {
  systemNo?: string | null
  challanNo?: string | null
  challanDate?: string | null
  invoiceDate?: string | null
  aitAmount?: number | null
  taxAmount?: number | null
  vatAmount?: number | null
  taxableBase?: number | null
  vatPercent?: number | null
  aitPercent?: number | null
  customerName?: string | null
  customerAddress?: string | null
  monthName?: string | null
  remarks?: string | null
}

export interface PaymentSummaryRow {
  customerId?: number | null
  totalPayment?: number | null
  totalDiscount?: number | null
  totalAdjustment?: number | null
  totalVatPaid?: number | null
  totalAitPaid?: number | null
}

export interface CreditTransaction {
  serial_no?: number | null
  date?: string | null
  job_type?: string | null
  transaction_number?: string | null
  payable_amount?: number | string | null
  paid_amount?: number | string | null
  returned_amount?: number | string | null
  linq_calculated_due_amount?: number | string | null
}

export interface CreditHistoryResult {
  customerInfo?: {
    customerId?: number
    customerName?: string
    customerAddress?: string
  } | null
  transctionInfo?: CreditTransaction[]
}

export interface ProductLoanDetailRow {
  manualInvoice?: string | null
  invoiceDate?: string | null
  productName?: string | null
  productId?: number | null
  loanReceiveQty?: number | null
  loanGivenQty?: number | null
}

export function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'dataObj' in value
  )
}
