export interface ApiResponse<T> {
  dataObj: T
  errMsg?: string
  title?: string
}

export interface ChequeLookupOption {
  id: number
  label: string
}

export interface ChequeInfo {
  chequeInfoId: number
  customerName: string | null
  chequeAmount: number | null
  chequeNumber: string | null
  paymentMethodName: string | null
  customerAddress: string | null
  empFirstName: string | null
  empLastName: string | null
  employeeCode: string | null
  paymentChequeStatusName: string | null
  chequeStatusId: number | null
  chequeDate: string | null
  chequePlacementDate: string | null
  chequeExpireDate: string | null
  chequeCollectionDate: string | null
  chequeActionDate: string | null
  chequeBankName?: string | null
  beneficiaryBank?: string | null
}

export interface ChequeDetail extends ChequeInfo {
  chequeCustomerId: number | null
  chequeMethodInfoId: number | null
  chequeIssuerBankId: number | null
  chequeBeneficiaryBankId: number | null
  employeeId: number | null
  chequeStatusRemarks: string | null
}

export interface ChequePayload {
  chequeInfoId: number
  chequeCollectionDate: string | null
  chequeCustomerId: number | null
  chequeDate: string | null
  chequeExpireDate: string | null
  chequeNumber: string
  chequeAmount: number
  chequeIssuerBankId: number | null
  chequeMethodInfoId: number | null
  chequePlacementDate: string | null
  chequeBeneficiaryBankId: number | null
  chequeCollectedBy: number | null
  chequeStatusId: number | null
  chequeActionDate: string | null
  chequeStatusRemarks: string | null
  createdBy: number | string | null
  createdDate: string
  modifiedBy: number | string | null
  modifiedDate: string
}