// ============================================================
// Stock-In — Shared Form Component (Create / Edit / Price-Edit)
// ============================================================
import { useEffect, useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { stockInSchema, type StockInFormData, type StockInItemFormData } from '@/schemas/stockInSchema'
import { isEditable, isReadonly } from '@/features/stock-in/fieldRules'
import { requiresSupplier, requiresCustomer, isLoanReceive } from '@/features/stock-in/modes'
import { recalculateBill } from '@/features/stock-in/calculations'
import { STOCK_IN_ORDER_TYPES } from '@/types/stockIn'
import { useStockInLookups, useStockInChannels } from '@/hooks/useStockIn'
import { StockInItemTable } from '@/pages/stock-in/StockInItemTable'
import type { StockInEditMode } from '@/types/stockIn'

interface StockInFormProps {
  mode?: StockInEditMode
  defaultValues?: Partial<StockInFormData>
  onSubmit: (data: StockInFormData) => void
  isSubmitting: boolean
  submitLabel: string
  serverError?: string
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'

const labelCls = 'mb-1 block text-sm font-medium text-gray-700'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function StockInForm({
  mode = 'standard',
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  serverError,
}: StockInFormProps) {
  const { data: lookups } = useStockInLookups()
  const { data: channels, isLoading: channelsLoading } = useStockInChannels()
  const orderTypes = lookups?.orderTypes?.length ? lookups.orderTypes : STOCK_IN_ORDER_TYPES

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StockInFormData>({
    resolver: zodResolver(stockInSchema),
    defaultValues: {
      siInvoiceNo: '',
      siInvoiceDate: todayIso(),
      siJobTypeId: 0,
      jobTypeName: '',
      siRemarks: null,
      siSourceChannelId: 0,
      siSourceChannelName: null,
      siDestinationChannelId: 0,
      siDestinationChannelName: null,
      siSupplierId: null,
      supplierName: null,
      supplierAddress: null,
      siCustomerId: null,
      customerName: null,
      customerAddress: null,
      siInvoiceReceiveStatus: false,
      siInvoiceReceiveDate: null,
      sibCalculatedAmount: 0,
      sibDiscountAmouunt: 0,
      sibAdjustedAmount: 0,
      sibFinalAmount: 0,
      sibCurrencyName: 'BDT',
      items: [],
      ...defaultValues,
    },
  })

  // Reset form when defaultValues change (edit page navigates to a new order)
  useEffect(() => {
    if (defaultValues) {
      reset({
        siInvoiceNo: '',
        siInvoiceDate: todayIso(),
        siJobTypeId: 0,
        jobTypeName: '',
        siRemarks: null,
        siSourceChannelId: 0,
        siSourceChannelName: null,
        siDestinationChannelId: 0,
        siDestinationChannelName: null,
        siSupplierId: null,
        supplierName: null,
        supplierAddress: null,
        siCustomerId: null,
        customerName: null,
        customerAddress: null,
        siInvoiceReceiveStatus: false,
        siInvoiceReceiveDate: null,
        sibCalculatedAmount: 0,
        sibDiscountAmouunt: 0,
        sibAdjustedAmount: 0,
        sibFinalAmount: 0,
        sibCurrencyName: 'BDT',
        items: [],
        ...defaultValues,
      })
    }
  }, [defaultValues, reset])

  const watchedJobTypeId = watch('siJobTypeId')
  const watchedJobTypeName = watch('jobTypeName')
  const watchedItems = watch('items')
  const watchedInvoiceStatus = watch('siInvoiceReceiveStatus')
  const watchedDiscountAmount = useWatch({ control, name: 'sibDiscountAmouunt' })
  const watchedAdjustedAmount = useWatch({ control, name: 'sibAdjustedAmount' })

  // Derive supplier/customer requirement from order type name
  const needsSupplier = requiresSupplier(watchedJobTypeName)
  const needsCustomer = requiresCustomer(watchedJobTypeName)
  const isLoanType = isLoanReceive(watchedJobTypeName)

  // Local items state (sync to form)
  const [items, setItems] = useState<StockInItemFormData[]>(defaultValues?.items ?? [])

  useEffect(() => {
    setItems(watchedItems ?? [])
  }, [watchedItems])

  useEffect(() => {
    const bill = recalculateBill(
      (watchedItems ?? []).map((item) => ({
        sidDeclaredQty: item.sidDeclaredQty ?? 0,
        sidDeclaredUnitPrice: item.sidDeclaredUnitPrice ?? 0,
      })),
      watchedDiscountAmount,
      watchedAdjustedAmount,
    )

    setValue('sibCalculatedAmount', bill.sibCalculatedAmount, {
      shouldDirty: false,
      shouldValidate: false,
    })
    setValue('sibFinalAmount', bill.sibFinalAmount, {
      shouldDirty: false,
      shouldValidate: false,
    })
  }, [setValue, watchedAdjustedAmount, watchedDiscountAmount, watchedItems])

  function syncItems(newItems: StockInItemFormData[]) {
    setItems(newItems)
    setValue('items', newItems, { shouldValidate: true })
  }

  function updateItems(
    updater: (currentItems: StockInItemFormData[]) => StockInItemFormData[],
  ) {
    const currentItems = getValues('items') ?? items ?? []
    const nextItems = updater(currentItems)
    syncItems(nextItems)
  }

  function handleItemChange(index: number, field: keyof StockInItemFormData, value: unknown) {
    updateItems((currentItems) =>
      currentItems.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    )
  }

  function handleItemPatch(index: number, patch: Partial<StockInItemFormData>) {
    updateItems((currentItems) =>
      currentItems.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    )
  }

  function handleRemoveItem(index: number) {
    updateItems((currentItems) => currentItems.filter((_, i) => i !== index))
  }

  // New item picker state
  const [newProductId, setNewProductId] = useState<number | null>(null)
  const [newProductLabel, setNewProductLabel] = useState<string | null>(null)

  function handleAddItem() {
    if (!newProductId) return
    const newItem: StockInItemFormData = {
      sidProductId: newProductId,
      productName: newProductLabel ?? '',
      sidDeclaredQty: 1,
      sidDeclaredUnitPrice: 0,
      sidConfirmedQty: null,
      sidConfirmedUnitPrice: null,
      sidProductStrength: null,
      sidBatches: [],
      sidPacks: [],
      sidMappedProductId: null,
      sidMappedProductName: null,
    }
    syncItems([...items, newItem])
    setNewProductId(null)
    setNewProductLabel(null)
  }

  function handleOrderTypeChange(id: number | null) {
    setValue('siJobTypeId', id ?? 0)
    const selected = orderTypes.find((t) => t.id === id)
    setValue('jobTypeName', selected?.label ?? '')
    // Reset partner fields when type changes
    setValue('siSupplierId', null)
    setValue('supplierName', null)
    setValue('siCustomerId', null)
    setValue('customerName', null)
  }

  // Field rules
  const invoiceNoEditable = isEditable(mode, 'siInvoiceNo')
  const invoiceDateEditable = isEditable(mode, 'siInvoiceDate')
  const orderTypeEditable = isEditable(mode, 'siJobTypeId')
  const sourceChEditable = isEditable(mode, 'siSourceChannelId')
  const destChEditable = isEditable(mode, 'siDestinationChannelId')
  const supplierEditable = isEditable(mode, 'siSupplierId')
  const customerEditable = isEditable(mode, 'siCustomerId')
  const remarksEditable = isEditable(mode, 'siRemarks')
  const invoiceRecvEditable = isEditable(mode, 'siInvoiceReceiveStatus')
  const productEditable = isEditable(mode, 'product')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Header Fields ────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Order Details
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Invoice / Reference Number */}
          <div>
            <label className={labelCls}>
              Invoice / Ref No. <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('siInvoiceNo')}
              className={inputCls}
              readOnly={!invoiceNoEditable}
              placeholder="Enter invoice or reference number"
            />
            {errors.siInvoiceNo && (
              <p className="mt-1 text-xs text-red-600">{errors.siInvoiceNo.message}</p>
            )}
          </div>

          {/* Invoice Date */}
          <div>
            <label className={labelCls}>
              Invoice Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('siInvoiceDate')}
              className={inputCls}
              readOnly={!invoiceDateEditable}
            />
            {errors.siInvoiceDate && (
              <p className="mt-1 text-xs text-red-600">{errors.siInvoiceDate.message}</p>
            )}
          </div>

          {/* Order Type */}
          <div>
            <label className={labelCls}>
              Order Type <span className="text-red-500">*</span>
            </label>
            {orderTypeEditable ? (
              <Controller
                name="siJobTypeId"
                control={control}
                render={({ field, fieldState }) => (
                  <select
                    value={field.value ?? ''}
                    onChange={(e) => handleOrderTypeChange(Number(e.target.value) || null)}
                    className={inputCls + (fieldState.error ? ' border-red-500' : '')}
                  >
                    <option value="">Select order type...</option>
                    {orderTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            ) : (
              <input type="text" value={watchedJobTypeName ?? ''} readOnly className={inputCls} />
            )}
            {errors.siJobTypeId && (
              <p className="mt-1 text-xs text-red-600">{String(errors.siJobTypeId.message)}</p>
            )}
          </div>

          {/* Source Channel */}
          <div>
            <label className={labelCls}>
              Source Channel <span className="text-red-500">*</span>
            </label>
            <Controller
              name="siSourceChannelId"
              control={control}
              render={({ field, fieldState }) => (
                <select
                  value={field.value || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value) || 0
                    field.onChange(id)
                    const name = channels?.find((c) => c.id === id)?.label ?? null
                    setValue('siSourceChannelName', name)
                  }}
                  disabled={!sourceChEditable || channelsLoading}
                  className={
                    inputCls +
                    (fieldState.error ? ' border-red-500' : '') +
                    (!sourceChEditable ? ' bg-gray-100 text-gray-500' : '')
                  }
                >
                  <option value="">
                    {channelsLoading ? 'Loading channels…' : 'Select source channel…'}
                  </option>
                  {(channels ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.siSourceChannelId && (
              <p className="mt-1 text-xs text-red-600">{String(errors.siSourceChannelId.message)}</p>
            )}
          </div>

          {/* Destination Channel */}
          <div>
            <label className={labelCls}>
              Destination Channel <span className="text-red-500">*</span>
            </label>
            <Controller
              name="siDestinationChannelId"
              control={control}
              render={({ field, fieldState }) => (
                <select
                  value={field.value || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value) || 0
                    field.onChange(id)
                    const name = channels?.find((c) => c.id === id)?.label ?? null
                    setValue('siDestinationChannelName', name)
                  }}
                  disabled={!destChEditable || channelsLoading}
                  className={
                    inputCls +
                    (fieldState.error ? ' border-red-500' : '') +
                    (!destChEditable ? ' bg-gray-100 text-gray-500' : '')
                  }
                >
                  <option value="">
                    {channelsLoading ? 'Loading channels…' : 'Select destination channel…'}
                  </option>
                  {(channels ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.siDestinationChannelId && (
              <p className="mt-1 text-xs text-red-600">
                {errors.siDestinationChannelId.message}
              </p>
            )}
          </div>

          {/* Supplier (shown only for supplier-type orders) */}
          {(needsSupplier || isReadonly(mode, 'siSupplierId')) && (
            <div>
              <label className={labelCls}>
                Supplier {needsSupplier && <span className="text-red-500">*</span>}
              </label>
              <Controller
                name="siSupplierId"
                control={control}
                render={({ field, fieldState }) => (
                  <PaginatedCombobox
                    type="supplier"
                    value={field.value}
                    onValueChange={(v) => field.onChange(v)}
                    onLabelChange={(label) => setValue('supplierName', label)}
                    selectedLabel={watch('supplierName')}
                    disabled={!supplierEditable}
                    hasError={!!fieldState.error}
                    placeholder="Search supplier..."
                  />
                )}
              />
              {errors.siSupplierId && (
                <p className="mt-1 text-xs text-red-600">{String(errors.siSupplierId.message)}</p>
              )}
            </div>
          )}

          {/* Customer (shown only for customer-type orders) */}
          {(needsCustomer || isReadonly(mode, 'siCustomerId')) && (
            <div>
              <label className={labelCls}>
                Customer {needsCustomer && <span className="text-red-500">*</span>}
              </label>
              <Controller
                name="siCustomerId"
                control={control}
                render={({ field, fieldState }) => (
                  <PaginatedCombobox
                    type="customer"
                    value={field.value}
                    onValueChange={(v) => field.onChange(v)}
                    onLabelChange={(label) => setValue('customerName', label)}
                    selectedLabel={watch('customerName')}
                    disabled={!customerEditable}
                    hasError={!!fieldState.error}
                    placeholder="Search customer..."
                  />
                )}
              />
              {errors.siCustomerId && (
                <p className="mt-1 text-xs text-red-600">{String(errors.siCustomerId.message)}</p>
              )}
            </div>
          )}

          {/* Remarks */}
          <div className="sm:col-span-2">
            <label className={labelCls}>Remarks</label>
            <input
              type="text"
              {...register('siRemarks')}
              className={inputCls}
              readOnly={!remarksEditable}
              placeholder="Optional notes"
            />
          </div>

          {/* Invoice Receive Status */}
          {invoiceRecvEditable && (
            <div className="flex items-center gap-3 sm:col-span-2">
              <Controller
                name="siInvoiceReceiveStatus"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="siInvoiceReceiveStatus"
                    checked={field.value ?? false}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-800"
                  />
                )}
              />
              <label
                htmlFor="siInvoiceReceiveStatus"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Physical Invoice Received
              </label>
              {watchedInvoiceStatus && (
                <input
                  type="date"
                  {...register('siInvoiceReceiveDate')}
                  className={inputCls + ' ml-4 w-44'}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Items Section ─────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Items
          </h3>
          {productEditable && (
            <div className="flex items-center gap-2">
              <div className="w-72">
                <PaginatedCombobox
                  type="product"
                  value={newProductId}
                  onValueChange={setNewProductId}
                  onLabelChange={setNewProductLabel}
                  placeholder="Search product to add..."
                />
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!newProductId}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>
          )}
        </div>

        <StockInItemTable
          mode={mode}
          items={items}
          onItemChange={handleItemChange}
          onItemPatch={handleItemPatch}
          onRemoveItem={handleRemoveItem}
          showMappedProduct={isLoanType}
        />
        {errors.items?.root && (
          <p className="mt-2 text-xs text-red-600">{errors.items.root.message}</p>
        )}
        {errors.items?.message && (
          <p className="mt-2 text-xs text-red-600">{String(errors.items.message)}</p>
        )}
      </div>

      {/* ── Bill Summary ──────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Bill Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelCls}>Subtotal</label>
            <input
              type="number"
              {...register('sibCalculatedAmount', { setValueAs: Number })}
              className={inputCls}
              readOnly
            />
          </div>
          <div>
            <label className={labelCls}>Discount</label>
            <input
              type="number"
              step="0.01"
              {...register('sibDiscountAmouunt', { setValueAs: Number })}
              className={inputCls}
              readOnly={mode !== 'standard'}
            />
          </div>
          <div>
            <label className={labelCls}>Adjustment</label>
            <input
              type="number"
              step="0.01"
              {...register('sibAdjustedAmount', { setValueAs: Number })}
              className={inputCls}
              readOnly={mode !== 'standard'}
            />
          </div>
          <div>
            <label className={labelCls}>Final Total</label>
            <input
              type="number"
              {...register('sibFinalAmount', { setValueAs: Number })}
              className={inputCls + ' font-semibold'}
              readOnly
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label className="text-sm text-gray-600">Currency:</label>
          <input
            type="text"
            {...register('sibCurrencyName')}
            className={inputCls + ' w-24'}
            readOnly={mode !== 'standard'}
          />
        </div>
      </div>

      {/* ── Server Error ──────────────────────────────────────── */}
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* ── Submit ────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
