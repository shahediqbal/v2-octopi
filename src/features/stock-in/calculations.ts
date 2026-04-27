// ============================================================
// Stock-In Module — Financial Calculation Functions
// ============================================================

export const DECIMAL_PRECISION = 4

export function parseNumeric(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  const parsed = Number.parseFloat(String(value))
  return Number.isNaN(parsed) ? 0 : parsed
}

export function toFixed(value: number | string | null | undefined, decimals = DECIMAL_PRECISION): string {
  return parseNumeric(value).toFixed(decimals)
}

/**
 * Line total = qty * unitPrice (uses declared values at creation, confirmed after approval)
 */
export function calculateLineTotal(qty: number | null | undefined, unitPrice: number | null | undefined): number {
  const q = parseNumeric(qty)
  const p = parseNumeric(unitPrice)
  return parseFloat((q * p).toFixed(DECIMAL_PRECISION))
}

/**
 * Subtotal = sum of all line totals
 */
export function calculateSubtotal(
  items: Array<{ sidDeclaredQty: number; sidDeclaredUnitPrice: number }>,
): number {
  const sum = items.reduce((acc, item) => {
    return acc + calculateLineTotal(item.sidDeclaredQty, item.sidDeclaredUnitPrice)
  }, 0)
  return parseFloat(sum.toFixed(DECIMAL_PRECISION))
}

/**
 * Subtotal from confirmed quantities (used in post-approval views)
 */
export function calculateConfirmedSubtotal(
  items: Array<{ sidConfirmedQty: number | null; sidConfirmedUnitPrice: number | null }>,
): number {
  const sum = items.reduce((acc, item) => {
    return acc + calculateLineTotal(item.sidConfirmedQty, item.sidConfirmedUnitPrice)
  }, 0)
  return parseFloat(sum.toFixed(DECIMAL_PRECISION))
}

/**
 * Final total = subtotal + adjusted - discount
 * In legacy: sibFinalAmount = sibCalculatedAmount + sibAdjustedAmount - sibDiscountAmouunt
 */
export function calculateFinalTotal(params: {
  subtotal: number | string | null | undefined
  discountAmount: number | string | null | undefined
  adjustedAmount: number | string | null | undefined
}): number {
  const subtotal = parseNumeric(params.subtotal)
  const discount = parseNumeric(params.discountAmount)
  const adjusted = parseNumeric(params.adjustedAmount)
  const result = subtotal + adjusted - discount
  return parseFloat(result.toFixed(DECIMAL_PRECISION))
}

/**
 * Validate: line total cannot be negative
 */
export function validateLineTotal(lineTotal: number): boolean {
  return lineTotal >= 0
}

/**
 * Validate: quantity must be positive (unless stock adjustment)
 */
export function validateQuantity(qty: number, allowNegative = false): boolean {
  if (allowNegative) return qty !== 0
  return qty > 0
}

/**
 * Validate: unit price must be non-negative
 */
export function validateUnitPrice(price: number): boolean {
  return price >= 0
}

/**
 * Recalculate bill summary from items array
 */
export function recalculateBill(
  items: Array<{ sidDeclaredQty: number; sidDeclaredUnitPrice: number }>,
  discountAmount = 0,
  adjustedAmount = 0,
): {
  sibCalculatedAmount: number
  sibDiscountAmouunt: number
  sibAdjustedAmount: number
  sibFinalAmount: number
} {
  const sibCalculatedAmount = calculateSubtotal(items)
  const sibDiscountAmouunt = parseNumeric(discountAmount)
  const sibAdjustedAmount = parseNumeric(adjustedAmount)
  const sibFinalAmount = calculateFinalTotal({
    subtotal: sibCalculatedAmount,
    discountAmount: sibDiscountAmouunt,
    adjustedAmount: sibAdjustedAmount,
  })
  return { sibCalculatedAmount, sibDiscountAmouunt, sibAdjustedAmount, sibFinalAmount }
}
