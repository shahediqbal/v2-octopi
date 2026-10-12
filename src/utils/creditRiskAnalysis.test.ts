import { describe, expect, it } from 'vitest'
import { analyseCreditRisk } from '@/utils/creditRiskAnalysis'

describe('analyseCreditRisk', () => {
  it('uses first opening, final monthly sales/payments once, and last closing balance', () => {
    const [result] = analyseCreditRisk([
      {
        employeeId: 7,
        employeeName: 'Marketing One',
        monthName: null,
        monthYear: null,
        creditAmount: null,
        customerCount: 1,
        invoiceCount: 4,
        customerName: 'Customer A',
        marketingName: 'Marketing One',
        monthlyValues: {
          'Jan26 Opening Balance': 100,
          'Jan26 Sales (Gross)': 80,
          'Jan26 Payment (Gross)': 30,
          'Jan26 Sales Return': 10,
          'Jan26 Payment Adjustment': 5,
          'Jan26 Final Sales': 70,
          'Jan26 Final Payment': 35,
          'Jan26 Closing Balance': 135,
          'Feb26 Opening Balance': 135,
          'Feb26 Sales (Gross)': 40,
          'Feb26 Payment (Gross)': 20,
          'Feb26 Final Sales': 40,
          'Feb26 Final Payment': 20,
          'Feb26 Closing Balance': 155,
        },
        lastTransactions: {
          daysSinceLastPayment: 12,
          lastSaleDate: '2026-02-20',
          lastPaymentDate: '2026-02-22',
        },
      },
    ])

    expect(result.opening).toBe(100)
    expect(result.sales).toBe(110)
    expect(result.payment).toBe(55)
    expect(result.closing).toBe(155)
  })
})
