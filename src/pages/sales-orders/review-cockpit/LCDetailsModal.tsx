import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { useLcDetail } from '@/hooks/useReviewCockpit'
import { toCurrency, toDateLabel, lcLifecycleColor } from '@/pages/sales-orders/review-cockpit/format'
import type { LcPaymentInfoRow } from '@/types/reviewCockpit'

interface LCDetailsModalProps {
  piSystemId: number | null
  lcRows: LcPaymentInfoRow[]
  onClose: () => void
}

export function LCDetailsModal({ piSystemId: initialPiSystemId, lcRows, onClose }: LCDetailsModalProps) {
  const [selectedPiSystemId, setSelectedPiSystemId] = useState<number | null>(
    initialPiSystemId ?? (lcRows[0]?.piSystemId ?? null),
  )
  const { data: detail, isLoading } = useLcDetail(selectedPiSystemId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">LC / PI Details</h2>
            <p className="mt-1 text-sm text-gray-500">Select a PI to view full LC details</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
          {/* PI selector */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-gray-600">Select PI</label>
            <select
              value={selectedPiSystemId ?? ''}
              onChange={(e) => setSelectedPiSystemId(e.target.value ? Number(e.target.value) : null)}
              className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
            >
              {lcRows.map((r) => (
                <option key={r.piSystemId} value={r.piSystemId ?? ''}>
                  PI: {r.piNo ?? r.piNumber ?? '—'} | LC: {r.lcNo ?? r.lcNumber ?? '—'}
                </option>
              ))}
            </select>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
              <span className="ml-3 text-sm text-gray-500">Loading LC details…</span>
            </div>
          )}

          {!isLoading && detail && (
            <div className="space-y-6">
              {/* PI Information */}
              <DetailSection title="PI Information">
                <InfoGrid>
                  <InfoRow label="PI Number" value={detail.piNumber} />
                  <InfoRow label="PI Date" value={toDateLabel(detail.piDate)} />
                  <InfoRow label="PI Reference" value={detail.piRef} />
                  <InfoRow label="Currency" value={detail.piCurrency} />
                  <InfoRow label="Customer" value={detail.customerName} />
                  <InfoRow label="Address" value={detail.customerAddress} />
                  <InfoRow label="Note" value={detail.piNote} />
                  <InfoRow label="Conditions" value={detail.piConditions} />
                </InfoGrid>
              </DetailSection>

              {/* LC Information */}
              <DetailSection title="LC Information">
                <InfoGrid>
                  <InfoRow label="LC Number" value={detail.lcNumber} />
                  <InfoRow label="LC Date" value={toDateLabel(detail.lcDate)} />
                  <InfoRow label="LC Amount" value={toCurrency(detail.lcReceivedAmount)} />
                  <InfoRow label="Conversion Rate" value={detail.lcConversionRateCollection != null ? String(detail.lcConversionRateCollection) : undefined} />
                  <InfoRow label="Lifecycle">
                    {detail.lcLifecycleName ? (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${lcLifecycleColor(detail.lcLifecycleName)}`}>
                        {detail.lcLifecycleName}
                      </span>
                    ) : '—'}
                  </InfoRow>
                  <InfoRow label="Payment Terms" value={detail.lcPaymetTerms} />
                  <InfoRow label="Partial Status" value={detail.lcPartialStatus} />
                  <InfoRow label="Amendment x PI" value={detail.lcAmendmentXPi} />
                  <InfoRow label="IBC Number" value={detail.lcIbcNumber} />
                  <InfoRow label="Issuer Bank" value={detail.issuerBankName} />
                  <InfoRow label="Issuer Branch" value={detail.issuerBranchLocationName} />
                  <InfoRow label="Beneficiary Bank" value={detail.beneficiaryBankName} />
                  <InfoRow label="Branch Location" value={detail.branchLocationName} />
                </InfoGrid>
              </DetailSection>

              {/* Document Timeline */}
              <DetailSection title="Document Timeline">
                <InfoGrid cols={2}>
                  <InfoRow label="LC Copy Receive" value={toDateLabel(detail.lcCopyReceiveDate)} />
                  <InfoRow label="Doc Prep Date" value={toDateLabel(detail.docPrepDate)} />
                  <InfoRow label="Doc Submit Date" value={toDateLabel(detail.docSumbitDate)} />
                  <InfoRow label="Customer Accepted" value={toDateLabel(detail.docCustomerAcceptedDate)} />
                  <InfoRow label="Beneficiary Submission" value={toDateLabel(detail.docBenificerySubmissionDate)} />
                  <InfoRow label="IBC/FBC Receive" value={toDateLabel(detail.lcIbcFbcReceiveDate)} />
                  <InfoRow label="Bank Acceptance" value={toDateLabel(detail.bankAcceptanceDate)} />
                  <InfoRow label="Maturity Date" value={toDateLabel(detail.maturityDate)} />
                  <InfoRow label="Revised Maturity" value={toDateLabel(detail.revisedMaturityDate)} />
                  <InfoRow label="Payment Date" value={toDateLabel(detail.lcPaymentDate)} />
                  <InfoRow label="AIT Collection" value={toDateLabel(detail.aitCollectionDate)} />
                </InfoGrid>
              </DetailSection>

              {/* Payment Info */}
              <DetailSection title="Payment Info">
                <InfoGrid>
                  <InfoRow label="AIT Amount" value={toCurrency(detail.aitAmount)} />
                  <InfoRow label="Created By" value={detail.createdBy} />
                  <InfoRow label="Created Date" value={toDateLabel(detail.createdDate)} />
                  <InfoRow label="Modified By" value={detail.modifiedBy} />
                  <InfoRow label="Modified Date" value={toDateLabel(detail.modifiedDate)} />
                </InfoGrid>
              </DetailSection>
            </div>
          )}

          {!isLoading && !detail && selectedPiSystemId && (
            <p className="text-sm text-gray-500">No detail data available for this PI.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function InfoGrid({ children, cols = 3 }: { children: React.ReactNode; cols?: number }) {
  return <div className={`grid gap-x-6 gap-y-3 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>{children}</div>
}

function InfoRow({ label, value, children }: { label: string; value?: string | number | null; children?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-0.5 text-sm text-gray-900">
        {children ?? (value != null && value !== '' ? String(value) : '—')}
      </div>
    </div>
  )
}
