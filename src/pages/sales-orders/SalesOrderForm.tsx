import { useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch, Controller, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { jwtDecode } from 'jwt-decode'
import { Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { PaginatedCombobox } from '@/components/dropdowns'
import { calculateCompleteBill, calculateProductLineTotal, parseNumeric } from '@/features/stock-out/calculations'
import { getStockOutFieldRule } from '@/features/stock-out/fieldRules'
import { useStockOutLookups, useCategories, useSamplesByCategory } from '@/hooks/useStockOut'
import { getAccessToken } from '@/auth/authBridge'
import { createStockOutSchema, type StockOutFormValues } from '@/schemas/stockOutSchema'
import { SalesOrderItemTable } from '@/pages/sales-orders/SalesOrderItemTable'
import { PaymentInfo } from '@/pages/sales-orders/PaymentInfo'
import type { EditMode } from '@/types/stockOut'

interface SalesOrderFormProps {
  defaultValues?: Partial<StockOutFormValues>
  onSubmit: (data: StockOutFormValues) => void
  isSubmitting: boolean
  submitLabel: string
  serverError?: string
  mode?: EditMode
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'

const numberInput = {
  setValueAs: (value: string | number | null | undefined) => {
    if (value === '' || value === undefined || value === null) {
      return 0
    }

    return Number(value)
  },
}

function todayAsInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function getChannelIdFromToken(): number {
  const token = getAccessToken()
  if (!token) return 1
  try {
    const decoded = jwtDecode<{ ChannelId?: number | string; channelId?: number | string }>(token)
    return Number(decoded.ChannelId ?? decoded.channelId ?? 1)
  } catch {
    return 1
  }
}

export function SalesOrderForm({ defaultValues, onSubmit, isSubmitting, submitLabel, serverError, mode = 'standard' }: SalesOrderFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<StockOutFormValues>({
    resolver: zodResolver(createStockOutSchema),
    defaultValues: {
      soCustomerId: null,
      soSupplierId: null,
      soJobTypeId: null,
      soOrderFromId: null,
      invoiceDate: todayAsInputValue(),
      soCustomerReferance: '',
      soRelatedLcId: '',
      soRemarks: '',
      soPriceReview: false,
      billDiscountType: 'F',
      billDiscountRate: 0,
      billVatPercantage: 0,
      billAitPercantage: 0,
      billAdjustmentAmount: 0,
      sobCurrencyName: 'BDT',
      sobCurrencyConversionRate: 1,
      items: [],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const formValues = useWatch({ control }) as StockOutFormValues
  const itemValues = formValues.items ?? []
  const isCreateMode = defaultValues == null
  const customerRule = getStockOutFieldRule(mode, 'soCustomerId')
  const supplierRule = getStockOutFieldRule(mode, 'soSupplierId')
  const jobTypeRule = getStockOutFieldRule(mode, 'soJobTypeId')
  const orderFromRule = getStockOutFieldRule(mode, 'soOrderFromId')
  const invoiceDateRule = getStockOutFieldRule(mode, 'invoiceDate')
  const customerReferenceRule = getStockOutFieldRule(mode, 'soCustomerReferance')
  const relatedLcRule = getStockOutFieldRule(mode, 'soRelatedLcId')
  const remarksRule = getStockOutFieldRule(mode, 'soRemarks')
  const priceReviewRule = getStockOutFieldRule(mode, 'soPriceReview')
  const billDiscountRateRule = getStockOutFieldRule(mode, 'billDiscountRate')
  const billDiscountTypeRule = getStockOutFieldRule(mode, 'billDiscountType')
  const billVatRule = getStockOutFieldRule(mode, 'billVatPercantage')
  const billAitRule = getStockOutFieldRule(mode, 'billAitPercantage')
  const billAdjustmentRule = getStockOutFieldRule(mode, 'billAdjustmentAmount')
  const currencyRule = getStockOutFieldRule(mode, 'sobCurrencyName')
  const conversionRule = getStockOutFieldRule(mode, 'sobCurrencyConversionRate')
  const canAddLine = getStockOutFieldRule(mode, 'product') === 'editable'
  const showBillAdjustments = [
    billDiscountRateRule,
    billDiscountTypeRule,
    billVatRule,
    billAitRule,
    billAdjustmentRule,
    currencyRule,
    conversionRule,
  ].some((rule) => rule !== 'hidden')
  const lockHeaderSelections = isCreateMode && mode === 'standard' && itemValues.length > 0
  const [previewProductId, setPreviewProductId] = useState<number | null>(null)

  useEffect(() => {
    if (!defaultValues) return

    reset({
      soCustomerId: null,
      soSupplierId: null,
      soJobTypeId: null,
      soOrderFromId: null,
      invoiceDate: todayAsInputValue(),
      soCustomerReferance: '',
      soRelatedLcId: '',
      soRemarks: '',
      soPriceReview: false,
      billDiscountType: 'F',
      billDiscountRate: 0,
      billVatPercantage: 0,
      billAitPercantage: 0,
      billAdjustmentAmount: 0,
      sobCurrencyName: 'BDT',
      sobCurrencyConversionRate: 1,
      items: [],
      ...defaultValues,
    })
  }, [defaultValues, reset])

  const billSummary = useMemo(() => {
    const items = itemValues.map((item) => ({
      lineTotal: mode === 'standard'
        ? parseNumeric(item.quantity) * parseNumeric(item.unitPrice)
        : calculateProductLineTotal({
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            discount: item.discountRate,
            discountType: item.discountType,
            vatRate: item.vatRate,
            aitRate: item.aitRate,
          }).lineTotal,
    }))

    return calculateCompleteBill({
      items,
      discount: formValues.billDiscountRate,
      discountType: formValues.billDiscountType,
      vatRate: formValues.billVatPercantage,
      aitRate: formValues.billAitPercantage,
      adjustmentAmount: formValues.billAdjustmentAmount,
      conversionRate: formValues.sobCurrencyConversionRate,
    })
  }, [formValues, itemValues, mode])

  const { data: lookups, isLoading: loadingLookups } = useStockOutLookups()
  const channelId = useMemo(() => getChannelIdFromToken(), [])
  const firstProductId = previewProductId ?? itemValues[0]?.productId ?? null

  const SPECIAL_ORDER_TYPES = ['Sample_Issue', 'Mixing_Issue', 'Exchange_Outward', 'Loan_Issue', 'Purchase_Return', 'Warehouse_Transfer']

  const selectedOrderTypeLabel = useMemo(() => {
    if (!formValues.soJobTypeId || !lookups?.orderTypes) return null
    return lookups.orderTypes.find((t) => t.id === formValues.soJobTypeId)?.label ?? null
  }, [formValues.soJobTypeId, lookups?.orderTypes])

  const isSampleIssue = selectedOrderTypeLabel === 'Sample_Issue'
  const isPurchaseReturn = selectedOrderTypeLabel === 'Purchase_Return'
  const isLcLocal = selectedOrderTypeLabel === 'LC_Local'
  const isWarehouseTransfer = selectedOrderTypeLabel === 'Warehouse_Transfer'
  const isSpecialOrderType = selectedOrderTypeLabel !== null && SPECIAL_ORDER_TYPES.includes(selectedOrderTypeLabel)
  const autoPriceReview = mode === 'standard' && itemValues.some((item) => parseNumeric(item.unitPrice) === 1)

  // Clear the partner field that does not apply when order type changes
  const prevIsPurchaseReturn = useRef<boolean | null>(null)
  useEffect(() => {
    if (prevIsPurchaseReturn.current === null) {
      prevIsPurchaseReturn.current = isPurchaseReturn
      return
    }
    if (prevIsPurchaseReturn.current !== isPurchaseReturn) {
      prevIsPurchaseReturn.current = isPurchaseReturn
      if (isPurchaseReturn) {
        setValue('soCustomerId', null)
      } else {
        setValue('soSupplierId', null)
      }
    }
  }, [isPurchaseReturn, setValue])

  useEffect(() => {
    if (mode !== 'standard' || formValues.soPriceReview === autoPriceReview) return
    setValue('soPriceReview', autoPriceReview)
  }, [autoPriceReview, formValues.soPriceReview, mode, setValue])

  function handleFormSubmit(data: StockOutFormValues) {
    if (!isPurchaseReturn && (!data.soCustomerId || data.soCustomerId < 1)) {
      setError('soCustomerId', { type: 'manual', message: 'Please select a customer' })
      return
    }
    if (isPurchaseReturn && (!data.soSupplierId || data.soSupplierId < 1)) {
      setError('soSupplierId', { type: 'manual', message: 'Please select a supplier' })
      return
    }
    onSubmit(data)
  }

  function handleValidationError(validationErrors: FieldErrors<StockOutFormValues>) {
    const allMessages: string[] = []
    for (const key of Object.keys(validationErrors) as (keyof StockOutFormValues)[]) {
      const fieldError = validationErrors[key]
      if (!fieldError) continue
      if (typeof fieldError === 'object' && 'message' in fieldError && typeof fieldError.message === 'string') {
        allMessages.push(fieldError.message)
      } else if (Array.isArray(fieldError)) {
        for (const itemError of fieldError) {
          if (!itemError) continue
          for (const subErr of Object.values(itemError)) {
            const msg = (subErr as { message?: string })?.message
            if (msg) allMessages.push(msg)
          }
        }
      }
    }
    const message = allMessages.find((m) => m.trim().length > 0) ?? 'Please fix the form errors before submitting'
    setError('items', { type: 'manual', message })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, handleValidationError)} className="w-full">
      {serverError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Two-column layout: main content (left) + sidebar (right) */}
      <div className={`flex gap-6 ${isSpecialOrderType ? 'flex-col' : 'flex-col lg:flex-row lg:items-start'}`}>

        {/* ── LEFT / MAIN COLUMN ── */}
        <div className={`min-w-0 flex-1 space-y-6 ${isSpecialOrderType ? '' : 'lg:max-w-[calc(100%-20rem)]'}`}>

          {/* Order Header Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-700">Partner &amp; Order</h3>

            {/* Row 1: Order Type | Order From */}
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Order Type *" error={errors.soJobTypeId?.message}>
                <select
                  {...register('soJobTypeId', { setValueAs: (value) => (value === '' ? null : Number(value)) })}
                  className={inputCls}
                  disabled={loadingLookups || jobTypeRule !== 'editable' || lockHeaderSelections}
                >
                  <option value="">Select order type</option>
                  {lookups?.orderTypes.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Order From *" error={errors.soOrderFromId?.message}>
                <select
                  {...register('soOrderFromId', { setValueAs: (value) => (value === '' ? null : Number(value)) })}
                  className={inputCls}
                  disabled={loadingLookups || orderFromRule !== 'editable' || lockHeaderSelections}
                >
                  <option value="">Select source</option>
                  {lookups?.orderSources.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Row 2: Customer or Supplier (conditional) */}
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {!isPurchaseReturn && (
                <Field label="Customer *" error={errors.soCustomerId?.message}>
                  <Controller
                    name="soCustomerId"
                    control={control}
                    render={({ field, fieldState }) => (
                      <PaginatedCombobox
                        type="customer"
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Search customer..."
                        hasError={!!fieldState.error}
                        disabled={customerRule !== 'editable' || lockHeaderSelections}
                      />
                    )}
                  />
                </Field>
              )}
              {isPurchaseReturn && (
                <Field label="Supplier *" error={errors.soSupplierId?.message}>
                  <Controller
                    name="soSupplierId"
                    control={control}
                    render={({ field, fieldState }) => (
                      <PaginatedCombobox
                        type="supplier"
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Search supplier..."
                        hasError={!!fieldState.error}
                        disabled={supplierRule !== 'editable' || lockHeaderSelections}
                      />
                    )}
                  />
                </Field>
              )}

              {/* Reference + Date */}
              <Field label="Customer Reference">
                <input
                  {...register('soCustomerReferance')}
                  className={inputCls}
                  placeholder="Reference no."
                  readOnly={customerReferenceRule !== 'editable'}
                />
              </Field>
            </div>

            {/* Row 3: Date | LC ID (conditional) */}
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Order Date *" error={errors.invoiceDate?.message}>
                <input type="date" {...register('invoiceDate')} className={inputCls} readOnly={invoiceDateRule !== 'editable'} />
              </Field>

              {isLcLocal ? (
                <Field label="Related LC ID">
                  <input
                    {...register('soRelatedLcId')}
                    className={inputCls}
                    placeholder="LC identifier"
                    readOnly={relatedLcRule !== 'editable'}
                  />
                </Field>
              ) : (
                <div />
              )}
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                {...register('soPriceReview')}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                disabled={priceReviewRule !== 'editable' || mode === 'standard'}
              />
              Requires price review
            </label>
          </div>

          {/* Product Picker Card */}
          {canAddLine && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-700">Add Products</h3>
              {isSampleIssue ? (
                <SampleByCategoryTabs append={append} existingProductIds={itemValues.map((i) => i.productId)} />
              ) : isWarehouseTransfer ? (
                <WarehouseTransferPicker
                  append={append}
                  existingProductIds={itemValues.map((i) => i.productId)}
                />
              ) : (
                <StandardProductPicker
                  append={append}
                  existingProductIds={itemValues.map((i) => i.productId)}
                  isSampleIssue={isSampleIssue}
                  customerId={!isPurchaseReturn ? formValues.soCustomerId ?? null : null}
                  supplierId={isPurchaseReturn ? formValues.soSupplierId ?? null : null}
                  useLegacyStandardPricing={mode === 'standard'}
                  onPreviewProductChange={setPreviewProductId}
                  showVatAit={!isSpecialOrderType}
                />
              )}
            </div>
          )}

          {/* Items Grid */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <SalesOrderItemTable
              mode={mode}
              hidePricingColumns={isSampleIssue || isWarehouseTransfer}
              register={register}
              fields={fields}
              errors={errors}
              onRemove={remove}
              values={itemValues}
            />
            {errors.items?.message && <p className="px-4 pb-3 text-sm text-red-600">{String(errors.items.message)}</p>}
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-700">Remarks</h3>
            <textarea
              {...register('soRemarks')}
              rows={2}
              className={inputCls}
              placeholder="Operational note for this stock-out order"
              readOnly={remarksRule !== 'editable'}
            />
          </div>

          {/* Buttons for special order types (no sidebar) */}
          {isSpecialOrderType && (
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {submitLabel}
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR (only for non-special order types) ── */}
        {!isSpecialOrderType && (
          <div className="w-full shrink-0 space-y-4 self-start lg:w-72 lg:sticky lg:top-20">

            {/* PaymentInfo */}
            <PaymentInfo
              customerId={formValues.soCustomerId}
              productId={firstProductId}
              channelId={channelId}
            />

            {/* Bill Controls */}
            {showBillAdjustments && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Bill Controls</h3>

                {billVatRule !== 'hidden' && (
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">VAT %</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="0.0"
                      {...register('billVatPercantage', numberInput)}
                      className={inputCls}
                      readOnly={billVatRule !== 'editable'}
                    />
                  </div>
                )}

                {billAitRule !== 'hidden' && (
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">AIT %</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="0.0"
                      {...register('billAitPercantage', numberInput)}
                      className={inputCls}
                      readOnly={billAitRule !== 'editable'}
                    />
                  </div>
                )}

                {billDiscountRateRule !== 'hidden' && (
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      {formValues.billDiscountType === 'P' ? 'Discount Rate %' : 'Discount Amount'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        placeholder="0.00"
                        {...register('billDiscountRate', numberInput)}
                        className={inputCls}
                        readOnly={billDiscountRateRule !== 'editable'}
                      />
                      {billDiscountTypeRule !== 'hidden' && (
                        <label className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5"
                            checked={formValues.billDiscountType === 'P'}
                            onChange={(e) => setValue('billDiscountType', e.target.checked ? 'P' : 'F')}
                            disabled={billDiscountTypeRule !== 'editable'}
                          />
                          %
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {billAdjustmentRule !== 'hidden' && (
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Adjustment Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('billAdjustmentAmount', numberInput)}
                      className={inputCls}
                      readOnly={billAdjustmentRule !== 'editable'}
                    />
                    <p className="mt-1 text-xs text-gray-500">Positive to increase, negative to decrease</p>
                  </div>
                )}

                {currencyRule !== 'hidden' && (
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Currency</label>
                    <select {...register('sobCurrencyName')} className={inputCls} disabled={currencyRule !== 'editable'}>
                      <option value="BDT">BDT</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                )}

                {formValues.sobCurrencyName === 'USD' && conversionRule !== 'hidden' && (
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Conversion Rate</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      {...register('sobCurrencyConversionRate', numberInput)}
                      className={inputCls}
                      readOnly={conversionRule !== 'editable'}
                    />
                  </div>
                )}

                {/* Totals Summary */}
                <div className="mt-2 space-y-1.5 border-t border-gray-200 pt-3 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span className="font-medium">Subtotal:</span>
                    <span>{formValues.sobCurrencyName} {billSummary.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">VAT ({formValues.billVatPercantage ?? 0}%):</span>
                    <span>{formValues.sobCurrencyName} {billSummary.vatAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">AIT ({formValues.billAitPercantage ?? 0}%):</span>
                    <span>{formValues.sobCurrencyName} {billSummary.aitAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Discount:</span>
                    <span>{formValues.sobCurrencyName} {billSummary.discountAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Adjustment:</span>
                    <span>{formValues.sobCurrencyName} {parseNumeric(formValues.billAdjustmentAmount).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                    <span>Final Bill:</span>
                    <span>{formValues.sobCurrencyName} {billSummary.finalTotal}</span>
                  </div>
                  {formValues.sobCurrencyName === 'USD' && (
                    <>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Conversion Rate:</span>
                        <span>{parseNumeric(formValues.sobCurrencyConversionRate).toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-900">
                        <span>Converted:</span>
                        <span>BDT {billSummary.convertedTotal}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {submitLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ── Product picker for non-Sample_Issue types ──
interface StandardProductPickerProps {
  append: (item: StockOutFormValues['items'][number]) => void
  existingProductIds: number[]
  isSampleIssue: boolean
  customerId: number | null
  supplierId: number | null
  useLegacyStandardPricing?: boolean
  onPreviewProductChange?: (productId: number | null) => void
  showVatAit: boolean
}

function StandardProductPicker({
  append,
  existingProductIds,
  showVatAit,
  customerId,
  supplierId,
  useLegacyStandardPricing = false,
  onPreviewProductChange,
}: StandardProductPickerProps) {
  const [productId, setProductId] = useState<number | null>(null)
  const [productLabel, setProductLabel] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('0')
  const [vatRate, setVatRate] = useState('0')
  const [aitRate, setAitRate] = useState('0')
  const [applyVatAit, setApplyVatAit] = useState(false)
  const [discount, setDiscount] = useState('0')
  const [discountIsPercent, setDiscountIsPercent] = useState(false)
  const [error, setError] = useState('')
  const [isPriceFetching, setIsPriceFetching] = useState(false)

  // Per-unit live calculations (matching legacy handleProductCalculateTotal)
  const price = parseFloat(unitPrice || '0')
  const vat = parseFloat(vatRate || '0')
  const ait = parseFloat(aitRate || '0')
  const disc = parseFloat(discount || '0')
  const vatAmt = applyVatAit ? price * (vat / 100) : 0
  const aitAmt = applyVatAit ? price * (ait / 100) : 0
  const sumVatAit = vatAmt + aitAmt
  const priceAfterVatAit = price + sumVatAit
  const discountAmt = discountIsPercent ? priceAfterVatAit * (disc / 100) : disc
  const newPrice = priceAfterVatAit - discountAmt

  useEffect(() => {
    onPreviewProductChange?.(productId)
  }, [onPreviewProductChange, productId])

  async function handleGetPrice() {
    const partnerId = customerId ?? supplierId
    if (!productId) { setError('Select a product first.'); return }
    if (!partnerId) { setError('Select a customer / supplier first.'); return }
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) { setError('Enter a valid quantity first.'); return }
    setError('')
    setIsPriceFetching(true)
    try {
      const res = await apiClient.get<{ errMsg?: string; dataObj?: { data?: { productPrice?: number } } }>(
        `/Price/GetPriceByCustomerAndQty/${productId}/${partnerId}/${qty}`,
      )
      if (res.errMsg) {
        setUnitPrice('0')
      } else {
        setUnitPrice(String(Math.abs(res.dataObj?.data?.productPrice ?? 0)))
      }
    } catch {
      setError('Could not fetch price. Enter manually.')
    } finally {
      setIsPriceFetching(false)
    }
  }

  function handleAdd() {
    if (!productId) { setError('Please select a product.'); return }
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) { setError('Quantity must be greater than 0.'); return }
    if (existingProductIds.includes(productId)) { setError('Product already added.'); return }
    if (newPrice < 0) { setError('New price cannot be negative.'); return }
    setError('')
    const hasDerivedPricing = showVatAit && (applyVatAit || disc !== 0)
    const effectiveUnitPrice = useLegacyStandardPricing && showVatAit ? newPrice : price
    append({
      productId,
      productLabel,
      quantity: qty,
      unitPrice: effectiveUnitPrice,
      baseUnitPrice: hasDerivedPricing ? price : undefined,
      vatRate: applyVatAit ? vat : 0,
      aitRate: applyVatAit ? ait : 0,
      discountRate: disc,
      discountType: discountIsPercent ? 'P' : 'F',
      itemRemark: '',
    })
    setProductId(null)
    setProductLabel('')
    setQuantity('1')
    setUnitPrice('0')
    setVatRate('0')
    setAitRate('0')
    setApplyVatAit(false)
    setDiscount('0')
    setDiscountIsPercent(false)
  }

  const pickerInputCls =
    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
  const disabledInputCls =
    'block w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600'

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
      {/* ── Left column ── */}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Product Name:</label>
          <PaginatedCombobox
            type="product"
            value={productId}
            onValueChange={(id) => { setProductId(id); setError('') }}
            onLabelChange={(label) => setProductLabel(label ?? '')}
            placeholder="Search product..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Quantity:</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={pickerInputCls}
              placeholder="1"
            />
            <button
              type="button"
              onClick={handleGetPrice}
              disabled={isPriceFetching || !productId}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPriceFetching ? <Loader2 size={13} className="animate-spin" /> : null}
              Get Price
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Unit Price:</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className={pickerInputCls}
            placeholder="0.00"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {showVatAit && (
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={applyVatAit}
              onChange={(e) => {
                setApplyVatAit(e.target.checked)
                if (!e.target.checked) { setVatRate('0'); setAitRate('0') }
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            Apply VAT and AIT?
          </label>
        )}
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
        >
          Add Item
        </button>
      </div>

      {/* ── Right column — VAT / AIT / SUM / Discount / New Price ── */}
      {showVatAit && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">VAT:</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                min="0"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                disabled={!applyVatAit}
                className={applyVatAit ? pickerInputCls : disabledInputCls}
                placeholder="0.0"
              />
              <span className="shrink-0 text-sm font-medium text-gray-600">%</span>
              <span className="shrink-0 text-sm text-gray-500">» {vatAmt.toFixed(4)}</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">AIT:</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                min="0"
                value={aitRate}
                onChange={(e) => setAitRate(e.target.value)}
                disabled={!applyVatAit}
                className={applyVatAit ? pickerInputCls : disabledInputCls}
                placeholder="0.0"
              />
              <span className="shrink-0 text-sm font-medium text-gray-600">%</span>
              <span className="shrink-0 text-sm text-gray-500">» {aitAmt.toFixed(4)}</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">SUM(VAT | AIT):</label>
            <input
              type="number"
              value={sumVatAit.toFixed(4)}
              readOnly
              className={disabledInputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Discount:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className={pickerInputCls}
                placeholder="0.00"
              />
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={discountIsPercent}
                  onChange={(e) => setDiscountIsPercent(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                %
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">New Price:</label>
            <input
              type="number"
              value={newPrice.toFixed(4)}
              readOnly
              className={disabledInputCls}
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface WarehouseTransferPickerProps {
  append: (item: StockOutFormValues['items'][number]) => void
  existingProductIds: number[]
}

function WarehouseTransferPicker({ append, existingProductIds }: WarehouseTransferPickerProps) {
  const [productId, setProductId] = useState<number | null>(null)
  const [productLabel, setProductLabel] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState('')

  function handleAdd() {
    if (!productId) { setError('Please select a product.'); return }
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) { setError('Quantity must be greater than 0.'); return }
    if (existingProductIds.includes(productId)) { setError('Product already added.'); return }

    setError('')
    append({
      productId,
      productLabel,
      quantity: qty,
      unitPrice: 0,
      vatRate: 0,
      aitRate: 0,
      discountRate: 0,
      discountType: 'F',
      itemRemark: '',
    })
    setProductId(null)
    setProductLabel('')
    setQuantity('1')
  }

  const inputCls2 =
    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Product Name</label>
          <PaginatedCombobox
            type="product"
            value={productId}
            onValueChange={(id) => { setProductId(id); setError('') }}
            onLabelChange={(label) => setProductLabel(label ?? '')}
            placeholder="Search product..."
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Quantity</label>
          <input
            type="number"
            step="0.0001"
            min="0.0001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputCls2}
            placeholder="1"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleAdd}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
      >
        Add Item
      </button>
    </div>
  )
}

interface SampleByCategoryTabsProps {
  append: (item: StockOutFormValues['items'][number] | StockOutFormValues['items'][number][]) => void
  existingProductIds: number[]
}

function SampleByCategoryTabs({ append, existingProductIds }: SampleByCategoryTabsProps) {
  const [activeTab, setActiveTab] = useState<'category' | 'product'>('product')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [categoryQuantity, setCategoryQuantity] = useState('1')
  const [productId, setProductId] = useState<number | null>(null)
  const [productLabel, setProductLabel] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [addError, setAddError] = useState('')

  const { data: categories = [] } = useCategories()
  const { data: samples, isFetching: loadingSamples } = useSamplesByCategory(selectedCategoryId)

  useEffect(() => {
    if (!samples || samples.length === 0 || !selectedCategoryId) return

    const qty = Math.max(Number(categoryQuantity) || 1, 0.001)
    const existingSet = new Set(existingProductIds)

    const newItems = samples
      .filter((s) => !existingSet.has(s.productId))
      .map((s) => ({
        productId: s.productId,
        productLabel: s.productName,
        quantity: qty,
        unitPrice: 0,
        vatRate: 0,
        aitRate: 0,
        discountRate: 0,
        discountType: 'F' as const,
        itemRemark: '',
      }))

    if (newItems.length > 0) {
      append(newItems)
    }

    setSelectedCategoryId(null)
  }, [samples, selectedCategoryId, categoryQuantity, existingProductIds, append])

  function handleAddByProduct() {
    if (!productId) { setAddError('Please select a product.'); return }
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) { setAddError('Quantity must be greater than 0.'); return }
    const existingSet = new Set(existingProductIds)
    if (existingSet.has(productId)) { setAddError('Product already added.'); return }
    setAddError('')
    append({
      productId,
      productLabel,
      quantity: qty,
      unitPrice: 0,
      vatRate: 0,
      aitRate: 0,
      discountRate: 0,
      discountType: 'F',
      itemRemark: '',
    })
    setProductId(null)
    setProductLabel('')
    setQuantity('1')
  }

  const tabCls = (active: boolean) =>
    active
      ? 'rounded-full bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white'
      : 'rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50'

  const inputCls2 =
    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => setActiveTab('category')} className={tabCls(activeTab === 'category')}>
          Sample By Category
        </button>
        <button type="button" onClick={() => setActiveTab('product')} className={tabCls(activeTab === 'product')}>
          Sample By Product
        </button>
      </div>

      {activeTab === 'category' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Quantity</label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={categoryQuantity}
              onChange={(e) => setCategoryQuantity(e.target.value)}
              className={inputCls2}
              placeholder="1"
            />
            <p className="mt-1 text-xs text-gray-500">Enter quantity greater than 0 (e.g., 0.001, 0.5, 1.25)</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Product Category</label>
            <select
              value={selectedCategoryId ?? ''}
              onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
              className={inputCls2}
              disabled={loadingSamples}
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            {loadingSamples && <p className="mt-1 text-xs text-gray-500">Loading samples...</p>}
          </div>
        </div>
      )}

      {activeTab === 'product' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Product Name</label>
              <PaginatedCombobox
                type="product"
                value={productId}
                onValueChange={(id) => { setProductId(id); setAddError('') }}
                onLabelChange={(label) => setProductLabel(label ?? '')}
                placeholder="Search product..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Quantity</label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={inputCls2}
                placeholder="Enter quantity"
              />
            </div>
          </div>
          {addError && <p className="text-sm text-red-600">{addError}</p>}
          <button
            type="button"
            onClick={handleAddByProduct}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
          >
            Add Item
          </button>
        </div>
      )}
    </div>
  )
}