// ============================================================
// Stock-In — Shared Form Component (Create / Edit / Price-Edit)
// ============================================================
import { useEffect, useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { PaginatedCombobox } from '@/components/dropdowns'
import { useSupplierDetail } from '@/hooks/useSuppliers'
import { stockInSchema, type StockInFormData, type StockInItemFormData } from '@/schemas/stockInSchema'
import { isEditable, isReadonly } from '@/features/stock-in/fieldRules'
import { requiresSupplier, requiresCustomer, isLoanReceive } from '@/features/stock-in/modes'
//import { recalculateBill } from '@/features/stock-in/calculations'
import { calculateTotalQuantity, recalculateBill } from '@/features/stock-in/calculations'
import { STOCK_IN_ORDER_TYPES } from '@/types/stockIn'
import { useStockInLookups, useStockInChannels, useStockInLast3Price } from '@/hooks/useStockIn'
import { StockInItemTable } from '@/pages/stock-in/StockInItemTable'
import { getSubmitToneClass } from '@/lib/actionButtonStyles'
import type { StockInEditMode, StockInLastPriceItem } from '@/types/stockIn'

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

function formatPrice(value: number | null | undefined) {
  if (value == null) return '—'
  return value.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatInvoiceDate(value: string | null | undefined) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getPartnerName(entry: StockInLastPriceItem) {
  return entry.supplierName || entry.customerName || 'Unknown partner'
}

function PriceInsightStat({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string
  value: string
  hint?: string
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border border-white/70 bg-white/80 px-3 py-2 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-base font-semibold ${accent ? 'text-gray-900' : 'text-gray-700'}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

function LastPurchasePricePanel({
  productId,
  productLabel,
  supplierId,
  supplierName,
  customerId,
  customerName,
  currentUnitPrice,
}: {
  productId: number | null
  productLabel: string | null
  supplierId: number | null
  supplierName: string | null
  customerId: number | null
  customerName: string | null
  currentUnitPrice: number
}) {
  const hasProduct = !!productId
  const { data = [], isLoading, isError } = useStockInLast3Price(
    {
      productId: productId ?? 0,
      supplierId: supplierId ?? null,
      customerId: customerId ?? null,
    },
    hasProduct,
  )

  if (!hasProduct) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
        Select a product to preview the last 3 confirmed purchase prices before adding it.
      </div>
    )
  }

  const latestEntry = data[0]
  const averagePrice = data.length
    ? data.reduce((sum, entry) => sum + (entry.sidConfirmedUnitPrice ?? 0), 0) / data.length
    : null
  const currentComparison =
    currentUnitPrice > 0 && latestEntry?.sidConfirmedUnitPrice != null && latestEntry.sidConfirmedUnitPrice > 0
      ? ((currentUnitPrice - latestEntry.sidConfirmedUnitPrice) / latestEntry.sidConfirmedUnitPrice) * 100
      : null
  const currentComparisonLabel =
    currentComparison == null
      ? currentUnitPrice > 0
        ? 'No latest price to compare'
        : 'Enter a unit price to compare'
      : `${currentComparison >= 0 ? '+' : ''}${currentComparison.toFixed(2)}% vs latest`
  const currentComparisonTone =
    currentComparison == null
      ? 'text-gray-500'
      : currentComparison > 0
        ? 'text-amber-700'
        : currentComparison < 0
          ? 'text-emerald-700'
          : 'text-gray-600'
  const contextLabel = supplierName
    ? `Supplier: ${supplierName}`
    : customerName
      ? `Customer: ${customerName}`
      : 'All partner history'

  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-gray-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
            Purchase price signal
          </p>
          <h4 className="mt-1 text-sm font-semibold text-gray-900">{productLabel ?? 'Selected product'}</h4>
          <p className="mt-1 text-xs text-gray-600">{contextLabel}</p>
        </div>
        {data.length > 0 && !isLoading && !isError && (
          <div className="grid min-w-[240px] gap-2 sm:grid-cols-3">
            <PriceInsightStat
              label="Latest"
              value={formatPrice(latestEntry?.sidConfirmedUnitPrice)}
              hint={latestEntry?.siInvoiceNo ? `Invoice ${latestEntry.siInvoiceNo}` : undefined}
              accent
            />
            <PriceInsightStat
              label="3-entry Avg"
              value={formatPrice(averagePrice)}
              hint={data.length < 3 ? `${data.length} record${data.length > 1 ? 's' : ''} found` : 'Based on last 3 entries'}
            />
            <PriceInsightStat
              label="Current Entry"
              value={currentUnitPrice > 0 ? formatPrice(currentUnitPrice) : 'Set price'}
              hint={currentComparisonLabel}
            />
          </div>
        )}
      </div>

      {isLoading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading last 3 prices…
        </div>
      )}

      {isError && !isLoading && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Could not load recent purchase prices for this product.
        </div>
      )}

      {!isLoading && !isError && data.length === 0 && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white/80 px-3 py-3 text-sm text-gray-600">
          No previous confirmed purchase price was found for this product in the current partner context.
        </div>
      )}

      {!isLoading && !isError && data.length > 0 && (
        <>
          <div className={`mt-3 text-xs font-medium ${currentComparisonTone}`}>
            {currentComparisonLabel}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {data.slice(0, 3).map((entry, index) => (
              <div
                key={`${entry.lastSiSystemId ?? index}-${entry.siInvoiceNo ?? index}`}
                className="rounded-lg border border-white/70 bg-white/85 p-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                    {index === 0 ? 'Latest' : `Previous ${index}`}
                  </span>
                  <span className="text-[11px] text-gray-500">{formatInvoiceDate(entry.siInvoiceDate)}</span>
                </div>
                <p className="mt-3 text-xl font-semibold text-gray-900">
                  {formatPrice(entry.sidConfirmedUnitPrice)}
                </p>
                <p className="mt-1 text-xs font-medium text-gray-700">
                  Invoice {entry.siInvoiceNo ?? '—'}
                </p>
                <p className="mt-1 text-xs text-gray-500">{getPartnerName(entry)}</p>
                <p className="mt-2 text-[11px] text-gray-400">
                  Stock-In #{entry.lastSiSystemId ?? '—'}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
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
  const watchedSupplierId = watch('siSupplierId')
  const watchedSupplierName = watch('supplierName')
  const watchedSupplierAddress = watch('supplierAddress')
  const watchedCustomerId = watch('siCustomerId')
  const watchedCustomerName = watch('customerName')
  const watchedItems = watch('items')
  const watchedInvoiceStatus = watch('siInvoiceReceiveStatus')
  const watchedDiscountAmount = useWatch({ control, name: 'sibDiscountAmouunt' })
  const watchedAdjustedAmount = useWatch({ control, name: 'sibAdjustedAmount' })
  const { data: selectedSupplier } = useSupplierDetail(watchedSupplierId ?? undefined)
const totalQuantity = calculateTotalQuantity(watchedItems ?? [])

  useEffect(() => {
    if (!watchedSupplierId) {
      setValue('supplierAddress', null)
      return
    }

    if (selectedSupplier?.supplierId === watchedSupplierId) {
      setValue('supplierAddress', selectedSupplier.supplierAddress ?? null)
    }
  }, [selectedSupplier, setValue, watchedSupplierId])
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
  const [newQty, setNewQty] = useState<number>(1)
  const [newUnitPrice, setNewUnitPrice] = useState<number>(0)

  const addItemRestrictionMessage = needsSupplier && !watchedSupplierId
    ? 'Select a supplier before adding items to the grid.'
    : needsCustomer && !watchedCustomerId
      ? 'Select a customer before adding items to the grid.'
      : null

  function handleAddItem() {
    if (!newProductId || addItemRestrictionMessage) return
    const newItem: StockInItemFormData = {
      sidProductId: newProductId,
      productName: newProductLabel ?? '',
      sidDeclaredQty: newQty,
      sidDeclaredUnitPrice: newUnitPrice,
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
    setNewQty(1)
    setNewUnitPrice(0)
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
                    onValueChange={(v) => {
                      field.onChange(v)
                      if (v == null) setValue('supplierAddress', null)
                    }}
                    onLabelChange={(label) => setValue('supplierName', label)}
                    selectedLabel={watch('supplierName')}
                    disabled={!supplierEditable}
                    hasError={!!fieldState.error}
                    placeholder="Search supplier..."
                  />
                )}
              />
              {watchedSupplierId && (
                <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="text-xs font-medium text-gray-500">Supplier Address</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {watchedSupplierAddress?.trim() || 'Address not available'}
                  </p>
                </div>
              )}
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
        <div className="mb-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Items
            </h3>
          </div>
          {productEditable && (
            <>
              <div className="flex flex-wrap items-end gap-2">
              <div className="w-72">
                <label className="mb-1 block text-xs font-medium text-gray-500">Product</label>
                <PaginatedCombobox
                  type="product"
                  value={newProductId}
                  onValueChange={setNewProductId}
                  onLabelChange={setNewProductLabel}
                  placeholder="Search product to add..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Quantity</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value) || 0)}
                  className="block w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  placeholder="Qty"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Unit Price</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={newUnitPrice}
                  onChange={(e) => setNewUnitPrice(Number(e.target.value) || 0)}
                  className="block w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  placeholder="Unit Price"
                />
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!newProductId || !!addItemRestrictionMessage}
                className="action-insert inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
              {addItemRestrictionMessage && (
                <p className="max-w-64 text-xs text-amber-700">{addItemRestrictionMessage}</p>
              )}
              </div>

              <LastPurchasePricePanel
                productId={newProductId}
                productLabel={newProductLabel}
                supplierId={watchedSupplierId}
                supplierName={watchedSupplierName}
                customerId={watchedCustomerId}
                customerName={watchedCustomerName}
                currentUnitPrice={newUnitPrice}
              />
            </>
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
      {/* ── Bill Summary ──────────────────────────────────────── */}
<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
    Bill Summary
  </h3>

  <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
    <div>
      <label className={labelCls}>Total Quantity</label>
      <input
        type="number"
        value={totalQuantity.toFixed(4)}
        className={inputCls}
        readOnly
      />
    </div>

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
          className={`${getSubmitToneClass(submitLabel)} inline-flex items-center gap-2 rounded-lg bg-gray-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
