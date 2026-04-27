const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
]

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
]

function convertChunk(n: number): string {
  if (n === 0) return ''

  if (n < 20) return ONES[n]

  if (n < 100) {
    const remainder = n % 10
    return TENS[Math.floor(n / 10)] + (remainder ? ' ' + ONES[remainder] : '')
  }

  const remainder = n % 100
  return ONES[Math.floor(n / 100)] + ' Hundred' + (remainder ? ' and ' + convertChunk(remainder) : '')
}

/**
 * Convert a numeric amount to English words.
 * Uses the Indian numbering system (Crore, Lakh, Thousand, Hundred).
 * Handles up to 9 digits (99,99,99,999).
 *
 * Examples:
 *   1234    → "One Thousand Two Hundred and Thirty Four"
 *   150000  → "One Lakh Fifty Thousand"
 *   2500000 → "Twenty Five Lakh"
 */
export function numberToWords(value: number | string | null | undefined): string {
  const num = Math.floor(Math.abs(Number(value ?? 0)))

  if (!Number.isFinite(num) || num === 0) return 'Zero'

  const str = String(num)
  if (str.length > 9) return 'Amount too large'

  const padded = str.padStart(9, '0')
  const match = padded.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/)
  if (!match) return String(num)

  const [, crore, lakh, thousand, hundred, remainder] = match

  let result = ''

  const croreNum = Number(crore)
  if (croreNum > 0) {
    result += convertChunk(croreNum) + ' Crore '
  }

  const lakhNum = Number(lakh)
  if (lakhNum > 0) {
    result += convertChunk(lakhNum) + ' Lakh '
  }

  const thousandNum = Number(thousand)
  if (thousandNum > 0) {
    result += convertChunk(thousandNum) + ' Thousand '
  }

  const hundredNum = Number(hundred)
  if (hundredNum > 0) {
    result += ONES[hundredNum] + ' Hundred '
  }

  const remainderNum = Number(remainder)
  if (remainderNum > 0) {
    if (result.trim().length > 0) {
      result += 'and '
    }
    result += convertChunk(remainderNum)
  }

  return result.trim()
}
