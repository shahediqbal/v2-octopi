import { Trash2 } from 'lucide-react'
import type { StockOutLookupOption } from '@/types/stockOut'
import type { PackagingRowValue } from '@/pages/sales-orders/stockOutMappers'

interface PackagingItemTableProps {
  rows: PackagingRowValue[]
  packTypes: StockOutLookupOption[]
  onToggleAutoFill: (rowId: string, enabled: boolean) => void
  onFieldChange: (rowId: string, field: 'packSize' | 'packNo' | 'sopPackId' | 'packLabel', value: string) => void
  onRemove: (rowId: string) => void
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'

export function PackagingItemTable({ rows, packTypes, onToggleAutoFill, onFieldChange, onRemove }: PackagingItemTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1060px] text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="min-w-[180px] px-4 py-3">Product</th>
              <th className="min-w-[110px] px-4 py-3">Order Qty</th>
              <th className="min-w-[90px] px-4 py-3 text-center">Auto Fill</th>
              <th className="min-w-[120px] px-4 py-3">Pack Size</th>
              <th className="min-w-[260px] px-4 py-3">Pack Type</th>
              <th className="min-w-[110px] px-4 py-3">Pack No</th>
              <th className="min-w-[120px] px-4 py-3">Pack Qty</th>
              <th className="min-w-[120px] px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.rowId} className="align-top">
                <td className="px-4 py-3 font-medium text-gray-900">{row.productName}</td>
                <td className="px-4 py-3 text-gray-700">{row.quantity.toFixed(4)}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={row.packSize === String(row.quantity) && row.packNo === '1'}
                    disabled={row.delete === 1}
                    onChange={(event) => onToggleAutoFill(row.rowId, event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={row.packSize}
                    onChange={(event) => onFieldChange(row.rowId, 'packSize', event.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="px-4 py-3 min-w-[16rem]">
                  <select
                    value={row.sopPackId}
                    onChange={(event) => {
                      const selected = packTypes.find((option) => String(option.id) === event.target.value)
                      onFieldChange(row.rowId, 'sopPackId', event.target.value)
                      onFieldChange(row.rowId, 'packLabel', selected?.label ?? '')
                    }}
                    className={inputCls}
                  >
                    <option value="">Select pack type</option>
                    {packTypes.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={row.packNo}
                    onChange={(event) => onFieldChange(row.rowId, 'packNo', event.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{row.packQuantity || '0.0000'}</td>
                <td className="px-4 py-3 text-center">
                  {row.delete === 1 ? (
                    <button
                      type="button"
                      onClick={() => onRemove(row.rowId)}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Base row</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}