import type { MonthlyCreditItem } from '@/types/monthlyCreditReport'

export type CreditRiskLevel = 'Regular' | 'Medium' | 'High'
export type CreditActivityClass = 'No Activity' | 'Opening Only' | 'Active Credit'

export interface CreditRiskAnalysisRow {
  customerName: string; marketingName: string; activityClass: CreditActivityClass; riskLevel: CreditRiskLevel
  opening: number; sales: number; payment: number; closing: number; orderCount: number | null; paymentCount: number | null
  recoveryRate: number; daysSinceLastPayment: number | null; lastSaleDate: string | null; lastPaymentDate: string | null
}

function numberOf(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0
  const parsed = Number(value.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function sumMatching(values: Record<string, unknown>, expression: RegExp) {
  return Object.entries(values).reduce((total, [key, value]) => expression.test(key) ? total + numberOf(value) : total, 0)
}

function firstMatching(values: Record<string, unknown>, expression: RegExp) {
  const match = Object.entries(values).find(([key]) => expression.test(key))
  return match ? numberOf(match[1]) : 0
}

function lastMatching(values: Record<string, unknown>, expression: RegExp) {
  const matches = Object.entries(values).filter(([key]) => expression.test(key))
  return matches.length ? numberOf(matches[matches.length - 1][1]) : 0
}

function finalOrGrossTotal(
  values: Record<string, unknown>,
  finalExpression: RegExp,
  grossExpression: RegExp,
) {
  const finalMatches = Object.entries(values).filter(([key]) => finalExpression.test(key))
  return finalMatches.length
    ? finalMatches.reduce((sum, [, value]) => sum + numberOf(value), 0)
    : sumMatching(values, grossExpression)
}

function optionalCount(row: MonthlyCreditItem, values: Record<string, unknown>, names: RegExp) {
  const direct = Object.entries(row).find(([key]) => names.test(key))?.[1]
  if (direct !== undefined && direct !== null) return numberOf(direct)
  const matched = Object.entries(values).filter(([key]) => names.test(key))
  return matched.length ? matched.reduce((sum, [, value]) => sum + numberOf(value), 0) : null
}

export function analyseCreditRisk(rows: MonthlyCreditItem[]): CreditRiskAnalysisRow[] {
  return rows.map(row => {
    const values = (row.monthlyValues ?? {}) as Record<string, unknown>
    const opening = firstMatching(values, /opening balance|opening/i)
    const sales = finalOrGrossTotal(
      values,
      /final sales/i,
      /sales?\s*\(gross\)|gross sales|total sales/i,
    )
    const payment = finalOrGrossTotal(
      values,
      /final payment/i,
      /payments?\s*\(gross\)|gross payment|total payment|total recovery/i,
    )
    const closingMatches = Object.entries(values).filter(([key]) => /closing balance|closing/i.test(key))
    const closing = closingMatches.length
      ? lastMatching(values, /closing balance|closing/i)
      : opening + sales - payment
    const days = row.lastTransactions?.daysSinceLastPayment == null ? null : numberOf(row.lastTransactions.daysSinceLastPayment)
    const activityClass: CreditActivityClass = opening === 0 && sales === 0 && payment === 0 && closing === 0
      ? 'No Activity' : opening !== 0 && sales === 0 && payment === 0 ? 'Opening Only' : 'Active Credit'
    const recoveryRate = opening + sales > 0 ? payment / (opening + sales) * 100 : 0
    const riskLevel: CreditRiskLevel = closing <= 0 || (days !== null && days <= 60 && recoveryRate >= 70)
      ? 'Regular' : days === null || days > 90 || recoveryRate < 40 ? 'High' : 'Medium'
    return {
      customerName: row.customerName || 'Unnamed customer', marketingName: row.marketingName || row.employeeName || 'Unassigned',
      activityClass, riskLevel, opening, sales, payment, closing, recoveryRate,
      orderCount: optionalCount(row, values, /orderCount|order count|invoiceCount|invoice count/i),
      paymentCount: optionalCount(row, values, /paymentCount|payment count|collectionCount|collection count/i),
      daysSinceLastPayment: days, lastSaleDate: row.lastTransactions?.lastSaleDate ?? null,
      lastPaymentDate: row.lastTransactions?.lastPaymentDate ?? null,
    }
  }).sort((a, b) => b.closing - a.closing)
}
