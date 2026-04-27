import { Trash2 } from 'lucide-react'
import type { PackingItem, PackType } from '@/types/stickerPacking'

interface PackingItemRowProps {
  item: PackingItem
  packTypes: PackType[]
  employees: Array<{ id: number; label: string }>
  onChange: (index: string, updates: Partial<PackingItem>) => void
  onDelete: (index: string) => void
}

export function PackingItemRow({ item, packTypes, employees, onChange, onDelete }: PackingItemRowProps) {
  const packSize = Number(item.packSize) || 0
  const packNo = Number(item.packNo) || 0
  const computed = packSize * packNo

  function handlePackSizeChange(val: string) {
    const ps = Number(val) || 0
    onChange(item.index, { packSize: val, packQuantity: ps * (Number(item.packNo) || 0) })
  }

  function handlePackNoChange(val: string) {
    const pn = Number(val) || 0
    onChange(item.index, { packNo: val, packQuantity: (Number(item.packSize) || 0) * pn })
  }

  const isOverQty = computed > item.quantity && computed > 0

  return (
    <tr className="border-b border-gray-100 text-sm">
      <td className="px-3 py-2 text-gray-900">{item.productName}</td>
      <td className="px-3 py-2 text-right text-gray-600">{item.quantity}</td>
      <td className="px-3 py-2">
        <input
          type="number"
          min={1}
          value={item.packSize}
          onChange={(e) => handlePackSizeChange(e.target.value)}
          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-500 focus:outline-none"
          placeholder="0"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={item.sopPackId ?? ''}
          onChange={(e) => onChange(item.index, { sopPackId: e.target.value ? Number(e.target.value) : null })}
          className="w-32 rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-500 focus:outline-none"
        >
          <option value="">-- Pack Type --</option>
          {packTypes.map((pt) => (
            <option key={pt.packId} value={pt.packId}>
              {pt.packTypeName}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min={1}
          value={item.packNo}
          onChange={(e) => handlePackNoChange(e.target.value)}
          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-500 focus:outline-none"
          placeholder="0"
        />
      </td>
      <td className={`px-3 py-2 text-right font-medium ${isOverQty ? 'text-red-600' : 'text-gray-900'}`}>
        {computed || '—'}
        {isOverQty && <span className="ml-1 text-xs">(exceeds qty)</span>}
      </td>
      <td className="px-3 py-2">
        <select
          value={item.packedBy ?? ''}
          onChange={(e) => onChange(item.index, { packedBy: e.target.value ? Number(e.target.value) : null })}
          className="w-36 rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-500 focus:outline-none"
        >
          <option value="">-- Employee --</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2 text-center">
        <button
          type="button"
          onClick={() => onDelete(item.index)}
          className="text-gray-400 hover:text-red-500"
          title="Remove row"
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  )
}
