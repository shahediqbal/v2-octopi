import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { PaginatedCombobox } from '@/components/dropdowns/PaginatedCombobox'
import { DropdownSelect } from '@/components/dropdowns/DropdownSelect'
import { useCustomerDetail } from '@/hooks/useCustomers'
import { usePiDetail, usePiNumbers, useUpdatePi } from '@/hooks/useLcTracking'
import { useToastStore } from '@/stores/toastStore'
import type { ApiResponse, PiConditions, PiProductDetail, UpdatePiPayload } from '@/types/lcTracking'

const INPUT =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
const TEXTAREA =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
const READONLY_INPUT =
  'w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 focus:outline-none'
const READONLY_PI_NUMBER_INPUT =
  'w-full rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 focus:outline-none'
const SECTION_LABEL = 'mb-1 block text-sm font-bold text-gray-700'
const TABLE_INPUT =
  'w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-200'

interface DraftProduct {
  id: number | null
  label: string
  quantity: number
  unitPrice: number
  convertedPrice: number
  totalAmount: number
}

interface PiDraftItem {
  productId: number
  productName: string
  unitPrice: number
  quantity: number
  convertedPrice: number
  piProductPriceConvertionRate: number
  piLineTotalAmount: number
}

const INITIAL_DRAFT_PRODUCT: DraftProduct = {
  id: null,
  label: '',
  quantity: 1,
  unitPrice: 0,
  convertedPrice: 0,
  totalAmount: 0,
}

function toPositiveNumber(value: number | string) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return 0
  }
  return Math.abs(numeric)
}

function roundTo(value: number, digits = 4) {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Number(value.toFixed(digits))
}

function roundMoney(value: number) {
  return roundTo(value, 2)
}

function formatFixed(value: number, digits = 2) {
  if (!Number.isFinite(value)) {
    return '0.00'
  }
  return value.toFixed(digits)
}

function recomputeDraftProduct(product: DraftProduct, conversionRate: number) {
  const rate = conversionRate > 0 ? conversionRate : 1
  const quantity = toPositiveNumber(product.quantity) || 0
  const unitPrice = toPositiveNumber(product.unitPrice)
  const convertedPrice = rate > 0 ? roundTo(unitPrice / rate, 4) : 0
  const totalAmount = roundTo(convertedPrice * quantity, 4)

  return {
    ...product,
    quantity,
    unitPrice,
    convertedPrice,
    totalAmount,
  }
}

function extractPiPrice(response: {
  errMsg?: string
  dataObj?: {
    data?: { productPrice?: number; price?: number } | null
    productPrice?: number
    price?: number
  } | null
}) {
  if (response.errMsg === 'No base price found for this product!') {
    return 0
  }

  return Math.abs(
    response.dataObj?.data?.productPrice
      ?? response.dataObj?.data?.price
      ?? response.dataObj?.productPrice
      ?? response.dataObj?.price
      ?? 0,
  )
}

function normalizeDateForInput(value: string | undefined) {
  if (!value) {
    return new Date().toISOString().split('T')[0] ?? ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10)
  }

  return date.toISOString().split('T')[0] ?? ''
}

function toMappedPiId(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

function buildItemFromDetail(item: PiProductDetail): PiDraftItem {
  const quantity = roundMoney(toPositiveNumber(item.piProductQuantity) || 1)
  const convertedPrice = roundMoney(toPositiveNumber(item.piProductPrice))
  const rate = roundMoney(toPositiveNumber(item.piProductPriceConvertionRate) || 1)
  const unitPrice = roundTo(convertedPrice * (rate > 0 ? rate : 1), 4)
  const totalAmount = roundMoney(
    toPositiveNumber(item.piLineTotalAmount) || (convertedPrice * quantity),
  )

  return {
    productId: item.piProductId,
    productName: item.productName || `Product ${item.piProductId}`,
    unitPrice,
    quantity,
    convertedPrice,
    piProductPriceConvertionRate: rate > 0 ? rate : 1,
    piLineTotalAmount: totalAmount,
  }
}

export function EditPiPage() {
  const { id } = useParams<{ id: string }>()
  const piId = Number(id ?? 0)
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)
  const [serverError, setServerError] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [customerLabel, setCustomerLabel] = useState('')
  const [piNumber, setPiNumber] = useState('')
  const [piDate, setPiDate] = useState('')
  const [piRef, setPiRef] = useState('')
  const [piCurrency, setPiCurrency] = useState<'USD' | 'BDT'>('USD')
  const [piConversionRate, setPiConversionRate] = useState(1)
  const [piBenificaryBankId, setPiBenificaryBankId] = useState<number | null>(null)
  const [piBranchBankLocationId, setPiBranchBankLocationId] = useState<number | null>(null)
  const [lcPaymentTermsId, setLcPaymentTermsId] = useState<number | null>(null)
  const [piNote, setPiNote] = useState('')
  const [mapWithExistingPi, setMapWithExistingPi] = useState(false)
  const [piNumberMapped, setPiNumberMapped] = useState<number | null>(null)
  const [draftProduct, setDraftProduct] = useState<DraftProduct>(INITIAL_DRAFT_PRODUCT)
  const [items, setItems] = useState<PiDraftItem[]>([])
  const [isPriceLoading, setIsPriceLoading] = useState(false)

  const { data, isLoading, isError } = usePiDetail(piId)
  const updateMutation = useUpdatePi()
  const { data: customer } = useCustomerDetail(customerId ?? undefined)
  const { data: piNumbers = [], isFetching: loadingPiNumbers } = usePiNumbers(customerId ?? null)

  const totalPiValue = useMemo(
    () => roundMoney(items.reduce((sum, item) => sum + toPositiveNumber(item.piLineTotalAmount), 0)),
    [items],
  )
  const totalQuantity = useMemo(
    () => roundMoney(items.reduce((sum, item) => sum + toPositiveNumber(item.quantity), 0)),
    [items],
  )
  const totalItemCount = items.length
  const effectiveConversionRate = piCurrency === 'BDT' ? 1 : (piConversionRate > 0 ? piConversionRate : 1)
  const customerAddress = customer?.customerAddress
    ?? (customerId === data?.piCustmomerId ? data?.customerAddress : undefined)
    ?? 'Not Available'

  useEffect(() => {
    if (!data) {
      return
    }

    const mappedPiId = toMappedPiId(data.piNumberMapped)
    const detailWithLegacyRate = data as typeof data & { piConvertionRate?: number }
    const nextCurrency = data.piCurrency === 'BDT' ? 'BDT' : 'USD'
    const nextConversionRate = nextCurrency === 'BDT'
      ? 1
      : (toPositiveNumber(data.piConversionRate ?? detailWithLegacyRate.piConvertionRate ?? 1) || 1)

    setCustomerId(data.piCustmomerId ?? null)
    setCustomerLabel(data.customerName ?? '')
    setPiNumber(data.piNumber ?? '')
    setPiDate(normalizeDateForInput(data.piDate))
    setPiRef(data.piRef ?? '')
    setPiCurrency(nextCurrency)
    setPiConversionRate(nextConversionRate)
    setPiBenificaryBankId(data.piBenificaryBankId ?? null)
    setPiBranchBankLocationId(data.piBranchBankLocationId ?? null)
    setLcPaymentTermsId(data.lcPaymentTermsId ?? null)
    setPiNote(data.piNote ?? '')
    setMapWithExistingPi(mappedPiId != null)
    setPiNumberMapped(mappedPiId)
    setDraftProduct(INITIAL_DRAFT_PRODUCT)
    setItems((data.piProductDetailsInfo ?? []).map(buildItemFromDetail))
    setServerError('')
    setIsInitialized(true)
  }, [data])

  useEffect(() => {
    setDraftProduct((prev) => {
      if (!prev.id && prev.unitPrice === 0 && prev.convertedPrice === 0 && prev.totalAmount === 0) {
        return prev
      }

      const next = recomputeDraftProduct(prev, effectiveConversionRate)
      if (
        next.convertedPrice === prev.convertedPrice
        && next.totalAmount === prev.totalAmount
        && next.unitPrice === prev.unitPrice
        && next.quantity === prev.quantity
      ) {
        return prev
      }

      return next
    })
  }, [effectiveConversionRate])

  useEffect(() => {
    if (!mapWithExistingPi) {
      setPiNumberMapped(null)
    }
  }, [mapWithExistingPi])

  const handleCurrencyChange = (currency: 'USD' | 'BDT') => {
    setPiCurrency(currency)
    if (currency === 'BDT') {
      setPiConversionRate(1)
      setDraftProduct((prev) => recomputeDraftProduct(prev, 1))
    }
  }

  const handleDraftNumericChange = (
    field: 'unitPrice' | 'convertedPrice' | 'quantity',
    rawValue: string,
  ) => {
    const numericValue = toPositiveNumber(rawValue)

    setDraftProduct((prev) => {
      const quantity = field === 'quantity' ? numericValue : toPositiveNumber(prev.quantity)
      const unitPrice = field === 'unitPrice' ? numericValue : toPositiveNumber(prev.unitPrice)
      let convertedPrice = field === 'convertedPrice' ? numericValue : toPositiveNumber(prev.convertedPrice)
      let nextConversionRate = effectiveConversionRate

      if (field === 'unitPrice') {
        convertedPrice = nextConversionRate > 0 ? roundTo(unitPrice / nextConversionRate, 4) : 0
      }

      if (field === 'convertedPrice') {
        nextConversionRate = convertedPrice > 0 ? roundTo(unitPrice / convertedPrice, 4) : 0
        if (piCurrency !== 'BDT') {
          setPiConversionRate(nextConversionRate)
        }
      }

      const totalAmount = roundTo(convertedPrice * quantity, 4)

      return {
        ...prev,
        quantity,
        unitPrice,
        convertedPrice,
        totalAmount,
      }
    })
  }

  const handleGetPrice = async () => {
    if (!draftProduct.id || !customerId || !draftProduct.quantity) {
      const fieldName = !draftProduct.id
        ? 'Product Name'
        : !customerId
          ? 'Customer Name'
          : 'Product Quantity'
      setServerError(`${fieldName} Missing!`)
      return
    }

    setServerError('')
    setIsPriceLoading(true)

    try {
      const response = await apiClient.get<ApiResponse<{
        data?: { productPrice?: number; price?: number } | null
        productPrice?: number
        price?: number
      }>>(`/Price/GetPriceByCustomerAndQty/${draftProduct.id}/${customerId}/${draftProduct.quantity}`)

      const nextUnitPrice = extractPiPrice(response)
      setDraftProduct((prev) => recomputeDraftProduct({ ...prev, unitPrice: nextUnitPrice }, effectiveConversionRate))
    } catch (error) {
      setServerError((error as Error).message || 'Failed to fetch price')
    } finally {
      setIsPriceLoading(false)
    }
  }

  const handleAddItem = () => {
    if (!customerId || !draftProduct.id) {
      setServerError('Customer Name or Product Name Missing!')
      return
    }

    const nextItem: PiDraftItem = {
      productId: draftProduct.id,
      productName: draftProduct.label,
      unitPrice: roundTo(draftProduct.unitPrice, 4),
      quantity: roundMoney(draftProduct.quantity),
      convertedPrice: roundMoney(draftProduct.convertedPrice),
      piProductPriceConvertionRate: roundMoney(effectiveConversionRate),
      piLineTotalAmount: roundMoney(draftProduct.convertedPrice * draftProduct.quantity),
    }

    setItems((prev) => [...prev, nextItem])
    setDraftProduct(INITIAL_DRAFT_PRODUCT)
    setServerError('')
  }

  const handleItemEdit = (
    index: number,
    field: 'piProductPriceConvertionRate' | 'convertedPrice' | 'quantity' | 'piLineTotalAmount',
    rawValue: string,
  ) => {
    const numericValue = toPositiveNumber(rawValue)

    setItems((prev) => prev.map((item, itemIndex) => {
      if (itemIndex !== index) {
        return item
      }

      let nextQuantity = field === 'quantity' ? numericValue : toPositiveNumber(item.quantity)
      let nextConvertedPrice = field === 'convertedPrice' ? numericValue : toPositiveNumber(item.convertedPrice)
      let nextRate = field === 'piProductPriceConvertionRate'
        ? numericValue
        : toPositiveNumber(item.piProductPriceConvertionRate)
      let nextLineTotal = field === 'piLineTotalAmount' ? numericValue : toPositiveNumber(item.piLineTotalAmount)

      if (field === 'piProductPriceConvertionRate') {
        nextConvertedPrice = nextRate > 0 ? roundTo(item.unitPrice / nextRate, 4) : 0
        nextLineTotal = roundMoney(nextConvertedPrice * nextQuantity)
      }

      if (field === 'convertedPrice') {
        nextRate = nextConvertedPrice > 0 ? roundTo(item.unitPrice / nextConvertedPrice, 4) : 0
        nextLineTotal = roundMoney(nextConvertedPrice * nextQuantity)
      }

      if (field === 'quantity') {
        nextLineTotal = roundMoney(nextConvertedPrice * nextQuantity)
      }

      if (field === 'piLineTotalAmount') {
        nextConvertedPrice = nextQuantity > 0 ? roundTo(nextLineTotal / nextQuantity, 4) : 0
        nextRate = nextConvertedPrice > 0 ? roundTo(item.unitPrice / nextConvertedPrice, 4) : 0
      }

      return {
        ...item,
        quantity: roundMoney(nextQuantity),
        convertedPrice: roundMoney(nextConvertedPrice),
        piProductPriceConvertionRate: roundMoney(nextRate),
        piLineTotalAmount: roundMoney(nextLineTotal),
      }
    }))
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleSave = () => {
    if (!customerId) {
      setServerError('Customer is required')
      return
    }
    if (!lcPaymentTermsId) {
      setServerError('Payment terms is required')
      return
    }
    if (!piBenificaryBankId) {
      setServerError('Beneficiary bank is required')
      return
    }
    if (!piBranchBankLocationId) {
      setServerError('Bank location is required')
      return
    }
    if (items.length === 0) {
      setServerError('At least one product is required')
      return
    }

    setServerError('')

    const payload: UpdatePiPayload = {
      piSystemId: piId,
      piCustmomerId: customerId,
      piDate,
      piNumber,
      piRef,
      piCurrency,
      piAmount: totalPiValue,
      piBenificaryBankId,
      piBranchBankLocationId,
      lcPaymentTermsId,
      piNote,
      piNumberMapped: mapWithExistingPi && piNumberMapped != null ? String(piNumberMapped) : null,
      piProductDetailsInfo: items.map((item) => ({
        piProductId: item.productId,
        piProductQuantity: item.quantity,
        piProductPrice: item.convertedPrice,
        piProductPriceConvertionRate: item.piProductPriceConvertionRate,
        piLineTotalAmount: item.piLineTotalAmount,
      })),
      piConditions: (data?.piConditions ?? {}) as PiConditions,
    }

    updateMutation.mutate(
      payload,
      {
        onSuccess: (res) => {
          if (res.errMsg) setServerError(res.errMsg)
          else {
            showToast({ message: 'Proforma Invoice updated successfully', type: 'success' })
            navigate('/lc/pi')
          }
        },
        onError: (err) => setServerError((err as Error).message || 'Something went wrong'),
      },
    )
  }

  if (isLoading || (data && !isInitialized)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 text-red-500" />
          <p className="text-sm text-red-700">Failed to load PI details.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          to="/lc/pi"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Proforma Invoice</h1>
          <p className="text-xs text-gray-500">{data.piNumber}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {serverError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="space-y-6 text-sm">
          <div className="max-w-xs">
            <label className={SECTION_LABEL}>PI Number:</label>
            <input value={piNumber} readOnly className={READONLY_PI_NUMBER_INPUT} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl p-4" style={{ backgroundColor: '#E5E4E2' }}>
              <div className="space-y-4">
                <div>
                  <label className={SECTION_LABEL}>Customer Name:</label>
                  <PaginatedCombobox
                    type="customer"
                    value={customerId}
                    onValueChange={(value) => {
                      setCustomerId(value)
                      setPiNumberMapped(null)
                      setServerError('')
                    }}
                    onLabelChange={(label) => setCustomerLabel(label ?? '')}
                    selectedLabel={customerLabel || null}
                    placeholder="Customer Name"
                  />
                </div>

                <div>
                  <label className={SECTION_LABEL}>Customer Address:</label>
                  <textarea
                    rows={2}
                    value={customerAddress}
                    disabled
                    className={READONLY_INPUT}
                  />
                </div>

                <div>
                  <label className="inline-flex items-center gap-2 text-sm font-bold text-red-600">
                    <input
                      type="checkbox"
                      checked={mapWithExistingPi}
                      onChange={(event) => setMapWithExistingPi(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-400"
                    />
                    Map with Existing PI Number
                  </label>
                  {mapWithExistingPi && (
                    <select
                      value={piNumberMapped ?? ''}
                      onChange={(event) => setPiNumberMapped(event.target.value === '' ? null : Number(event.target.value))}
                      className={`${INPUT} mt-2`}
                      disabled={!customerId || loadingPiNumbers}
                    >
                      <option value="">
                        {!customerId
                          ? 'Select customer first'
                          : loadingPiNumbers
                            ? 'Loading PI numbers...'
                            : 'Select Mapped PI Number'}
                      </option>
                      {piNumbers.map((pi) => (
                        <option key={pi.piSystemId} value={pi.piSystemId}>
                          {pi.piSystemId} - {pi.piNumber}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className={SECTION_LABEL}>PI Date:</label>
                  <input
                    type="date"
                    value={piDate}
                    onChange={(event) => setPiDate(event.target.value)}
                    className={INPUT}
                  />
                </div>

                <div>
                  <label className={SECTION_LABEL}>PI Ref:</label>
                  <textarea
                    rows={1}
                    value={piRef}
                    onChange={(event) => setPiRef(event.target.value)}
                    placeholder="Enter additional Reference for this PI..."
                    className={TEXTAREA}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: '#D6EAF8' }}>
              <div className="space-y-4">
                <div>
                  <label className={SECTION_LABEL}>Payment Terms:</label>
                  <DropdownSelect
                    type="lcPaymentTerms"
                    value={lcPaymentTermsId}
                    onValueChange={(value) => setLcPaymentTermsId(value)}
                    placeholder="Select Payment Terms"
                  />
                </div>

                <div>
                  <label className={SECTION_LABEL}>Bank List:</label>
                  <DropdownSelect
                    type="bank"
                    value={piBenificaryBankId}
                    onValueChange={(value) => setPiBenificaryBankId(value)}
                    placeholder="Select Beneficiary Bank"
                  />
                </div>

                <div>
                  <label className={SECTION_LABEL}>Bank Location:</label>
                  <PaginatedCombobox
                    type="location"
                    value={piBranchBankLocationId}
                    onValueChange={(value) => setPiBranchBankLocationId(value)}
                    placeholder="Select Branch Location"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className={SECTION_LABEL}>Product Name:</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="min-w-0 flex-1">
                      <PaginatedCombobox
                        type="product"
                        value={draftProduct.id}
                        onValueChange={(value) => {
                          setDraftProduct((prev) => ({
                            ...prev,
                            id: value,
                            label: value == null ? '' : prev.label,
                          }))
                          setServerError('')
                        }}
                        onLabelChange={(label) => setDraftProduct((prev) => ({ ...prev, label: label ?? '' }))}
                        selectedLabel={draftProduct.label || null}
                        placeholder="Product Name"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleGetPrice}
                      disabled={isPriceLoading}
                      className="action-report inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
                    >
                      {isPriceLoading && <Loader2 size={14} className="animate-spin" />}
                      Get Price
                    </button>
                  </div>
                </div>

                <div>
                  <label className={SECTION_LABEL}>Unit Price:</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="number"
                      min={0}
                      step="0.0001"
                      value={draftProduct.unitPrice}
                      onChange={(event) => handleDraftNumericChange('unitPrice', event.target.value)}
                      placeholder="0.00"
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                    <select
                      value={piCurrency}
                      onChange={(event) => handleCurrencyChange(event.target.value as 'USD' | 'BDT')}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 sm:max-w-[180px]"
                    >
                      <option value="USD">USD</option>
                      <option value="BDT">BDT</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="action-insert inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  <Plus size={15} /> Add Item
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className={SECTION_LABEL}>Conversion Rate:</label>
                    <input
                      type="number"
                      min={0}
                      step="0.0001"
                      value={piConversionRate}
                      onChange={(event) => setPiConversionRate(toPositiveNumber(event.target.value))}
                      disabled={piCurrency === 'BDT'}
                      placeholder="Enter conversion rate"
                      className={piCurrency === 'BDT' ? READONLY_INPUT : INPUT}
                    />
                  </div>

                  <div>
                    <label className={SECTION_LABEL}>Converted Price:</label>
                    <input
                      type="number"
                      min={0}
                      step="0.0001"
                      value={draftProduct.convertedPrice}
                      onChange={(event) => handleDraftNumericChange('convertedPrice', event.target.value)}
                      placeholder="0.00"
                      className={INPUT}
                    />
                  </div>

                  <div>
                    <label className={SECTION_LABEL}>Quantity:</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={draftProduct.quantity}
                      onChange={(event) => handleDraftNumericChange('quantity', event.target.value)}
                      placeholder="0.00"
                      className={INPUT}
                    />
                  </div>
                </div>

                <div>
                  <label className={SECTION_LABEL}>Total Amount:</label>
                  <input
                    type="number"
                    value={draftProduct.totalAmount}
                    readOnly
                    className={READONLY_INPUT}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-2.5 text-left">Product</th>
                  <th className="px-3 py-2.5 text-center">Exchange Rate</th>
                  <th className="px-3 py-2.5 text-center">Converted Price</th>
                  <th className="px-3 py-2.5 text-center">Quantity</th>
                  <th className="px-3 py-2.5 text-center">Line Total</th>
                  <th className="px-3 py-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No products added yet.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={`${item.productId}-${index}`} className="border-t border-gray-100">
                      <td className="px-3 py-2.5">
                        <input value={item.productName} readOnly disabled className={READONLY_INPUT} />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.piProductPriceConvertionRate}
                          onChange={(event) => handleItemEdit(index, 'piProductPriceConvertionRate', event.target.value)}
                          className={TABLE_INPUT}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.convertedPrice}
                          onChange={(event) => handleItemEdit(index, 'convertedPrice', event.target.value)}
                          className={TABLE_INPUT}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.quantity}
                          onChange={(event) => handleItemEdit(index, 'quantity', event.target.value)}
                          className={TABLE_INPUT}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.piLineTotalAmount}
                          onChange={(event) => handleItemEdit(index, 'piLineTotalAmount', event.target.value)}
                          className={TABLE_INPUT}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="inline-flex rounded-lg bg-red-600 p-2 text-white transition-colors hover:bg-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: '#D3D3D3' }}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className={SECTION_LABEL}>Total PI Value:</label>
                <input value={formatFixed(totalPiValue)} readOnly className={READONLY_INPUT} />
              </div>
              <div>
                <label className={SECTION_LABEL}>Total Quantity in KG:</label>
                <input value={formatFixed(totalQuantity)} readOnly className={READONLY_INPUT} />
              </div>
              <div>
                <label className={SECTION_LABEL}>Total Item Count:</label>
                <input value={String(totalItemCount)} readOnly className={READONLY_INPUT} />
              </div>
            </div>
          </div>

          <div>
            <label className={SECTION_LABEL}>PI Note:</label>
            <textarea
              rows={3}
              value={piNote}
              onChange={(event) => setPiNote(event.target.value)}
              placeholder="Enter additional notes for this PI..."
              className={TEXTAREA}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Update Proforma Invoice
            </button>
            <button
              type="button"
              onClick={() => navigate('/lc/pi')}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
