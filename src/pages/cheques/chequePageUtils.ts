import { getAccessToken } from '@/auth/authBridge'
import { jwtDecode } from 'jwt-decode'
import type { ChequeDetail, ChequePayload } from '@/types/cheque'

export function todayStr() {
  const date = new Date()
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function getUserSystemId() {
  const token = getAccessToken()
  if (!token) return null

  try {
    const decoded = jwtDecode<{ UserSystemId?: number | string }>(token)
    return decoded.UserSystemId ?? null
  } catch {
    return null
  }
}

export function buildChequePayload(
  values: {
    chequeCollectedBy: number | null
    chequeCollectionDate: string
    chequeTypeId: number | null
    customerId: number | null
    chequeDate: string
    chequePlacementDate: string
    chequeExpireDate: string
    chequeActionDate: string
    chequeNumber: string
    chequeAmount: number
    issuerBankId: number | null
    beneficiaryBankId: number | null
    chequeStatusId: number | null
    chequeStatusRemarks?: string | null
  },
  options?: { chequeInfoId?: number; existing?: ChequeDetail | null },
): ChequePayload {
  const userSystemId = getUserSystemId()
  const today = todayStr()

  return {
    chequeInfoId: options?.chequeInfoId ?? 0,
    chequeCollectionDate: values.chequeCollectionDate || null,
    chequeCustomerId: values.customerId,
    chequeDate: values.chequeDate || null,
    chequeExpireDate: values.chequeExpireDate || null,
    chequeNumber: values.chequeNumber,
    chequeAmount: values.chequeAmount,
    chequeIssuerBankId: values.issuerBankId,
    chequeMethodInfoId: values.chequeTypeId,
    chequePlacementDate: values.chequePlacementDate || null,
    chequeBeneficiaryBankId: values.beneficiaryBankId,
    chequeCollectedBy: values.chequeCollectedBy,
    chequeStatusId: values.chequeStatusId,
    chequeActionDate: values.chequeActionDate || null,
    chequeStatusRemarks: values.chequeStatusRemarks?.trim() || null,
    createdBy: userSystemId,
    createdDate: today,
    modifiedBy: userSystemId,
    modifiedDate: today,
  }
}

export function extractApiErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'body' in error) {
    const body = (error as { body?: { errMsg?: string; message?: string } }).body
    if (body?.errMsg) return body.errMsg
    if (body?.message) return body.message
  }

  return (error as Error)?.message || 'Something went wrong'
}