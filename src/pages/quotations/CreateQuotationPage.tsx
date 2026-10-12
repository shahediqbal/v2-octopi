import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { jwtDecode } from 'jwt-decode'
import { useCreateQuotation } from '@/hooks/useQuotation'
import { useCustomerDetail } from '@/hooks/useCustomers'
import { useToastStore } from '@/stores/toastStore'
import { getAccessToken } from '@/auth/authBridge'
import { apiClient } from '@/lib/api'
import { PaginatedCombobox } from '@/components/dropdowns'

const DEFAULT_QUANTITY = 1

// ─── helpers ──────────────────────────────────────────────────────────────────

function getUserSystemId(): number {
  const token = getAccessToken()
  if (!token) return 0
  try {
    const decoded = jwtDecode<{ UserSystemId?: number | string }>(token)
    return Number(decoded.UserSystemId ?? 0)
  } catch {
    return 0
  }
}

function todayLabel(): string {
  const d = new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`
}

// ─── types ────────────────────────────────────────────────────────────────────

interface QuotationLineItem {
  rowId: string
  productId: number
  productName: string
  unitPrice: number
  vat: number
  ait: number
  discountRate: number
  discountType: 'F' | 'P'
  discountAmmount: number
  lineTotal: number      // calculated price × quantity (sent to API as pqdCalculatedPrice)
  adjustableAmount: number
  adjustableType: 'plus' | 'minus'
  lineTotalFinal: number // final price per unit (sent to API as pqdFinalPrice)
}

// ─── calculation ──────────────────────────────────────────────────────────────

interface CalcInput {
  unitPrice: number
  vat: number
  ait: number
  discount: number
  discountIsPercent: boolean
  adjustableAmount: number
  adjustableType: 'plus' | 'minus'
  quantity: number
}

interface CalcResult {
  discountAmt: number
  productAitAmt: number
  productVatAmt: number
  vadTotal: number
  lineTotal: number       // per-unit calculated price
  lineTotalFinal: number  // per-unit final price
  lineTotalQty: number    // lineTotal × quantity (stored in item)
}

function calcLine(inp: CalcInput): CalcResult {
  const discountAmt = inp.discountIsPercent
    ? inp.unitPrice * (inp.discount / 100)
    : inp.discount
  const basePrice = inp.unitPrice + discountAmt
  const aitAmt = basePrice * (inp.ait / 100)
  const priceWithAit = basePrice + aitAmt
  const vatAmt = priceWithAit * (inp.vat / 100)
  const lineTotal = priceWithAit + vatAmt
  const lineTotalFinal =
    inp.adjustableType === 'plus'
      ? lineTotal + inp.adjustableAmount
      : lineTotal - inp.adjustableAmount
  return {
    discountAmt,
    productAitAmt: aitAmt,
    productVatAmt: vatAmt,
    vadTotal: aitAmt + vatAmt,
    lineTotal,
    lineTotalFinal,
    lineTotalQty: lineTotal * inp.quantity,
  }
}

// ─── component ────────────────────────────────────────────────────────────────

export function CreateQuotationPage() {
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)
  const createMutation = useCreateQuotation()
  const [serverError, setServerError] = useState('')

  // ── Header state ──
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [currency, setCurrency] = useState<'BDT' | 'USD'>('BDT')
  const [switchTStuck, setSwitchTStuck] = useState(false) // lock currency after first item

  // ── Customer address via detail fetch ──
  const { data: customerDetail } = useCustomerDetail(customerId ?? undefined)

  // ── Product input state ──
  const [prodId, setProdId] = useState<number | null>(null)
  const [prodName, setProdName] = useState('')
  const [unitPrice, setUnitPrice] = useState(0)
  const [switchT, setSwitchT] = useState(false)   // Apply VAT and AIT?
  const [vat, setVat] = useState(0)
  const [ait, setAit] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [discountIsPercent, setDiscountIsPercent] = useState(false)
  const [adjustableAmount, setAdjustableAmount] = useState(0)
  const [adjustableType, setAdjustableType] = useState<'plus' | 'minus'>('plus')

  // ── Calculated display values (re-derived from inputs) ──
  const calc = calcLine({
    unitPrice,
    vat: switchT ? vat : 0,
    ait: switchT ? ait : 0,
    discount,
    discountIsPercent,
    adjustableAmount,
    adjustableType,
    quantity: DEFAULT_QUANTITY,
  })

  // ── Items list ──
  const [items, setItems] = useState<QuotationLineItem[]>([])

  // ── Get Price ──
  const [gettingPrice, setGettingPrice] = useState(false)
  const [priceError, setPriceError] = useState('')

  const resetComposer = () => {
    setProdId(null)
    setProdName('')
    setUnitPrice(0)
    setSwitchT(false)
    setVat(0)
    setAit(0)
    setDiscount(0)
    setDiscountIsPercent(false)
    setAdjustableAmount(0)
    setAdjustableType('plus')
    setPriceError('')
    setAddError('')
  }

  const handleGetPrice = async () => {
    if (!prodId || !customerId) {
      setPriceError(
        !customerId ? 'Select a customer first' :
        'Select a product first',
      )
      return
    }
    setPriceError('')
    setGettingPrice(true)
    try {
      const res = await apiClient.get<{ dataObj?: { data?: { productPrice?: number } }; errMsg?: string }>(
        `/Price/GetPriceByCustomerAndQty/${prodId}/${customerId}/${DEFAULT_QUANTITY}`,
      )
      if (res.errMsg) {
        setUnitPrice(0)
        setPriceError(res.errMsg)
      } else {
        setUnitPrice(res.dataObj?.data?.productPrice ?? 0)
      }
    } catch {
      setUnitPrice(0)
      setPriceError('Failed to fetch price')
    } finally {
      setGettingPrice(false)
    }
  }

  // ── Add item ──
  const [addError, setAddError] = useState('')

  const handleAddItem = () => {
    if (!prodId || !customerId) {
      setAddError(!customerId ? 'Select a customer first' : 'Select a product first')
      return
    }
    if (items.some((item) => item.productId === prodId)) {
      setAddError('Product already added')
      return
    }
    if (calc.lineTotal < 0) {
      setAddError("Line Total can't be negative")
      return
    }
    setAddError('')
    setSwitchTStuck(true)

    const discountAmt = discountIsPercent ? (unitPrice * discount) / 100 : discount

    setItems((prev) => [
      ...prev,
      {
        rowId: `${Date.now()}-${Math.random()}`,
        productId: prodId,
        productName: prodName,
        unitPrice,
        vat: switchT ? vat : 0,
        ait: switchT ? ait : 0,
        discountRate: discount,
        discountType: discountIsPercent ? 'P' : 'F',
        discountAmmount: discountAmt,
        lineTotal: parseFloat(calc.lineTotalQty.toFixed(4)),
        adjustableAmount,
        adjustableType,
        lineTotalFinal: parseFloat(calc.lineTotalFinal.toFixed(4)),
      },
    ])

    resetComposer()
  }

  // ── Remove item ──
  const handleRemoveItem = (rowId: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.rowId !== rowId)
      if (next.length === 0) setSwitchTStuck(false)
      return next
    })
  }

  // ── Submit ──
  const handleSave = () => {
    if (!customerId) { setServerError('Select a customer'); return }
    if (items.length === 0) { setServerError('Add at least one product'); return }
    setServerError('')

    createMutation.mutate(
      {
        pqSystemId: getUserSystemId(),
        customerId,
        pqCurrencyName: currency,
        priceQuotationProducts: items.map((item) => ({
          pqdProductId: item.productId,
          pqdProductUnitPrice: item.unitPrice,
          pqdAppliedVatPercantage: item.vat,
          pqdAppliedAitPercantage: item.ait,
          pqdIncreasedType: item.discountType,
          pqdIncreasedAmount: item.discountRate,
          pqdCalculatedPrice: item.lineTotal,
          pqdAdustedAmount: item.adjustableAmount,
          pqdFinalPrice: item.lineTotalFinal,
        })),
      },
      {
        onSuccess: (res) => {
          if (res.errMsg) {
            setServerError(res.errMsg)
          } else {
            showToast({ message: 'Quotation created successfully', type: 'success' })
            navigate('/quotations')
          }
        },
        onError: (err) => {
          setServerError((err as Error).message || 'Something went wrong')
        },
      },
    )
  }

  // ── shared input classes ──
  const inputCls =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-50 disabled:text-gray-500'
  const smallInput =
    'w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-200 disabled:bg-gray-50'

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      {/* ── Page header ── */}
      <div className="flex items-center gap-3">
        <Link
          to="/quotations"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Quotation</h1>
          <p className="text-xs text-gray-500">Create a price quotation for a customer</p>
        </div>
      </div>

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">

        {/* ── Section 1: Customer + Date ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Customer Name</label>
              <PaginatedCombobox
                type="customer"
                value={customerId}
                onValueChange={(val) => {
                  setCustomerId(val)
                  setServerError('')
                  setAddError('')
                  setPriceError('')
                  if (!val) setSwitchTStuck(false)
                }}
                placeholder="Select customer…"
                disabled={items.length > 0 && switchTStuck}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Order Date</label>
              <input className={inputCls} value={todayLabel()} disabled readOnly />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Customer Address</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={4}
              value={customerDetail?.customerAddress ?? 'Not Available'}
              disabled
              readOnly
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* ── Section 2: Product input ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Left column */}
          <div className="space-y-3">
            {/* Product + Get Price */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Product Name</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <PaginatedCombobox
                    type="product"
                    value={prodId}
                    onValueChange={(val) => {
                      setProdId(val)
                      setAddError('')
                      setPriceError('')
                    }}
                    onLabelChange={(lbl) => setProdName(lbl ?? '')}
                    placeholder="Select product…"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGetPrice}
                  disabled={gettingPrice}
                  className="action-report inline-flex shrink-0 items-center gap-1 rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
                >
                  {gettingPrice ? <Loader2 size={13} className="animate-spin" /> : null}
                  Get Price
                </button>
              </div>
              {priceError && <p className="mt-1 text-xs text-red-600">{priceError}</p>}
            </div>

            {/* Currency + Unit Price */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Unit Price</label>
              <div className="flex">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'BDT' | 'USD')}
                  disabled={items.length > 0 && switchTStuck}
                  className="rounded-l-lg border border-r-0 border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 focus:outline-none disabled:bg-gray-50"
                >
                  <option value="BDT">BDT</option>
                  <option value="USD">USD</option>
                </select>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className="w-full rounded-r-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>
            </div>

            {/* VAT/AIT toggle */}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={switchT}
                onChange={(e) => {
                  setSwitchT(e.target.checked)
                  if (!e.target.checked) { setVat(0); setAit(0) }
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="font-medium">Apply VAT and AIT?</span>
            </label>

            {/* VAT + AIT */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">VAT</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={vat}
                    onChange={(e) => setVat(Number(e.target.value))}
                    disabled={!switchT}
                    className={smallInput}
                  />
                  <span className="shrink-0 text-xs text-gray-500">%</span>
                  <span className="shrink-0 text-xs text-gray-400">
                    » {calc.productVatAmt.toFixed(4)}
                  </span>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">AIT</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={ait}
                    onChange={(e) => setAit(Number(e.target.value))}
                    disabled={!switchT}
                    className={smallInput}
                  />
                  <span className="shrink-0 text-xs text-gray-500">%</span>
                  <span className="shrink-0 text-xs text-gray-400">
                    » {calc.productAitAmt.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Add Item button */}
            <div>
              {addError && <p className="mb-1 text-xs text-red-600">{addError}</p>}
              <button
                type="button"
                onClick={handleAddItem}
                className="action-insert rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
              >
                Add Item
              </button>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-3">
            {/* SUM(VAT | AIT) */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">SUM(VAT | AIT)</label>
              <input type="number" value={calc.vadTotal.toFixed(4)} className={inputCls} disabled readOnly />
            </div>

            {/* Discount */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Commission / Discount</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className={`${inputCls} flex-1`}
                  placeholder="0.00"
                />
                <label className="flex shrink-0 items-center gap-1 text-sm text-gray-700">
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

            {/* New Price (Calculated) */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">New Price</label>
              <input
                type="number"
                value={calc.lineTotal.toFixed(4)}
                className={inputCls}
                disabled
                readOnly
              />
            </div>

            {/* Adjustable Amount */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Adjustable Amount</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={adjustableAmount}
                  onChange={(e) => setAdjustableAmount(Number(e.target.value))}
                  className={`${inputCls} flex-1`}
                  placeholder="0.00"
                />
                <div className="flex shrink-0 items-center gap-3 rounded-lg border border-gray-300 bg-white px-3">
                  <label className="flex items-center gap-1 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      value="plus"
                      checked={adjustableType === 'plus'}
                      onChange={() => setAdjustableType('plus')}
                    />
                    <strong>+</strong>
                  </label>
                  <label className="flex items-center gap-1 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      value="minus"
                      checked={adjustableType === 'minus'}
                      onChange={() => setAdjustableType('minus')}
                    />
                    <strong>−</strong>
                  </label>
                </div>
              </div>
            </div>

            {/* Final Price */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Final Price</label>
              <input
                type="number"
                value={calc.lineTotalFinal.toFixed(4)}
                className={inputCls}
                disabled
                readOnly
              />
            </div>
          </div>
        </div>

        {/* ── Section 3: Items table ── */}
        {items.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-center">Base Selling Price</th>
                  <th className="px-3 py-2 text-center">AIT %</th>
                  <th className="px-3 py-2 text-center">VAT %</th>
                  <th className="px-3 py-2 text-center">Commission</th>
                  <th className="px-3 py-2 text-center">New Price</th>
                  <th className="px-3 py-2 text-center">Adjustable Amount</th>
                  <th className="px-3 py-2 text-center">Final Price</th>
                  <th className="px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.rowId} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-medium text-gray-900">{item.productName}</td>
                    <td className="px-3 py-2 text-center text-gray-700">{item.unitPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{item.ait}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{item.vat}</td>
                    <td className="px-3 py-2 text-center text-gray-600">
                      {item.discountRate > 0 ? `${item.discountRate}${item.discountType === 'P' ? '%' : ''}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-700">{item.lineTotal.toFixed(4)}</td>
                    <td className="px-3 py-2 text-center text-gray-600">
                      {item.adjustableAmount > 0
                        ? `${item.adjustableType === 'plus' ? '+' : '−'} ${item.adjustableAmount}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold text-gray-900">
                      {item.lineTotalFinal.toFixed(4)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.rowId)}
                        className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Section 4: Save / Back ── */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={createMutation.isPending}
            className="action-insert inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
          >
            {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Save
          </button>
          <Link
            to="/quotations"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Back
          </Link>
        </div>

      </div>
    </div>
  )
}
