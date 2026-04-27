// ─────────────────────────────────────────────────────────────────────────────
// Payment Module Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}

// ─────────────────── Payment Type Enum ───────────────────

export const PAYMENT_TYPES = {
  INVOICE: '0',
  CHEQUE: '1',
  OPEN: '2',
  TRANSFER: '3',
  AIT: '4',
  VAT: '5',
  CREDIT_ADJUSTMENT: '6',
  LC_PAYMENT: '7',
} as const

export type PaymentType = (typeof PAYMENT_TYPES)[keyof typeof PAYMENT_TYPES]

export const PAYMENT_TYPE_OPTIONS = [
  { id: '0', title: 'Invoice' },
  { id: '1', title: 'Cheque' },
  { id: '2', title: 'Open' },
  { id: '3', title: 'Transfer' },
  { id: '4', title: 'AIT' },
  { id: '5', title: 'VAT' },
  { id: '6', title: 'Credit Adjustment' },
  { id: '7', title: 'LC Payment' },
] as const

/** Fixed paymentMethodId for special payment types */
export const PAYMENT_METHOD_MAP: Record<string, number> = {
  '4': 9,   // AIT
  '5': 10,  // VAT
  '6': 11,  // Credit Adjustment
  '7': 12,  // LC Payment
}

// ─────────────────── List Item (from GetPaymentInfoGridByParam) ───────────────────

export interface PaymentListItem {
  paymentSystemId: number
  paymentDate: string
  moenyRecepitNo: string | null   // Note: typo in API — must use this exact spelling
  customerName: string | null
  customerAddress: string | null
  paymentAmount: number | null    // for non-cheque types
  chequeAmount: number | null     // for cheque type
  paymentAdjustedAmount: number | null
  paymentMethodName: string | null
}

// ─────────────────── Payment Detail (from GetPaymentRelatedDetailsById) ───────────────────

export interface PaymentDetail {
  paymentSystemId: number
  paymentCustomerId: number
  customerName: string
  paymentDate: string
  paymentAmount: number | null
  chequeAmount: number | null
  paymentAdjustedAmount: number | null
  paymentMethodId: number
  paymentMethodName: string
  paymentNote: string | null
  moenyRecepitNo: string | null   // Note: typo in API
  paymentRelatedJobId: number | null  // Invoice SO system ID
  paymentChequeId: number | null       // Cheque ID
  paymentCollectedBy: number | null
  empFirstName: string | null
  empLastName: string | null
  employeeCode: string | null
  soSystemNo: string | null           // Invoice number
  chequeNumber: string | null
  chequeDate: string | null
  chequeActionDate: string | null
  chequeBeneficiaryBankId: number | null
  beneficiaryBankName: string | null
  chequeStatusId: number | null
  chequeStatusName: string | null
}

// ─────────────────── Invoice Metadata (from GetPaymentInvoiceMetaDataById) ───────────────────

export interface InvoiceMetadata {
  soSystemNo: string
  sobFinalBill: number
  paidAmount: number
  balance: number
  adjustedAmount: number
  customerId: number
  customerName: string
}

// ─────────────────── Dropdown Options ───────────────────

export interface InvoiceOption {
  id: number    // soSystemId
  label: string // soSystemNo
}

export interface ChequeOption {
  id: number    // chequeInfoId
  label: string // chequeNumber
}

export interface PaymentModeOption {
  id: number
  label: string
}

// ─────────────────── Create Payload (POST AddPaymentInfo) ───────────────────

export interface CreatePaymentPayload {
  paymentCustomerId: number
  chequeAmount: number | null
  paymentAmount: number | null
  paymentRelatedJobId: number | null
  paymentAdjustedAmount: number | null
  paymentMethodId: number
  paymentDate: string
  paymentCollectedBy: number
  moenyRecepitNo: string              // Note: typo in API — must match exactly
  paymentChequeId: number | null
  paymentNote: string
  modifiedBy: null
  modifiedDate: null
  chequeBeneficiaryBankId: number | null
  chequeStatusId: number | null
  chequeActionDate: string | null
}

// ─────────────────── Update Payload (PUT UpdatePaymentInfo) ───────────────────

export interface UpdatePaymentPayload extends CreatePaymentPayload {
  paymentSystemId: number
}

// ─────────────────── List Filters ───────────────────

export interface PaymentListFilters {
  startDate: string
  endDate: string
  customerId: number
}
