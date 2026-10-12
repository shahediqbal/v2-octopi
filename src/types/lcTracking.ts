// ─────────────────────────────────────────────────────────────────────────────
// LC Tracking Module Types
// PI → LC Document → LC Payment workflow
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}

// ── Constant ──

export const LC_PAYMENT_METHOD_ID = 12

// ── Payment Terms ──

export interface PaymentTerm {
  lcPaymentTermsId: number
  lcPaymentTermsName: string
}

// ── Proforma Invoice (PI) ──

export interface ProformaInvoice {
  piSystemId: number
  piNumber: string
  piRef: string
  piDate: string
  piCustmomerId: number                  // NOTE: backend typo "Custmomer"
  customerName: string
  customerAddress?: string
  piAmount: number
  piCurrency: string                     // "USD" | "BDT"
  piStatus: number
  piBenificaryBankId: number
  piBranchBankLocationId: number
  lcPaymentTermsId: number
  piNote: string
  piNumberMapped: string | null
  piProductDetailsInfo: PiProductDetail[]
  /** Actual API returns a key→value string dict of active conditions */
  piConditions: Record<string, string>
  piConversionRate?: number
  beneficiaryBankName?: string
  // Extra fields present in the GET detail response
  hsCode?: string
  lcPaymetTerms?: string
  bankOperatingBranch?: string
  bankAccountNumber?: string
  bankSwiftNumber?: string
  // Fields returned by GetAllProformaInvoices (LC tracking report)
  lcNumber?: string
  lcDate?: string
  lcLifecycleName?: string
  lcLifecycleId?: number
  lcAmount?: number
}

export interface PiProductDetail {
  piProductId: number
  productName: string
  piProductQuantity: number
  piProductPrice: number
  piProductPriceConvertionRate: number
  piLineTotalAmount: number
  // Optional display columns (returned in detail response)
  productCategoryName?: string
  functionName?: string
  groupName?: string
  brandName?: string
  productLevel?: string
  productShelfLife?: string
  productPackSize?: string
}

export interface PiConditions {
  productCategoryName?: boolean
  functionName?: boolean
  groupName?: boolean
  hsCode?: boolean
  brandName?: boolean
  countryOfOrigin?: boolean
  productLevel?: boolean
  productShelfLife?: boolean
  productPackSize?: boolean
  rmgIndustries?: boolean
  washingIndustries?: boolean
  incoTerm?: boolean
  POL?: boolean
  POD?: boolean
  partialShipment?: boolean
  vatAitCheck?: boolean
  offerValidity?: boolean
}

export interface CreatePiPayload {
  piCustmomerId: number
  piDate: string
  piNumber: string
  piRef: string
  piCurrency: string
  piAmount: number
  piBenificaryBankId: number
  piBranchBankLocationId: number
  lcPaymentTermsId: number
  piNote: string
  piNumberMapped: string | null
  piProductDetailsInfo: {
    piProductId: number
    piProductQuantity: number
    piProductPrice: number
    piProductPriceConvertionRate: number
    piLineTotalAmount: number
  }[]
  piConditions: PiConditions
}

export interface UpdatePiPayload extends CreatePiPayload {
  piSystemId: number
}

export interface PiNumberItem {
  piSystemId: number
  piNumber: string
}

// ── PI status filter (list by status) ──

export interface PiByStatus {
  piSystemId: number
  piNumber: string
  piRef: string
  piDate: string
  customerName: string
  customerAddress: string
  piAmount: number
  piCurrency: string
  piCustmomerId?: number              // NOTE: backend typo "Custmomer"
  lcDocId?: number
  lcNumber?: string
  lcAmount?: number
  lcDate?: string
}

// ── LC Document ──

export interface LcDocument {
  lcDocId: number
  lcNumber: string
  lcAmount: number
  lcDate: string
  // API may return both legacy and alias fields on GET; create/update payloads should use lcIssuerBankId / lcIssuerBranchLocationId
  lcIssuerBankId?: number
  lcIssuerBranchLocationId?: number
  chequeBankId?: number
  chequeBankName: string
  issuerBankName?: string | null
  locationId?: number
  locationName: string
  branchLocationName?: string | null
  issuerBranchLocationName?: string | null
  piSystemId: number
  piNumber: string
  piDate: string
  customerName: string
  piAmount: number
  // Document timeline
  docPrepDate: string | null
  docSumbitDate: string | null
  docCustomerAcceptedDate: string | null
  docBenificerySubmissionDate: string | null  // NOTE: backend typo "Benificery"
  ibcNumber: string | null
  bankAcceptanceDate: string | null
  maturityDate: string | null
  revisedMaturityDate: string | null
  // Payment info
  paymentInfoList: LcPaymentInfo[]
  lcPaymentInfo?: LcPaymentInfo[]
}

export interface LcPaymentInfo {
  paymentDate: string
  paymentAmount: number
  lcAmountTransferAtBank: number
  lcAdjustmentAmount: number
  lcCollectionConversionRate: number
  paymentNote: string
  isPaymentComplete: boolean
}

export interface CreateLcPayload {
  piSystemId: number
  lcNumber: string
  lcAmount: number
  lcDate: string
  lcIssuerBankId: number
  lcIssuerBranchLocationId: number
}

export interface UpdateLcDocPayload {
  lcDocId: number
  piSystemId: number
  docPrepDate: string | null
  docSumbitDate: string | null
  docCustomerAcceptedDate: string | null
  docBenificerySubmissionDate: string | null
  lcIbcNumber: string | null
  bankAcceptanceDate: string | null
  maturityDate: string | null
  revisedMaturityDate: string | null
}

export interface LcLimitedUpdatePayload {
  lcDocId: number
  lcNumber: string
  lcAmount: number
  lcDate: string
  lcIssuerBankId: number
  lcIssuerBranchLocationId: number
}

export interface LcEditListItem {
  lcDocId: number
  lcNumber: string
  lcAmount: number
  chequeBankName: string
  locationName: string
  lcDate: string
  piNumber: string
  piDate: string
  customerName: string
}

export interface LcEditListFilters {
  customerId?: number
  fromDate?: string
  toDate?: string
}

// ── LC Payment ──

export interface LcPaymentEntryPayload {
  paymentMethodId: number              // constant: 12
  paymentCollectedBy: number
  paymentCustomerId: number
  paymentDate: string
  paymentAmount: number
  chequeAmount: number | null
  lcAmountTransferAtBank: number
  lcAdjustmentAmount: number
  lcCollectionConversionRate: number
  paymentNote: string
  isPaymentComplete: boolean
  lcDocId: number
  paymentRelatedJobId: number | null
  paymentChequeId: null
  paymentAdjustedAmount: null
  moenyRecepitNo: string               // NOTE: backend typo — always ""
  modifiedBy: null
  modifiedDate: null
  chequeBeneficiaryBankId: null
  chequeStatusId: null
  chequeActionDate: null
  // Extra read-only fields returned by GetPaymentRelatedDetailsById
  piNumber?: string
  lcNumber?: string
  lcDate?: string
  customerName?: string
  empFirstName?: string
  empLastName?: string
  employeeCode?: string
}

export interface UpdateLcPaymentPayload extends LcPaymentEntryPayload {
  paymentSystemId: number
}

export interface LcPaymentSummary {
  totalPaid: number
  remainingAmount: number
  remainingBalance: number          // same value, legacy name
  lcAmount: number
  paymentCount?: number
  paymentPercentage?: number
  isFullyPaid?: boolean
  payments?: Array<{ paymentId: number; lcCollectionConversionRate?: number }>
}

export interface LcPaymentListItem {
  paymentSystemId: number
  paymentDate: string
  customerName: string
  paymentAmount: number
  piNumber: string
  lcNumber: string
  lcAmount: number
  lcDate: string
  paymentMethodName: string
  paymentNote?: string
}

export interface LcPaymentListFilters {
  startDate?: string
  endDate?: string
  customerId?: number
}
