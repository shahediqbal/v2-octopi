import { parseNumeric } from '@/features/stock-out/calculations'
import type { PackagingRowValue } from '@/pages/sales-orders/stockOutMappers'

export function calculatePackQuantity(packSize: string, packNo: string) {
  return (parseNumeric(packSize) * parseNumeric(packNo)).toFixed(4)
}

export function updatePackagingRow(
  rows: PackagingRowValue[],
  rowId: string,
  field: 'packSize' | 'packNo' | 'sopPackId' | 'packLabel',
  value: string,
) {
  const nextRows = rows.map((row) => {
    if (row.rowId !== rowId) return row

    const updated = { ...row, [field]: value }
    if (field === 'packSize' || field === 'packNo') {
      updated.packQuantity = calculatePackQuantity(
        field === 'packSize' ? value : row.packSize,
        field === 'packNo' ? value : row.packNo,
      )
    }

    return updated
  })

  return rebalancePackagingRows(nextRows, rowId)
}

export function applyAutoFill(rows: PackagingRowValue[], rowId: string, enabled: boolean) {
  const nextRows = rows.map((row) => {
    if (row.rowId !== rowId) return row
    if (!enabled) {
      return { ...row, packSize: '', packNo: '', packQuantity: '' }
    }

    return { ...row, packSize: String(row.quantity), packNo: '1', packQuantity: Number(row.quantity).toFixed(4) }
  })

  return rebalancePackagingRows(nextRows, rowId)
}

export function removePackagingRow(rows: PackagingRowValue[], rowId: string) {
  const target = rows.find((row) => row.rowId === rowId)
  if (!target) return rows

  const filtered = rows.filter((row) => row.rowId !== rowId)
  const productRows = filtered.filter((row) => row.productId === target.productId)
  if (productRows.length === 0) {
    return filtered
  }

  const totalPacked = productRows.reduce((sum, row) => sum + parseNumeric(row.packQuantity), 0)
  if (totalPacked < productRows[0].quantity - 0.0001) {
    return [...filtered, createSplitRow(target.productId, target.productName, target.quantity, clonePackMeta(target))]
  }

  return filtered
}

export function validatePackagingRows(rows: PackagingRowValue[]) {
  if (rows.length === 0) {
    return { isValid: false, message: 'Please add products to package.' }
  }

  const incompleteRows = rows.filter(
    (row) => !row.packSize || !row.packNo || !row.packQuantity || !row.sopPackId,
  )

  if (incompleteRows.length > 0) {
    return {
      isValid: false,
      message: `Please complete packaging fields for: ${incompleteRows.map((row) => row.productName).join(', ')}`,
    }
  }

  const invalidRows = rows.filter(
    (row) => parseNumeric(row.packSize) <= 0 || parseNumeric(row.packNo) <= 0 || parseNumeric(row.packQuantity) <= 0,
  )

  if (invalidRows.length > 0) {
    return { isValid: false, message: 'Pack size, pack count, and pack quantity must be positive numbers.' }
  }

  const grouped = new Map<number, { name: string; quantity: number; packed: number }>()
  for (const row of rows) {
    const current = grouped.get(row.productId) ?? { name: row.productName, quantity: row.quantity, packed: 0 }
    current.packed += parseNumeric(row.packQuantity)
    grouped.set(row.productId, current)
  }

  const mismatches = [...grouped.values()].filter((group) => Math.abs(group.quantity - group.packed) > 0.0001)
  if (mismatches.length > 0) {
    return {
      isValid: false,
      message: mismatches
        .map((group) => `${group.name}: order=${group.quantity.toFixed(4)}, packed=${group.packed.toFixed(4)}`)
        .join(' | '),
    }
  }

  return { isValid: true, message: '' }
}

function rebalancePackagingRows(rows: PackagingRowValue[], changedRowId: string) {
  const changedRow = rows.find((row) => row.rowId === changedRowId)
  if (!changedRow) return rows

  const productRows = rows.filter((row) => row.productId === changedRow.productId)
  const totalPacked = productRows.reduce((sum, row) => sum + parseNumeric(row.packQuantity), 0)

  if (parseNumeric(changedRow.packQuantity) > changedRow.quantity) {
    return rows.map((row) =>
      row.rowId === changedRowId ? { ...row, packSize: '', packNo: '', packQuantity: '' } : row,
    )
  }

  const remaining = changedRow.quantity - totalPacked
  const hasEmptySplit = productRows.some((row) => row.delete === 1 && !row.packSize && !row.packNo)

  if (remaining > 0.0001 && !hasEmptySplit) {
    const insertIndex = rows.findIndex((row) => row.rowId === changedRowId)
    const nextRows = [...rows]
    nextRows.splice(
      insertIndex + 1,
      0,
      createSplitRow(changedRow.productId, changedRow.productName, changedRow.quantity, clonePackMeta(changedRow)),
    )
    return nextRows
  }

  if (remaining <= 0.0001) {
    return rows.filter((row) => !(row.productId === changedRow.productId && row.delete === 1 && !row.packSize && !row.packNo))
  }

  return rows
}

function createSplitRow(productId: number, productName: string, quantity: number, meta: { sopPackId: string; packLabel: string }) {
  return {
    rowId: `${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId,
    productName,
    quantity,
    packSize: '',
    packNo: '',
    packQuantity: '',
    sopPackId: meta.sopPackId,
    packLabel: meta.packLabel,
    delete: 1 as const,
  }
}

function clonePackMeta(row: PackagingRowValue) {
  return {
    sopPackId: row.sopPackId,
    packLabel: row.packLabel,
  }
}