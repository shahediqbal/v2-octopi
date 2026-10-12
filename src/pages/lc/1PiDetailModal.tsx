import { useEffect, useRef, useState } from 'react'
import { X, Loader2, AlertCircle, Printer } from 'lucide-react'
import { usePiDetail, useUpdatePiConditions } from '@/hooks/useLcTracking'
import { useToastStore } from '@/stores/toastStore'
import type { PiProductDetail } from '@/types/lcTracking'

interface Props {
  piId: number
  onClose: () => void
}

// ── Terms: key in piConditions → checkbox label + value written to backend ──
const TERMS_CONFIG = [
  { key: 'Port of Loading',   label: 'Port of Loading',     value: "Beneficiary's Factory" },
  { key: 'Port of Discharge', label: 'Port of Discharge',   value: 'Applicants Factory' },
  { key: 'Partial Shipment',  label: 'Partial Shipment',    value: 'Allowed' },
  { key: 'Chemical For-',     label: 'Garments Industries', value: ' 100% Export Oriented Readymade Garments Industries.' },
  { key: 'Chemical For',      label: 'Washing Industries',  value: '100% Export Oriented Washing Industries.' },
  { key: 'Inco Term',         label: 'Inco Term',           value: 'CPT' },
]
const OFFER_KEY   = 'Offer Validity'
const COUNTRY_KEY = 'Country of Origin'

// ── Bangladeshi in-words converter ──
function toWords(amount: number): string {
  if (!amount) return 'Zero'
  const w = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const t = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  const g = (n: number): string => {
    if (n < 20) return w[n]
    if (n < 100) return t[Math.floor(n / 10)] + (n % 10 ? ' ' + w[n % 10] : '')
    return w[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + g(n % 100) : '')
  }
  let int = Math.floor(amount)
  const dec = Math.round((amount - int) * 100)
  let r = ''
  if (int >= 10_000_000) { r += g(Math.floor(int / 10_000_000)) + ' Crore '; int %= 10_000_000 }
  if (int >= 100_000)    { r += g(Math.floor(int / 100_000))    + ' Lakh ';  int %= 100_000 }
  if (int >= 1_000)      { r += g(Math.floor(int / 1_000))      + ' Thousand '; int %= 1_000 }
  if (int >= 100)        { r += g(Math.floor(int / 100))        + ' Hundred '; int %= 100 }
  if (int > 0)           { r += g(int) }
  r = r.trim()
  if (dec > 0) r += ` And ${g(dec)} Cents`
  return r || 'Zero'
}

// ── Date: dd-Mon-yyyy ──
function fmtDate(d: string | undefined | null): string {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
}

// ── Print: open new window with invoice HTML ──
function triggerPrint(el: HTMLDivElement | null) {
  if (!el) return
  const win = window.open('', '_blank', 'width=960,height=720')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Proforma Invoice</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;font-size:9pt}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #e3e3e3;padding:3px 5px;text-align:center;font-size:8.5pt}
      ul{padding-left:50px}li{margin-bottom:2px;font-size:9pt}
      .bold{font-weight:bold}.underline{text-decoration:underline}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>${el.innerHTML}</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}

// ── Shared inline styles ──
const thSt: React.CSSProperties = { fontWeight: 'bold', textAlign: 'center', padding: '3px', border: '1px solid #e3e3e3', verticalAlign: 'middle', textTransform: 'uppercase' }
const tdSt: React.CSSProperties = { textAlign: 'center', padding: '3px', lineHeight: '1', border: '1px solid #e3e3e3' }

export function PiDetailModal({ piId, onClose }: Props) {
  const { data, isLoading, isError, refetch } = usePiDetail(piId)
  const updateCond = useUpdatePiConditions()
  const showToast  = useToastStore((s) => s.showToast)
  const printRef   = useRef<HTMLDivElement>(null)

  // ── Customize: column visibility (persisted in localStorage) ──
  const [cols, setCols] = useState<Record<string, boolean>>(() => {
    try { const s = localStorage.getItem('piCustomizeCols'); if (s) return JSON.parse(s) } catch {}
    return { productCategoryName: false, functionName: false, groupName: false, brandName: false, productLevel: false, productShelfLife: false, productPackSize: false }
  })
  const toggleCol = (k: string) => setCols(prev => {
    const next = { ...prev, [k]: !prev[k] }
    localStorage.setItem('piCustomizeCols', JSON.stringify(next))
    return next
  })

  // ── Terms state ──
  const [termFlags, setTermFlags] = useState<Record<string, boolean>>({})
  const [offerChecked, setOfferChecked]   = useState(false)
  const [offerVal, setOfferVal]           = useState('')
  const [countryChecked, setCountryChecked] = useState(false)
  const [countryVal, setCountryVal]         = useState('')

  useEffect(() => {
    if (!data) return
    const c: Record<string, string> = data.piConditions ?? {}
    const flags: Record<string, boolean> = {}
    for (const t of TERMS_CONFIG) flags[t.key] = !!c[t.key]
    setTermFlags(flags)
    setOfferChecked(!!c[OFFER_KEY]);   setOfferVal(c[OFFER_KEY] ?? '')
    setCountryChecked(!!c[COUNTRY_KEY]); setCountryVal(c[COUNTRY_KEY] ?? '')
  }, [data])

  // ── Accordion open state ──
  const [openCustomize, setOpenCustomize] = useState(true)
  const [openTerms,     setOpenTerms]     = useState(true)

  const handleUpdateConditions = () => {
    if (!data) return
    const updated: Record<string, string> = {}
    for (const t of TERMS_CONFIG) { if (termFlags[t.key]) updated[t.key] = t.value }
    if (offerChecked   && offerVal)   updated[OFFER_KEY]   = offerVal
    if (countryChecked && countryVal) updated[COUNTRY_KEY] = countryVal
    updateCond.mutate({ piId: data.piSystemId, conditions: updated }, {
      onSuccess: () => { showToast({ message: 'Conditions updated', type: 'success' }); void refetch() },
      onError:   () => showToast({ message: 'Failed to update conditions', type: 'error' }),
    })
  }

  const products   = data?.piProductDetailsInfo ?? []
  const totalQty   = products.reduce((s, p) => s + (p.piProductQuantity ?? 0), 0)
  const totalAmt   = products.reduce((s, p) => s + (p.piLineTotalAmount ?? 0), 0)
  const dynCond    = Object.entries(data?.piConditions ?? {})
  const optCount   = Object.values(cols).filter(Boolean).length
  const grandColspan = 2 + optCount

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-4">
      <div className="flex w-full max-w-[96vw] flex-col rounded-xl bg-white shadow-2xl" style={{ minHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
          <button
            type="button"
            onClick={() => triggerPrint(printRef.current)}
            style={{ backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}
          >
            <Printer size={14} /> Print PDF
          </button>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <Loader2 size={30} className="animate-spin text-gray-400" />
          </div>
        ) : isError || !data ? (
          <div className="flex flex-1 items-start gap-3 p-6">
            <AlertCircle size={18} className="mt-0.5 text-red-500" />
            <p className="text-sm text-red-700">Failed to load invoice details.</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-row overflow-hidden">

            {/* ── Left panel ── */}
            <div className="w-56 flex-shrink-0 overflow-y-auto border-r border-gray-200 px-3 py-4">

              {/* Customize accordion */}
              <div className="mb-2 rounded border border-gray-200">
                <button type="button" onClick={() => setOpenCustomize(v => !v)}
                  className="flex w-full items-center justify-between bg-gray-100 px-3 py-2 text-sm font-medium">
                  Customize <span>{openCustomize ? '▲' : '▼'}</span>
                </button>
                {openCustomize && (
                  <div className="space-y-1 px-3 py-2">
                    {([
                      ['productCategoryName', 'Category Name'],
                      ['functionName',        'Function Name'],
                      ['groupName',           'Group Name'],
                      ['brandName',           'Brand Name'],
                      ['productLevel',        'Product Level'],
                      ['productShelfLife',    'Product Shelf Life'],
                      ['productPackSize',     'Product Pack Size'],
                    ] as [string, string][]).map(([k, lbl]) => (
                      <label key={k} className="flex cursor-pointer items-center gap-2 text-xs">
                        <input type="checkbox" checked={!!cols[k]} onChange={() => toggleCol(k)} className="h-3.5 w-3.5" />
                        {lbl}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Terms accordion */}
              <div className="rounded border border-gray-200">
                <button type="button" onClick={() => setOpenTerms(v => !v)}
                  className="flex w-full items-center justify-between bg-gray-100 px-3 py-2 text-sm font-medium">
                  Terms <span>{openTerms ? '▲' : '▼'}</span>
                </button>
                {openTerms && (
                  <div className="space-y-2 px-3 py-2 text-xs">

                    {/* Offer Validity */}
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={offerChecked} onChange={e => setOfferChecked(e.target.checked)} className="h-3.5 w-3.5" />
                      Offer Validity
                    </label>
                    {offerChecked && (
                      <>
                        <input list="offer-opts" value={offerVal} onChange={e => setOfferVal(e.target.value)}
                          placeholder="e.g. 30 Days" className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
                        <datalist id="offer-opts">
                          {['30 Days','90 Days','120 Days'].map(o => <option key={o} value={o} />)}
                        </datalist>
                      </>
                    )}

                    {/* Fixed term checkboxes */}
                    {([
                      ['Inco Term',         'Inco Term'],
                      ['Chemical For-',     'Garments Industries'],
                      ['Chemical For',      'Washing Industries'],
                      ['Partial Shipment',  'Partial Shipment'],
                    ] as [string, string][]).map(([k, lbl]) => (
                      <label key={k} className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={!!termFlags[k]}
                          onChange={() => setTermFlags(p => ({ ...p, [k]: !p[k] }))} className="h-3.5 w-3.5" />
                        {lbl}
                      </label>
                    ))}

                    {/* Country of Origin */}
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={countryChecked} onChange={e => setCountryChecked(e.target.checked)} className="h-3.5 w-3.5" />
                      Country of Origin
                    </label>
                    {countryChecked && (
                      <>
                        <input list="country-opts" value={countryVal} onChange={e => setCountryVal(e.target.value)}
                          placeholder="Select country" className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
                        <datalist id="country-opts">
                          {['Spain','China','Bangladesh'].map(c => <option key={c} value={c} />)}
                        </datalist>
                      </>
                    )}

                    {/* Port of Loading / Discharge */}
                    {([
                      ['Port of Loading',   'Port of Loading'],
                      ['Port of Discharge', 'Port of Discharge'],
                    ] as [string, string][]).map(([k, lbl]) => (
                      <label key={k} className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={!!termFlags[k]}
                          onChange={() => setTermFlags(p => ({ ...p, [k]: !p[k] }))} className="h-3.5 w-3.5" />
                        {lbl}
                      </label>
                    ))}

                    {/* Update button */}
                    <div className="flex justify-center pt-1">
                      <button type="button" onClick={handleUpdateConditions} disabled={updateCond.isPending}
                        className="inline-flex items-center gap-1 rounded bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                        {updateCond.isPending && <Loader2 size={12} className="animate-spin" />}
                        Update
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right panel: printable invoice ── */}
            <div className="flex-1 overflow-auto p-4">
              <div ref={printRef} id="invoiceCapture" style={{ position: 'relative', fontFamily: 'Arial, sans-serif' }}>

                {/* Company header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '16px 8px' }}>
                  <div>
                    <img src="/images/trade.png" alt="Trade Zentrum" style={{ width: '85px', height: '60px' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16pt', marginBottom: '4px' }}>TRADE ZENTRUM</div>
                    <div style={{ fontSize: '9pt', color: '#555', marginBottom: '2px' }}>Reg. Office: House #21, Road #01, Block-C, Banasree, Rampura</div>
                    <div style={{ fontSize: '9pt', color: '#555', display: 'flex', gap: '24px', justifyContent: 'center' }}>
                      <span>☎&nbsp;028399710, +8801792 52 72 52</span>
                      <span>✉&nbsp;tradezentrumbd@gmail.com</span>
                    </div>
                  </div>
                  <div style={{ width: '85px' }} />
                </div>

                <div style={{ padding: '16px' }}>

                  {/* PI title */}
                  <div style={{ textAlign: 'center', marginBottom: '12px', padding: '8px' }}>
                    <span style={{ fontWeight: 'bolder', fontSize: '13pt', textDecoration: 'underline' }}>
                      PROFORMA INVOICE
                    </span>
                  </div>

                  {/* PI meta */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div style={{ marginBottom: '4px', fontSize: '12pt' }}>
                        PI No: <span style={{ marginLeft: '15px' }}>{data.piNumber ?? 'N/A'}</span>
                      </div>
                      {data.piRef && (
                        <div style={{ marginBottom: '4px', fontSize: '10pt', color: '#444' }}>
                          PI Ref: <span style={{ marginLeft: '15px' }}>{data.piRef}</span>
                        </div>
                      )}
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10pt' }}>
                        {data.customerName ?? 'N/A'}
                      </div>
                      <div style={{ textTransform: 'uppercase', fontSize: '10pt' }}>
                        {data.customerAddress ?? ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '10pt' }}>
                      PI Date: {fmtDate(data.piDate)}
                    </div>
                  </div>

                  {/* Product table */}
                  <div style={{ overflowX: 'auto', padding: '5px', fontSize: '8.5pt' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e3e3e3', fontSize: '8.5pt' }}>
                      <thead>
                        <tr style={{ height: '20px' }}>
                          <th style={thSt}>H.S CODE</th>
                          <th style={thSt}>PRODUCT NAME</th>
                          {cols.productCategoryName && <th style={thSt}>Category</th>}
                          {cols.functionName        && <th style={thSt}>Function</th>}
                          {cols.groupName           && <th style={thSt}>Group</th>}
                          {cols.brandName           && <th style={thSt}>Brand</th>}
                          {cols.productLevel        && <th style={thSt}>Product Level</th>}
                          {cols.productShelfLife    && <th style={thSt}>Shelf Life</th>}
                          {cols.productPackSize     && <th style={thSt}>Pack Size</th>}
                          <th style={thSt}>QTY/KG</th>
                          <th style={thSt}>PRICE/KG ({data.piCurrency})</th>
                          <th style={thSt}>TOTAL AMOUNT ({data.piCurrency})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((item: PiProductDetail, i: number) => (
                          <tr key={i} style={{ height: '18px' }}>
                            <td style={tdSt}>{data.hsCode ?? ''}</td>
                            <td style={tdSt}>{item.productName ?? ''}</td>
                            {cols.productCategoryName && <td style={tdSt}>{item.productCategoryName ?? ''}</td>}
                            {cols.functionName        && <td style={tdSt}>{item.functionName ?? ''}</td>}
                            {cols.groupName           && <td style={tdSt}>{item.groupName ?? ''}</td>}
                            {cols.brandName           && <td style={tdSt}>{item.brandName ?? ''}</td>}
                            {cols.productLevel        && <td style={tdSt}>{item.productLevel ?? ''}</td>}
                            {cols.productShelfLife    && <td style={tdSt}>{item.productShelfLife ?? ''}</td>}
                            {cols.productPackSize     && <td style={tdSt}>{item.productPackSize ?? '0'}</td>}
                            <td style={tdSt}>{(item.piProductQuantity ?? 0).toFixed(2)}</td>
                            <td style={tdSt}>{(item.piProductPrice ?? 0).toFixed(2)}</td>
                            <td style={tdSt}>{(item.piLineTotalAmount ?? 0).toFixed(2)}</td>
                          </tr>
                        ))}
                        {/* Grand Total */}
                        <tr style={{ fontWeight: 'bold', height: '22px' }}>
                          <td colSpan={grandColspan} style={{ ...tdSt, textAlign: 'center' }}>GRAND TOTAL</td>
                          <td style={{ ...tdSt, textAlign: 'center' }}>{totalQty.toFixed(2)} KG</td>
                          <td style={tdSt} />
                          <td style={{ ...tdSt, textAlign: 'center' }}>{totalAmt.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* In Words */}
                  <div style={{ textAlign: 'left', marginTop: '8px', paddingLeft: '45px' }}>
                    <strong style={{ fontSize: '10pt' }}>IN WORDS:&nbsp;</strong>
                    <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10pt' }}>
                      ({data.piCurrency}) {toWords(totalAmt)}
                    </span>
                  </div>

                  {/* Terms */}
                  <div style={{ padding: '16px' }}>
                    <div style={{ paddingLeft: '20px', marginTop: '-15px', fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      TERMS:
                    </div>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '60px', fontSize: '10pt' }}>
                      <li>Letter of Credit: LC In {data.piCurrency}</li>
                      <li>Payment Term: {data.lcPaymetTerms ?? ''}</li>
                      <li>
                        Bank Details: {data.bankOperatingBranch ?? 'N/A'},&nbsp;
                        Account No - {data.bankAccountNumber ?? 'N/A'},&nbsp;
                        Swift No - {data.bankSwiftNumber ?? 'N/A'}
                      </li>
                      <li>Sellers Details: Trade Zentrum, House-21, Road-1, Block-C, Banasree, Rampura, Dhaka, Phone- 02 8399710, 01670205047</li>
                      <li>Packing: Factory Standard</li>
                      <li>Port Of Loading: Beneficiary's Factory</li>
                      <li>Partial Payment - Allowed</li>
                      <li>Delivery period: 90 days from the date of acceptable L/C</li>
                      <li>Negotiation: Within 15 days from the date of delivery challan/ truck receipt.</li>
                      <li>The goods will be delivered by the seller through buyer's authorized representative from the warehouse of the seller and receiving signature of the goods on delivery Challan by buyer's representative will be treated as acceptance of the goods and documents.</li>
                      <li>Bill of exchange is to be drawn on bank not on the opener of L/C</li>
                      <li>VAT No: 001089612-0202</li>
                      {dynCond.map(([key, val], i) => (
                        <li key={i}>{key}: {val}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Signature */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '30px', paddingBottom: '10px' }}>
                    <img src="/images/lcSign.jpg" alt="Authorized Signature" style={{ width: '120px', height: 'auto' }} />
                  </div>

                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
