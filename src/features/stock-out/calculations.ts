import type { DiscountType } from '@/types/stockOut'

export const DISCOUNT_TYPE_FIXED: DiscountType = 'F'
export const DISCOUNT_TYPE_PERCENTAGE: DiscountType = 'P'
export const DEFAULT_CONVERSION_RATE = 1
export const DECIMAL_PRECISION = 4

export interface ProductLineCalculationInput {
  unitPrice: number | string | null | undefined
  quantity?: number | string | null | undefined
  discount?: number | string | null | undefined
  discountType?: DiscountType | null | undefined
  vatRate?: number | string | null | undefined
  aitRate?: number | string | null | undefined
}

export interface ProductLineCalculationResult {
  baseAmount: string
  discountAmount: string
  vatAmount: string
  aitAmount: string
  lineTotal: string
  vatAitTotal: string
}

export interface FinalTotalInput {
  subtotal: number | string | null | undefined
  discount?: number | string | null | undefined
  discountType?: DiscountType | null | undefined
  vatRate?: number | string | null | undefined
  aitRate?: number | string | null | undefined
  adjustmentAmount?: number | string | null | undefined
}

export interface FinalTotalResult {
  subtotal: string
  vatAmount: string
  aitAmount: string
  newTotal: string
  discountAmount: string
  adjustmentAmount: string
  finalTotal: string
}

export interface CompleteBillInput {
  items?: Array<{ lineTotal?: number | string | null | undefined }>
  discount?: number | string | null | undefined
  discountType?: DiscountType | null | undefined
  vatRate?: number | string | null | undefined
  aitRate?: number | string | null | undefined
  adjustmentAmount?: number | string | null | undefined
  conversionRate?: number | string | null | undefined
}

export interface CompleteBillResult extends FinalTotalResult {
  convertedTotal: string
  itemCount: number
  currencyConversionRate: number
}

export interface RecalculateItemInput<TItem extends Record<string, unknown>> {
  item: TItem
  fieldName: keyof TItem | string
  newValue: unknown
}

export function parseNumeric(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  const parsed = Number.parseFloat(String(value))
  return Number.isNaN(parsed) ? 0 : parsed
}

export function toFixed(value: number | string | null | undefined, decimals = DECIMAL_PRECISION): string {
  return parseNumeric(value).toFixed(decimals)
}

export function validatePositiveNumber(value: number | string | null | undefined): boolean {
  return parseNumeric(value) > 0
}

export function validateNonNegativeNumber(value: number | string | null | undefined): boolean {
  return parseNumeric(value) >= 0
}

export function calculatePercentage(value: number | string | null | undefined, percentage: number | string | null | undefined): number {
  return parseNumeric(value) * (parseNumeric(percentage) / 100)
}

export function roundToDecimals(value: number | string | null | undefined, decimals = DECIMAL_PRECISION): number {
  const multiplier = 10 ** decimals
  return Math.round(parseNumeric(value) * multiplier) / multiplier
}

export function safeAbs(value: number | string | null | undefined): number {
  return Math.abs(parseNumeric(value))
}

export function isPercentageDiscount(discountType: DiscountType | null | undefined): boolean {
  return discountType === DISCOUNT_TYPE_PERCENTAGE
}

export function calculateProductVAT(unitPrice: number | string | null | undefined, vatRate: number | string | null | undefined): string {
  return toFixed(calculatePercentage(unitPrice, vatRate))
}

export function calculateProductAIT(unitPrice: number | string | null | undefined, aitRate: number | string | null | undefined): string {
  return toFixed(calculatePercentage(unitPrice, aitRate))
}

export function calculateProductDiscount(
  lineTotal: number | string | null | undefined,
  discount: number | string | null | undefined,
  discountType: DiscountType | null | undefined,
): string {
  const total = parseNumeric(lineTotal)
  const discountValue = parseNumeric(discount)

  if (isPercentageDiscount(discountType)) {
    return toFixed(calculatePercentage(total, discountValue))
  }

  return toFixed(discountValue)
}

export function calculateProductVATAITTotal(
  vatAmount: number | string | null | undefined,
  aitAmount: number | string | null | undefined,
): string {
  return toFixed(parseNumeric(vatAmount) + parseNumeric(aitAmount))
}

export function calculateProductLineTotal({
  unitPrice,
  quantity = 1,
  discount = 0,
  discountType = DISCOUNT_TYPE_FIXED,
  vatRate = 0,
  aitRate = 0,
}: ProductLineCalculationInput): ProductLineCalculationResult {
  const price = parseNumeric(unitPrice)
  const qty = parseNumeric(quantity)
  const baseAmount = price * qty

  let discountAmount = parseNumeric(discount)
  if (isPercentageDiscount(discountType ?? DISCOUNT_TYPE_FIXED)) {
    discountAmount = calculatePercentage(baseAmount, discountAmount)
  }

  const discountedAmount = Math.max(0, baseAmount - discountAmount)
  const vatAmount = calculatePercentage(discountedAmount, vatRate)
  const aitAmount = calculatePercentage(discountedAmount, aitRate)
  const lineTotal = discountedAmount + vatAmount + aitAmount

  return {
    baseAmount: toFixed(baseAmount),
    discountAmount: toFixed(discountAmount),
    vatAmount: toFixed(vatAmount),
    aitAmount: toFixed(aitAmount),
    lineTotal: toFixed(lineTotal),
    vatAitTotal: toFixed(vatAmount + aitAmount),
  }
}

export function calculateSubtotal(items: Array<{ lineTotal?: number | string | null | undefined }>): string {
  if (!Array.isArray(items) || items.length === 0) {
    return toFixed(0)
  }

  const subtotal = items.reduce((sum, item) => sum + parseNumeric(item.lineTotal), 0)
  return toFixed(subtotal)
}

export function calculateInvoiceDiscount(
  subtotal: number | string | null | undefined,
  discount: number | string | null | undefined,
  discountType: DiscountType | null | undefined,
): string {
  const total = parseNumeric(subtotal)
  const discountValue = parseNumeric(discount)

  if (isPercentageDiscount(discountType)) {
    return toFixed(calculatePercentage(total, discountValue))
  }

  return toFixed(discountValue)
}

export function calculateInvoiceVAT(amount: number | string | null | undefined, vatRate: number | string | null | undefined): string {
  return toFixed(calculatePercentage(amount, vatRate))
}

export function calculateInvoiceAIT(amount: number | string | null | undefined, aitRate: number | string | null | undefined): string {
  return toFixed(calculatePercentage(amount, aitRate))
}

export function calculateFinalTotal({
  subtotal,
  discount = 0,
  discountType = DISCOUNT_TYPE_FIXED,
  vatRate = 0,
  aitRate = 0,
  adjustmentAmount = 0,
}: FinalTotalInput): FinalTotalResult {
  const subTotal = parseNumeric(subtotal)
  const vatAmount = calculatePercentage(subTotal, vatRate)
  const aitAmount = calculatePercentage(subTotal, aitRate)
  const newTotal = subTotal + vatAmount + aitAmount
  const adjustment = parseNumeric(adjustmentAmount)

  let discountAmount = parseNumeric(discount)
  if (isPercentageDiscount(discountType ?? DISCOUNT_TYPE_FIXED)) {
    discountAmount = calculatePercentage(newTotal, discountAmount)
  }

  const finalTotal = Math.max(0, newTotal - discountAmount - adjustment)

  return {
    subtotal: toFixed(subTotal),
    vatAmount: toFixed(vatAmount),
    aitAmount: toFixed(aitAmount),
    newTotal: toFixed(newTotal),
    discountAmount: toFixed(discountAmount),
    adjustmentAmount: toFixed(adjustment),
    finalTotal: toFixed(finalTotal),
  }
}

export function calculateConvertedAmount(
  finalTotal: number | string | null | undefined,
  conversionRate: number | string | null | undefined = DEFAULT_CONVERSION_RATE,
): string {
  return toFixed(parseNumeric(finalTotal) * parseNumeric(conversionRate))
}

export function recalculateItemOnEdit<TItem extends Record<string, unknown>>({
  item,
  fieldName,
  newValue,
}: RecalculateItemInput<TItem>): TItem & { lineTotal: string; discountAmmount: string } {
  const updatedItem = { ...item, [fieldName]: newValue } as TItem & {
    quantity?: number | string
    unitPrice?: number | string
    discountRate?: number | string
    discountType?: DiscountType
    vat?: number | string
    ait?: number | string
    lineTotal: string
    discountAmmount: string
  }

  if (fieldName === 'quantity' || fieldName === 'unitPrice') {
    let lineTotal = parseNumeric(updatedItem.quantity) * parseNumeric(updatedItem.unitPrice)
    let discountAmount = parseNumeric(updatedItem.discountRate)

    if (isPercentageDiscount(updatedItem.discountType)) {
      discountAmount = calculatePercentage(lineTotal, discountAmount)
    }

    lineTotal -= discountAmount
    lineTotal += calculatePercentage(lineTotal, updatedItem.vat) + calculatePercentage(lineTotal, updatedItem.ait)

    updatedItem.lineTotal = toFixed(lineTotal)
    updatedItem.discountAmmount = toFixed(discountAmount)
  }

  return updatedItem
}

export function calculateCompleteBill({
  items = [],
  discount = 0,
  discountType = DISCOUNT_TYPE_FIXED,
  vatRate = 0,
  aitRate = 0,
  adjustmentAmount = 0,
  conversionRate = DEFAULT_CONVERSION_RATE,
}: CompleteBillInput): CompleteBillResult {
  const subtotal = calculateSubtotal(items)
  const finalCalculation = calculateFinalTotal({
    subtotal,
    discount,
    discountType,
    vatRate,
    aitRate,
    adjustmentAmount,
  })
  const convertedTotal = calculateConvertedAmount(finalCalculation.finalTotal, conversionRate)

  return {
    ...finalCalculation,
    convertedTotal,
    itemCount: items.length,
    currencyConversionRate: parseNumeric(conversionRate),
  }
}

export function validateSellingPrice(sellingPrice: number | string | null | undefined, purchasePrice: number | string | null | undefined) {
  const sellPrice = parseNumeric(sellingPrice)
  const purchase = parseNumeric(purchasePrice)

  if (sellPrice < purchase) {
    return {
      isValid: false,
      message: `Selling price (${sellPrice}) is below purchase price (${purchase})`,
    }
  }

  return { isValid: true }
}

export function validateFinancialInputs(inputs: Record<string, number | string | null | undefined>) {
  const errors: string[] = []

  if (inputs.quantity !== undefined && !validatePositiveNumber(inputs.quantity)) {
    errors.push('Quantity must be greater than 0')
  }

  if (inputs.unitPrice !== undefined && !validateNonNegativeNumber(inputs.unitPrice)) {
    errors.push('Unit price cannot be negative')
  }

  if (inputs.discount !== undefined && !validateNonNegativeNumber(inputs.discount)) {
    errors.push('Discount cannot be negative')
  }

  if (inputs.vatRate !== undefined && !validateNonNegativeNumber(inputs.vatRate)) {
    errors.push('VAT rate cannot be negative')
  }

  if (inputs.aitRate !== undefined && !validateNonNegativeNumber(inputs.aitRate)) {
    errors.push('AIT rate cannot be negative')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}