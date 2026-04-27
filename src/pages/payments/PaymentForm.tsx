import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { PaginatedCombobox, DropdownSelect } from '@/components/dropdowns'
import { paymentFormSchema, type PaymentFormData } from '@/schemas/paymentSchema'
import { PAYMENT_TYPES, PAYMENT_TYPE_OPTIONS, PAYMENT_METHOD_MAP } from '@/types/payment'
import type { PaymentType, CreatePaymentPayload, UpdatePaymentPayload } from '@/types/payment'
import {
  usePaymentModes,
  useCustomerInvoices,
  useCustomerCheques,
  useInvoiceMetadata,
} from '@/hooks/usePayments'
import { useChequeDetail } from '@/hooks/useCheques'
import { LcRedirectModal } from './LcRedirectModal'

// ─────────────────── Helpers ───────────────────

function todayStr() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

function fmtAmount(value: number | null | undefined) {
  if (value == null) return '—'
  return value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
const inputErrorCls =
  'w-full rounded-lg border border-red-400 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100'
const disabledInputCls =
  'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function ReadonlyField({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className={disabledInputCls}>{value ?? '—'}</div>
    </div>
  )
}

// ─────────────────── Build API Payload ───────────────────

export function buildPaymentPayload(
  values: PaymentFormData,
  paymentId?: number,
): CreatePaymentPayload | UpdatePaymentPayload {
  const ref = values.paymentReference as PaymentType
  const isInvoice = ref === PAYMENT_TYPES.INVOICE
  const isCheque = ref === PAYMENT_TYPES.CHEQUE
  const isOpen = ref === PAYMENT_TYPES.OPEN
  const isTransfer = ref === PAYMENT_TYPES.TRANSFER
  const isLc = ref === PAYMENT_TYPES.LC_PAYMENT

  // chequeAmount — only for Invoice/Cheque/Open/Transfer
  const chequeAmount =
    isInvoice || isCheque || isOpen || isTransfer ? (values.receiveAmount ?? null) : null

  // paymentAmount — for Invoice/Cheque/Open/Transfer/LC
  const paymentAmount =
    isInvoice || isCheque || isOpen || isTransfer || isLc ? (values.receiveAmount ?? null) : null

  // paymentRelatedJobId — only for Invoice
  const paymentRelatedJobId = isInvoice ? (values.invoiceChequeId ?? null) : null

  // paymentChequeId — only for Cheque
  const paymentChequeId = isCheque ? (values.invoiceChequeId ?? null) : null

  // paymentAdjustedAmount — Invoice / AIT / VAT / Credit Adjustment
  const useAdjustment = [
    PAYMENT_TYPES.INVOICE,
    PAYMENT_TYPES.AIT,
    PAYMENT_TYPES.VAT,
    PAYMENT_TYPES.CREDIT_ADJUSTMENT,
  ].includes(ref as PaymentType)
  const paymentAdjustedAmount = useAdjustment ? (values.adjustedAmount ?? null) : null

  // paymentMethodId
  const paymentMethodId = PAYMENT_METHOD_MAP[ref] ?? (values.paymentModeId ?? 0)

  // moenyRecepitNo — empty for Transfer/AIT/VAT/CreditAdj/LC
  const skipReceiptTypes: PaymentType[] = [
    PAYMENT_TYPES.TRANSFER,
    PAYMENT_TYPES.AIT,
    PAYMENT_TYPES.VAT,
    PAYMENT_TYPES.CREDIT_ADJUSTMENT,
    PAYMENT_TYPES.LC_PAYMENT,
  ]
  const moenyRecepitNo = skipReceiptTypes.includes(ref as PaymentType) ? '' : (values.moneyReceiptNo ?? '')

  // bank — only for Cheque/Transfer
  const chequeBeneficiaryBankId =
    isCheque || isTransfer ? (values.bankId ?? null) : null

  // cheque status/date — only for Cheque
  const chequeStatusId = isCheque ? (values.chequeStatusId ?? 2) : null
  const chequeActionDate = isCheque ? (values.chequeActionDate || null) : null

  const base: CreatePaymentPayload = {
    paymentCustomerId: values.customerId,
    chequeAmount,
    paymentAmount,
    paymentRelatedJobId,
    paymentAdjustedAmount,
    paymentMethodId,
    paymentDate: values.paymentDate,
    paymentCollectedBy: values.employeeId,
    moenyRecepitNo,
    paymentChequeId,
    paymentNote: values.paymentNote,
    modifiedBy: null,
    modifiedDate: null,
    chequeBeneficiaryBankId,
    chequeStatusId,
    chequeActionDate,
  }

  if (paymentId !== undefined) {
    return { ...base, paymentSystemId: paymentId } as UpdatePaymentPayload
  }
  return base
}

// ─────────────────── Component Props ───────────────────

interface PaymentFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<PaymentFormData>
  paymentId?: number
  employeeLabel?: string | null
  customerLabel?: string | null
  onSubmit: (payload: CreatePaymentPayload | UpdatePaymentPayload) => void
  isSubmitting: boolean
  submitLabel: string
  serverError?: string
  stayInPage?: boolean
  onStayInPageChange?: (value: boolean) => void
}

// ─────────────────── Main Component ───────────────────

export function PaymentForm({
  mode,
  defaultValues,
  paymentId,
  employeeLabel,
  customerLabel,
  onSubmit,
  isSubmitting,
  submitLabel,
  serverError,
  stayInPage = false,
  onStayInPageChange,
}: PaymentFormProps) {
  const [lcModalOpen, setLcModalOpen] = useState(false)
  const [invoiceCustomerLabel, setInvoiceCustomerLabel] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentReference: PAYMENT_TYPES.INVOICE,
      customerId: null as unknown as number,
      employeeId: null as unknown as number,
      paymentDate: todayStr(),
      paymentModeId: null,
      invoiceChequeId: null,
      receiveAmount: null,
      adjustedAmount: null,
      moneyReceiptNo: '',
      bankId: null,
      chequeStatusId: 2,
      chequeActionDate: todayStr(),
      paymentNote: '',
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (!defaultValues) return
    reset({
      paymentReference: PAYMENT_TYPES.INVOICE,
      customerId: null as unknown as number,
      employeeId: null as unknown as number,
      paymentDate: todayStr(),
      paymentModeId: null,
      invoiceChequeId: null,
      receiveAmount: null,
      adjustedAmount: null,
      moneyReceiptNo: '',
      bankId: null,
      chequeStatusId: 2,
      chequeActionDate: todayStr(),
      paymentNote: '',
      ...defaultValues,
    })
  }, [defaultValues, reset])

  // Watch fields
  const paymentReference = watch('paymentReference') as PaymentType
  const customerId = watch('customerId')
  const invoiceChequeId = watch('invoiceChequeId')

  // Derived visibility flags
  const showPaymentMode = [
    PAYMENT_TYPES.INVOICE,
    PAYMENT_TYPES.CHEQUE,
    PAYMENT_TYPES.OPEN,
    PAYMENT_TYPES.TRANSFER,
  ].includes(paymentReference)

  const showInvoiceChequeSelect = [PAYMENT_TYPES.INVOICE, PAYMENT_TYPES.CHEQUE].includes(paymentReference)
  const showReceiveAmount = [
    PAYMENT_TYPES.INVOICE,
    PAYMENT_TYPES.CHEQUE,
    PAYMENT_TYPES.LC_PAYMENT,
    PAYMENT_TYPES.OPEN,
    PAYMENT_TYPES.TRANSFER,
  ].includes(paymentReference)
  const showMoneyReceipt = [PAYMENT_TYPES.INVOICE, PAYMENT_TYPES.OPEN].includes(paymentReference)
  const showBank = [PAYMENT_TYPES.CHEQUE, PAYMENT_TYPES.TRANSFER].includes(paymentReference)
  const showAdjustedAmount = [
    PAYMENT_TYPES.INVOICE,
    PAYMENT_TYPES.AIT,
    PAYMENT_TYPES.VAT,
    PAYMENT_TYPES.CREDIT_ADJUSTMENT,
  ].includes(paymentReference)
  const isChequeType = paymentReference === PAYMENT_TYPES.CHEQUE
  const isInvoiceType = paymentReference === PAYMENT_TYPES.INVOICE

  // Dropdown data
  const { data: paymentModes, isLoading: loadingModes } = usePaymentModes()
  const { data: invoices, isLoading: loadingInvoices } = useCustomerInvoices(
    isInvoiceType ? customerId : null,
  )
  const { data: cheques, isLoading: loadingCheques } = useCustomerCheques(
    isChequeType ? customerId : null,
  )
  const { data: invoiceMetadata } = useInvoiceMetadata(
    isInvoiceType && invoiceChequeId ? invoiceChequeId : null,
  )
  const { data: chequeDetail } = useChequeDetail(
    isChequeType && invoiceChequeId ? invoiceChequeId : undefined,
  )

  // Auto-populate from invoice metadata
  useEffect(() => {
    if (!invoiceMetadata || !isInvoiceType) return
    setInvoiceCustomerLabel(invoiceMetadata.customerName ?? null)
    if (invoiceMetadata.customerId) {
      setValue('customerId', invoiceMetadata.customerId)
    }
  }, [invoiceMetadata, isInvoiceType, setValue])

  // Auto-populate from cheque detail
  useEffect(() => {
    if (!chequeDetail || !isChequeType) return
    if (chequeDetail.chequeAmount != null) {
      setValue('receiveAmount', chequeDetail.chequeAmount)
    }
    if (chequeDetail.chequeActionDate) {
      setValue('chequeActionDate', chequeDetail.chequeActionDate.slice(0, 10))
    }
    if (chequeDetail.chequeBeneficiaryBankId) {
      setValue('bankId', chequeDetail.chequeBeneficiaryBankId)
    }
    if (chequeDetail.chequeStatusId) {
      setValue('chequeStatusId', chequeDetail.chequeStatusId)
    }
  }, [chequeDetail, isChequeType, setValue])

  const handlePaymentTypeChange = (newType: string) => {
    if (newType === PAYMENT_TYPES.LC_PAYMENT) {
      setLcModalOpen(true)
      return
    }
    setValue('paymentReference', newType as PaymentType)
    // Reset dependent fields
    setValue('invoiceChequeId', null)
    setValue('paymentModeId', null)
    setValue('receiveAmount', null)
    setValue('adjustedAmount', null)
    setValue('moneyReceiptNo', '')
    setValue('bankId', null)
    setValue('chequeStatusId', 2)
    setValue('chequeActionDate', todayStr())
    setInvoiceCustomerLabel(null)
  }

  const handleLcModalClose = () => {
    setLcModalOpen(false)
    // Reset payment type back to Invoice
    setValue('paymentReference', PAYMENT_TYPES.INVOICE)
  }

  const handleFormSubmit = (data: PaymentFormData) => {
    const payload = buildPaymentPayload(data, paymentId)
    onSubmit(payload)
  }

  const numericNullable = {
    setValueAs: (v: string | number | null | undefined) =>
      v === '' || v === undefined || v === null ? null : Number(v),
  }

  return (
    <>
      <LcRedirectModal open={lcModalOpen} onClose={handleLcModalClose} />

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* ── Payment Type ── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase tracking-wider text-gray-700">
            Payment Details
          </legend>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Payment Type */}
            <Field label="Payment Type *" error={errors.paymentReference?.message}>
              <select
                value={paymentReference}
                onChange={(e) => handlePaymentTypeChange(e.target.value)}
                className={errors.paymentReference ? inputErrorCls : inputCls}
              >
                {PAYMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.title}
                  </option>
                ))}
              </select>
            </Field>

            {/* Payment Date */}
            <Field label="Payment Date *" error={errors.paymentDate?.message}>
              <input
                type="date"
                {...register('paymentDate')}
                className={errors.paymentDate ? inputErrorCls : inputCls}
              />
            </Field>

            {/* Collected By (Employee) */}
            <Field label="Collected By *" error={errors.employeeId?.message}>
              <Controller
                name="employeeId"
                control={control}
                render={({ field, fieldState }) => (
                  <PaginatedCombobox
                    type="employee"
                    value={field.value}
                    onValueChange={field.onChange}
                    selectedLabel={employeeLabel}
                    placeholder="Search employee"
                    hasError={!!fieldState.error}
                  />
                )}
              />
            </Field>

            {/* Customer */}
            <Field
              label="Customer *"
              error={errors.customerId?.message}
            >
              <Controller
                name="customerId"
                control={control}
                render={({ field, fieldState }) => (
                  <PaginatedCombobox
                    type="customer"
                    value={field.value}
                    onValueChange={field.onChange}
                    selectedLabel={customerLabel ?? invoiceCustomerLabel}
                    placeholder="Search customer"
                    hasError={!!fieldState.error}
                  />
                )}
              />
            </Field>

            {/* Payment Mode — Invoice/Cheque/Open/Transfer */}
            {showPaymentMode && (
              <Field label="Payment Mode *" error={errors.paymentModeId?.message}>
                <select
                  {...register('paymentModeId', numericNullable)}
                  disabled={loadingModes}
                  className={errors.paymentModeId ? inputErrorCls : inputCls}
                >
                  <option value="">— Select payment mode —</option>
                  {(paymentModes ?? []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {/* Invoice No / Cheque No — Invoice/Cheque types */}
            {showInvoiceChequeSelect && (
              <Field
                label={isInvoiceType ? 'Invoice No *' : 'Cheque No *'}
                error={errors.invoiceChequeId?.message}
              >
                {isInvoiceType ? (
                  <select
                    {...register('invoiceChequeId', numericNullable)}
                    disabled={!customerId || loadingInvoices}
                    className={errors.invoiceChequeId ? inputErrorCls : inputCls}
                  >
                    <option value="">
                      {!customerId ? '— Select customer first —' : loadingInvoices ? 'Loading…' : '— Select invoice —'}
                    </option>
                    {(invoices ?? []).map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    {...register('invoiceChequeId', numericNullable)}
                    disabled={!customerId || loadingCheques}
                    className={errors.invoiceChequeId ? inputErrorCls : inputCls}
                  >
                    <option value="">
                      {!customerId ? '— Select customer first —' : loadingCheques ? 'Loading…' : '— Select cheque —'}
                    </option>
                    {(cheques ?? []).map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            )}

            {/* Receive Amount */}
            {showReceiveAmount && (
              <Field label="Receive Amount *" error={errors.receiveAmount?.message}>
                <input
                  type="number"
                  step="0.01"
                  {...register('receiveAmount', numericNullable)}
                  readOnly={isChequeType}
                  className={isChequeType ? disabledInputCls : errors.receiveAmount ? inputErrorCls : inputCls}
                />
              </Field>
            )}

            {/* Money Receipt No — Invoice/Open */}
            {showMoneyReceipt && (
              <Field label="Money Receipt No" error={errors.moneyReceiptNo?.message}>
                <input
                  type="text"
                  {...register('moneyReceiptNo')}
                  className={errors.moneyReceiptNo ? inputErrorCls : inputCls}
                  placeholder="Enter receipt number"
                />
              </Field>
            )}

            {/* Beneficiary Bank — Cheque/Transfer */}
            {showBank && (
              <Field label="Beneficiary Bank" error={errors.bankId?.message}>
                <DropdownSelect
                  type="bank"
                  value={watch('bankId')}
                  onValueChange={(v) => setValue('bankId', v)}
                  placeholder="— Select bank —"
                  hasError={!!errors.bankId}
                />
              </Field>
            )}

            {/* Adjusted Amount — Invoice/AIT/VAT/Credit Adj */}
            {showAdjustedAmount && (
              <Field label="Adjusted Amount" error={errors.adjustedAmount?.message}>
                <input
                  type="number"
                  step="0.01"
                  {...register('adjustedAmount', numericNullable)}
                  className={errors.adjustedAmount ? inputErrorCls : inputCls}
                  placeholder="0.00"
                />
              </Field>
            )}

            {/* Cheque Action Date — Cheque type only */}
            {isChequeType && (
              <Field label="Cheque Action Date" error={errors.chequeActionDate?.message}>
                <input
                  type="date"
                  {...register('chequeActionDate')}
                  className={errors.chequeActionDate ? inputErrorCls : inputCls}
                />
              </Field>
            )}

            {/* Cheque Status — Cheque type only */}
            {isChequeType && (
              <Field label="Cheque Status" error={errors.chequeStatusId?.message}>
                <DropdownSelect
                  type="chequeStatus"
                  value={watch('chequeStatusId')}
                  onValueChange={(v) => setValue('chequeStatusId', v)}
                  placeholder="— Select status —"
                  hasError={!!errors.chequeStatusId}
                />
              </Field>
            )}

            {/* Payment Note — always visible */}
            <div className="md:col-span-2">
              <Field label="Payment Note" error={errors.paymentNote?.message}>
                <textarea
                  {...register('paymentNote')}
                  rows={2}
                  className={`${errors.paymentNote ? inputErrorCls : inputCls} resize-none`}
                  placeholder="Optional note…"
                />
              </Field>
            </div>
          </div>
        </fieldset>

        {/* ── Invoice Metadata Panel ── */}
        {isInvoiceType && invoiceMetadata && (
          <fieldset className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <legend className="text-sm font-semibold uppercase tracking-wider text-gray-600">
              Invoice Details
            </legend>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <ReadonlyField label="Invoice Number" value={invoiceMetadata.soSystemNo} />
              <ReadonlyField label="Invoice Amount" value={fmtAmount(invoiceMetadata.sobFinalBill)} />
              <ReadonlyField label="Paid Amount" value={fmtAmount(invoiceMetadata.paidAmount)} />
              <ReadonlyField label="Adjusted Amount" value={fmtAmount(invoiceMetadata.adjustedAmount)} />
              <ReadonlyField label="Balance Amount" value={fmtAmount(invoiceMetadata.balance)} />
            </div>
          </fieldset>
        )}

        {/* ── Cheque Details Panel ── */}
        {isChequeType && chequeDetail && (
          <fieldset className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <legend className="text-sm font-semibold uppercase tracking-wider text-gray-600">
              Cheque Details
            </legend>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <ReadonlyField label="Cheque Number" value={chequeDetail.chequeNumber} />
              <ReadonlyField label="Cheque Amount" value={fmtAmount(chequeDetail.chequeAmount)} />
              <ReadonlyField
                label="Cheque Date"
                value={chequeDetail.chequeDate ? new Date(chequeDetail.chequeDate).toLocaleDateString('en-GB') : '—'}
              />
            </div>
          </fieldset>
        )}

        {/* ── Stay in Page (create mode only) ── */}
        {mode === 'create' && onStayInPageChange && (
          <div className="flex items-center gap-2">
            <input
              id="stayInPage"
              type="checkbox"
              checked={stayInPage}
              onChange={(e) => onStayInPageChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-500"
            />
            <label htmlFor="stayInPage" className="text-sm text-gray-700 cursor-pointer">
              Stay on this page after submit
            </label>
          </div>
        )}

        {/* ── Submit ── */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </form>
    </>
  )
}
