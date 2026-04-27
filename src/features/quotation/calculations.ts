/**
 * Quotation line-item price calculation
 *
 * Order of operations (matches legacy behaviour):
 * 1. AIT is applied on base unit price
 * 2. VAT is applied on (price + AIT)
 * 3. Adjustable amount is added or subtracted from the calculated total
 */

export interface LineItemCalcInput {
  unitPrice: number
  vatPercent: number
  aitPercent: number
  adjustableAmount: number
  adjustableType: 'plus' | 'minus'
}

export interface LineItemCalcResult {
  calculatedPrice: number
  finalPrice: number
}

export function calculateQuotationLineItem(input: LineItemCalcInput): LineItemCalcResult {
  const { unitPrice, vatPercent, aitPercent, adjustableAmount, adjustableType } = input

  const aitAmount = unitPrice * (aitPercent / 100)
  const priceWithAit = unitPrice + aitAmount
  const vatAmount = priceWithAit * (vatPercent / 100)
  const calculatedPrice = priceWithAit + vatAmount

  const finalPrice =
    adjustableType === 'minus'
      ? calculatedPrice - adjustableAmount
      : calculatedPrice + adjustableAmount

  return {
    calculatedPrice: Number(calculatedPrice.toFixed(4)),
    finalPrice: Number(finalPrice.toFixed(4)),
  }
}
