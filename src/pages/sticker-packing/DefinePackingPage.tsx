import { useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SearchableSelect } from '@/components/dropdowns'
import { useSalesOrderInternalDetail, usePackTypes, useCreateStickerPacking } from '@/hooks/useStickerPacking'
import { useEmployeeOptions } from '@/hooks/useEmployees'
import { extractApiErrorMessage, extractApiResponseErrorMessage } from '@/pages/sales-orders/stockOutMappers'
import { useToastStore } from '@/stores/toastStore'
import type { PackingItem } from '@/types/stickerPacking'

interface StickerPackingRowValue extends PackingItem {
  delete?: 1
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 sm:text-sm'

function parsePackingNumber(value: number | string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatPackingNumber(value: number) {
  return value.toFixed(4)
}

function calculatePackQuantity(packSize: number | string, packNo: number | string) {
  return formatPackingNumber(parsePackingNumber(packSize) * parsePackingNumber(packNo))
}

function isAutoFilled(row: StickerPackingRowValue) {
  return Math.abs(parsePackingNumber(row.packSize) - row.quantity) <= 0.0001 && parsePackingNumber(row.packNo) === 1
}

function hasPackingValues(row: StickerPackingRowValue) {
  return Boolean(row.packSize || row.packNo || row.packQuantity || row.sopPackId || row.packedBy)
}

function createSplitRow(
  row: StickerPackingRowValue,
  options: { preserveSelections?: boolean } = {},
): StickerPackingRowValue {
  return {
    index: `${row.productId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId: row.productId,
    productName: row.productName,
    quantity: row.quantity,
    packSize: '',
    packNo: '',
    packQuantity: '',
    sopPackId: options.preserveSelections ? row.sopPackId : null,
    packedBy: options.preserveSelections ? row.packedBy : null,
    delete: 1,
  }
}

function rebalanceStickerRows(rows: StickerPackingRowValue[], changedIndex: string) {
  const changedRow = rows.find((row) => row.index === changedIndex)
  if (!changedRow) return rows

  if (parsePackingNumber(changedRow.packQuantity) > changedRow.quantity + 0.0001) {
    return rows.map((row) =>
      row.index === changedIndex
        ? { ...row, packSize: '', packNo: '', packQuantity: '' }
        : row,
    )
  }

  const productRows = rows.filter((row) => row.productId === changedRow.productId)
  const totalPacked = productRows.reduce((sum, row) => sum + parsePackingNumber(row.packQuantity), 0)
  const remaining = changedRow.quantity - totalPacked
  const hasEmptySplit = productRows.some((row) => row.delete === 1 && !row.packSize && !row.packNo)

  if (remaining > 0.0001 && !hasEmptySplit) {
    const insertIndex = rows.findIndex((row) => row.index === changedIndex)
    const nextRows = [...rows]
    nextRows.splice(insertIndex + 1, 0, createSplitRow(changedRow, { preserveSelections: true }))
    return nextRows
  }

  if (remaining <= 0.0001) {
    return rows.filter(
      (row) => !(row.productId === changedRow.productId && row.delete === 1 && !row.packSize && !row.packNo),
    )
  }

  return rows
}

function updateStickerRow(
  rows: StickerPackingRowValue[],
  index: string,
  field: 'packSize' | 'packNo' | 'sopPackId' | 'packedBy',
  value: string | number | null,
) {
  const nextRows = rows.map((row) => {
    if (row.index !== index) return row

    const updated = { ...row, [field]: value }
    if (field === 'packSize' || field === 'packNo') {
      updated.packQuantity = calculatePackQuantity(
        field === 'packSize' ? value : row.packSize,
        field === 'packNo' ? value : row.packNo,
      )
    }

    return updated
  })

  return rebalanceStickerRows(nextRows, index)
}

function applyAutoFill(rows: StickerPackingRowValue[], index: string, enabled: boolean) {
  const nextRows = rows.map((row) => {
    if (row.index !== index) return row
    if (row.delete === 1 || row.quantity <= 0) return row
    if (!enabled) {
      return { ...row, packSize: '', packNo: '', packQuantity: '' }
    }

    return {
      ...row,
      packSize: String(row.quantity),
      packNo: '1',
      packQuantity: formatPackingNumber(row.quantity),
    }
  })

  return rebalanceStickerRows(nextRows, index)
}

function removeStickerRow(rows: StickerPackingRowValue[], index: string) {
  const target = rows.find((row) => row.index === index)
  if (!target) return rows

  const filtered = rows.filter((row) => row.index !== index)
  if (target.delete === 1 && !hasPackingValues(target)) {
    return filtered
  }

  const productRows = filtered.filter((row) => row.productId === target.productId)
  if (productRows.length === 0) {
    return filtered
  }

  const totalPacked = productRows.reduce((sum, row) => sum + parsePackingNumber(row.packQuantity), 0)
  const hasEmptySplit = productRows.some((row) => row.delete === 1 && !hasPackingValues(row))
  if (totalPacked < target.quantity - 0.0001 && !hasEmptySplit) {
    return [...filtered, createSplitRow(target, { preserveSelections: true })]
  }

  return filtered
}

function validateStickerRows(rows: StickerPackingRowValue[]) {
  if (rows.length === 0) {
    return { isValid: false, message: 'Please add products to define packing.' }
  }

  const incompleteRows = rows.filter(
    (row) => !row.packSize || !row.packNo || !row.packQuantity || !row.sopPackId,
  )
  if (incompleteRows.length > 0) {
    const productLabels = [...new Set(incompleteRows.map((row) => row.productName))]
    return {
      isValid: false,
      message: `Please complete packing fields for: ${productLabels.join(', ')}`,
    }
  }

  const invalidRows = rows.filter(
    (row) =>
      parsePackingNumber(row.packSize) <= 0 ||
      parsePackingNumber(row.packNo) <= 0 ||
      parsePackingNumber(row.packQuantity) <= 0,
  )
  if (invalidRows.length > 0) {
    return {
      isValid: false,
      message: 'Pack size, pack count, and pack quantity must be positive numbers.',
    }
  }

  const grouped = new Map<number, { name: string; quantity: number; packed: number }>()
  for (const row of rows) {
    const current = grouped.get(row.productId) ?? {
      name: row.productName,
      quantity: row.quantity,
      packed: 0,
    }
    current.packed += parsePackingNumber(row.packQuantity)
    grouped.set(row.productId, current)
  }

  const mismatches = [...grouped.values()].filter(
    (group) => Math.abs(group.quantity - group.packed) > 0.0001,
  )
  if (mismatches.length > 0) {
    return {
      isValid: false,
      message: mismatches
        .map(
          (group) =>
            `${group.name}: order=${group.quantity.toFixed(4)}, packed=${group.packed.toFixed(4)}`,
        )
        .join(' | '),
    }
  }

  return { isValid: true, message: '' }
}

function summarizeStickerRows(rows: StickerPackingRowValue[]) {
  const grouped = new Map<number, { quantity: number; packed: number }>()

  for (const row of rows) {
    const current = grouped.get(row.productId) ?? {
      quantity: row.quantity,
      packed: 0,
    }
    current.packed += parsePackingNumber(row.packQuantity)
    grouped.set(row.productId, current)
  }

  return {
    productCount: grouped.size,
    rowCount: rows.length,
    totalOrderQty: [...grouped.values()].reduce((sum, group) => sum + group.quantity, 0),
    totalPackedQty: [...grouped.values()].reduce((sum, group) => sum + group.packed, 0),
  }
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}

export function DefinePackingPage() {
  const { id } = useParams<{ id: string }>()
  const soSystemId = Number(id)
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)

  const { data: orderDetail, isLoading: loadingOrder, isError: orderError } = useSalesOrderInternalDetail(soSystemId)
  const { data: packTypes = [], isLoading: loadingPackTypes } = usePackTypes()
  const { data: employees = [] } = useEmployeeOptions()
  const createMutation = useCreateStickerPacking()

  const [editedRowsState, setEditedRowsState] = useState<{
    sourceOrderId: number | null
    rows: StickerPackingRowValue[] | null
  }>({ sourceOrderId: null, rows: null })
  const [serverError, setServerError] = useState('')

  const initialRows = useMemo(
    () =>
      !orderDetail
        ? []
        : orderDetail.stockOutItemsData.map((item, idx) => ({
            index: `${item.sodProductId}-${idx}`,
            productId: item.sodProductId,
            productName: item.productName ?? `Product ${item.sodProductId}`,
            packSize: '',
            packNo: '',
            packQuantity: '',
            quantity: parsePackingNumber(item.sodConfirmedQty ?? item.sodQty),
            sopPackId: null,
            packedBy: null,
          })),
    [orderDetail],
  )

  const rows =
    editedRowsState.sourceOrderId === soSystemId && editedRowsState.rows
      ? editedRowsState.rows
      : initialRows

  function updateRows(
    updater: (current: StickerPackingRowValue[]) => StickerPackingRowValue[],
  ) {
    setEditedRowsState((currentState) => {
      const currentRows =
        currentState.sourceOrderId === soSystemId && currentState.rows
          ? currentState.rows
          : initialRows

      return {
        sourceOrderId: soSystemId,
        rows: updater(currentRows),
      }
    })
  }

  const packTypeOptions = useMemo(
    () =>
      packTypes.map((packType) => ({
        key: packType.packId,
        value: packType.packTypeName,
      })),
    [packTypes],
  )

  const employeeSelectOptions = useMemo(
    () =>
      employees.map((employee) => ({
        key: employee.id,
        value: employee.label,
      })),
    [employees],
  )

  const validation = useMemo(() => validateStickerRows(rows), [rows])
  const summary = useMemo(() => summarizeStickerRows(rows), [rows])
  const globalPackTypeId = useMemo(() => {
    if (rows.length === 0) {
      return null
    }

    const firstPackTypeId = rows[0]?.sopPackId ?? null
    if (firstPackTypeId == null) {
      return null
    }

    return rows.every((row) => row.sopPackId === firstPackTypeId) ? firstPackTypeId : null
  }, [rows])

  function handleGlobalPackTypeChange(packTypeId: number | null) {
    setServerError('')
    updateRows((current) => current.map((row) => ({
      ...row,
      sopPackId: packTypeId,
    })))
  }

  function handleFieldChange(
    index: string,
    field: 'packSize' | 'packNo' | 'sopPackId' | 'packedBy',
    value: string | number | null,
  ) {
    setServerError('')
    updateRows((current) => updateStickerRow(current, index, field, value))
  }

  function handleAutoFill(index: string, enabled: boolean) {
    setServerError('')
    updateRows((current) => applyAutoFill(current, index, enabled))
  }

  function handleRemove(index: string) {
    setServerError('')
    updateRows((current) => removeStickerRow(current, index))
  }

  async function handleSubmit() {
    setServerError('')
    if (!validation.isValid) {
      setServerError(validation.message)
      return
    }

    try {
      const response = await createMutation.mutateAsync(
        rows.map((row) => ({
          soSystemId,
          sopProductId: row.productId,
          sopPackSize: parsePackingNumber(row.packSize),
          sopNoPack: parsePackingNumber(row.packNo),
          sopProductQty: parsePackingNumber(row.packQuantity),
          sopPackId: row.sopPackId,
          packedBy: row.packedBy,
        })),
      )

      const responseError = extractApiResponseErrorMessage(
        response as
          | {
              errMsg?: string
              message?: string
              title?: string
              errors?: Record<string, string[] | undefined> | null
            }
          | null
          | undefined,
      )

      if (responseError) {
        setServerError(responseError)
        return
      }

      showToast({ message: 'Packing defined successfully', type: 'success' })
      navigate('/sticker-packing/orders')
    } catch (submitError) {
      setServerError(extractApiErrorMessage(submitError))
    }
  }

  if (loadingOrder || loadingPackTypes) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading packing data…</span>
      </div>
    )
  }

  if (orderError || !orderDetail) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-800">Failed to load packing data</p>
          <p className="mt-1 text-xs text-red-600">Sales order not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/sticker-packing/orders"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Define Sticker Packing</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Complete pack sizes, pack types, employee assignment, and pack splits so sticker packing stays balanced per product.
          </p>
        </div>
      </div>

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        <SummaryMetric label="Order No" value={orderDetail.soSystemNo} />
        <SummaryMetric label="Customer" value={orderDetail.customerName} />
        <SummaryMetric label="Order Type" value={orderDetail.jobType} />
        <SummaryMetric label="Validation" value={validation.isValid ? 'Ready to save' : 'Needs correction'} />
        <SummaryMetric label="Products" value={String(summary.productCount)} />
        <SummaryMetric label="Rows" value={String(summary.rowCount)} />
        <SummaryMetric label="Order Qty" value={formatPackingNumber(summary.totalOrderQty)} />
        <SummaryMetric label="Packed Qty" value={formatPackingNumber(summary.totalPackedQty)} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-5 max-w-sm">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Pack Type
            </label>
            <div className="mt-2">
              <SearchableSelect
                options={packTypeOptions}
                value={globalPackTypeId}
                onValueChange={handleGlobalPackTypeChange}
                placeholder="Select pack type for all"
                ariaLabel="Global pack type"
                disabled={rows.length === 0 || packTypeOptions.length === 0}
                className="px-3 py-2 text-sm"
                emptyMessage="No pack type options found"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Applying a value here updates the pack type for every row in the packaging grid.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[1240px] text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="min-w-[180px] px-3 py-3">Product</th>
                    <th className="min-w-[110px] px-3 py-3">Order Qty</th>
                    <th className="min-w-[90px] px-3 py-3 text-center">Auto Fill</th>
                    <th className="min-w-[120px] px-3 py-3">Pack Size</th>
                    <th className="min-w-[220px] px-3 py-3">Pack Type</th>
                    <th className="min-w-[110px] px-3 py-3">Pack No</th>
                    <th className="min-w-[120px] px-3 py-3">Pack Qty</th>
                    <th className="min-w-[220px] px-3 py-3">Packed By</th>
                    <th className="min-w-[120px] px-3 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr key={row.index} className="align-top">
                      <td className="px-3 py-3 font-medium text-gray-900">
                        <span className="block truncate" title={row.productName}>{row.productName}</span>
                      </td>
                      <td className="px-3 py-3 text-gray-700">{formatPackingNumber(row.quantity)}</td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isAutoFilled(row)}
                          disabled={row.delete === 1 || row.quantity <= 0}
                          onChange={(event) => handleAutoFill(row.index, event.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.0001"
                          value={row.packSize}
                          onChange={(event) => handleFieldChange(row.index, 'packSize', event.target.value)}
                          className={inputCls}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <SearchableSelect
                          options={packTypeOptions}
                          value={row.sopPackId ?? ''}
                          onValueChange={(value) =>
                            handleFieldChange(
                              row.index,
                              'sopPackId',
                              value,
                            )
                          }
                          placeholder="Select pack type"
                          ariaLabel={`${row.productName} pack type`}
                          className="px-3 py-2 text-sm"
                          emptyMessage="No pack type options found"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.packNo}
                          onChange={(event) => handleFieldChange(row.index, 'packNo', event.target.value)}
                          className={inputCls}
                        />
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-900">{row.packQuantity || '0.0000'}</td>
                      <td className="px-3 py-3">
                        <SearchableSelect
                          options={employeeSelectOptions}
                          value={row.packedBy}
                          onValueChange={(value) =>
                            handleFieldChange(
                              row.index,
                              'packedBy',
                              value,
                            )
                          }
                          placeholder="Select employee"
                          ariaLabel={`${row.productName} packed by`}
                          className="px-3 py-2 text-sm"
                          emptyMessage="No employee options found"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        {row.delete === 1 ? (
                          <button
                            type="button"
                            onClick={() => handleRemove(row.index)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
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

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="action-update inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              <Save size={16} /> Save packing
            </button>
          </div>
      </div>
    </div>
  )
}
