export function toNumber(value: unknown): number {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

export function toCurrency(value: unknown, digits = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(toNumber(value))
}

export function toDateLabel(value: unknown): string {
  if (!value) return '—'
  const text = String(value)
  if (text.length === 0) return '—'
  try {
    const d = new Date(text)
    if (Number.isNaN(d.getTime())) return text
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return text
  }
}

export function formatQuantity(value: unknown): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value))
}

export function chequeStatusColor(statusId: number | null | undefined): string {
  switch (statusId) {
    case 1: return 'text-yellow-700 bg-yellow-50'       // Pending
    case 2: return 'text-green-700 bg-green-50'          // Cleared
    case 3: return 'text-red-700 bg-red-50'              // Bounced
    case 4: return 'text-blue-700 bg-blue-50'            // Swap
    case 5: return 'text-red-700 bg-red-50'              // Expired
    case 6: return 'text-gray-600 bg-gray-100'           // Returned
    case 7: return 'text-yellow-700 bg-yellow-50'        // On Hold
    default: return 'text-gray-600 bg-gray-100'
  }
}

const LC_LIFECYCLE_COLORS: Record<string, string> = {
  'Waiting for LC': 'bg-yellow-100 text-yellow-800',
  'LC Transmitted': 'bg-blue-100 text-blue-800',
  'Waiting for Doc Submission': 'bg-sky-100 text-sky-800',
  'Document submitted': 'bg-emerald-100 text-emerald-800',
  'Doc accepted by customer': 'bg-green-100 text-green-800',
  'Doc Sumbited to Benificery Bank': 'bg-green-200 text-green-900',
  'Doc Transmitted to Issuer Bank': 'bg-purple-100 text-purple-800',
  'Doc Accepted by issuer bank': 'bg-purple-200 text-purple-900',
  'Payment Received': 'bg-cyan-100 text-cyan-800',
  'AIT received': 'bg-orange-100 text-orange-800',
  'Product Delivered': 'bg-gray-200 text-gray-700',
}

export function lcLifecycleColor(name: string | null | undefined): string {
  return LC_LIFECYCLE_COLORS[name ?? ''] ?? 'bg-gray-100 text-gray-700'
}

export function balanceColorClass(balance: number): string {
  if (balance < 0) return 'text-red-600'
  if (balance > 0) return 'text-yellow-600'
  return 'text-gray-700'
}

export function dueStatusLabel(balance: number): { text: string; cls: string } {
  if (balance > 0) return { text: 'Due', cls: 'text-red-600' }
  if (balance < 0) return { text: 'Overpaid', cls: 'text-green-600' }
  return { text: 'Paid', cls: 'text-blue-600' }
}
