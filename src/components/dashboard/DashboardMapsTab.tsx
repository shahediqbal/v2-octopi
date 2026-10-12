import { useEffect, useMemo, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet'
import {
  AlertTriangle,
  Banknote,
  Clock3,
  MapPin,
  Navigation,
  Route,
  Truck,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { useDropdown } from '@/hooks/useDropdown'
import { useEmployeeOptions } from '@/hooks/useEmployees'
import { useCustomerMap, useDeliveryAudit } from '@/hooks/useMapAudit'
import type {
  CustomerMapMarker,
  DeliveryAuditFilter,
  DeliveryAuditRun,
} from '@/types/mapAudit'

const warehouse: LatLngExpression = [23.92725, 90.389444]
const auditStatuses = [
  'All',
  'Normal',
  'High Cost',
  'Cost Review',
  'Duration Review',
  'Unusual Time Gap',
  'Route Review',
  'Insufficient History',
]

function dateText(date: Date) {
  return date.toISOString().slice(0, 10)
}

function recentDaysRange(days: number) {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  return { startDate: dateText(start), endDate: dateText(end) }
}

function amount(value: number) {
  return new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 }).format(value)
}

function duration(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) return '—'
  const rounded = Math.round(minutes)
  const hours = Math.floor(rounded / 60)
  const remaining = rounded % 60
  return hours > 0 ? `${hours}h ${remaining}m` : `${remaining}m`
}

function timeText(value: string | null) {
  return value
    ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—'
}

function FitBounds({ points }: { points: LatLngExpression[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 14)
      return
    }
    map.fitBounds(points as LatLngBoundsExpression, { padding: [28, 28], maxZoom: 15 })
  }, [map, points])
  return null
}

function MapMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
    <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
  </div>
}

function CustomerMapPanel() {
  const mapQuery = useCustomerMap()
  const [customerSelection, setCustomerSelection] = useState('')
  const customers = useMemo(() => mapQuery.data?.customers ?? [], [mapQuery.data?.customers])
  const located = useMemo(
    () => customers.filter((customer): customer is CustomerMapMarker & { latitude: number; longitude: number } =>
      typeof customer.latitude === 'number' && typeof customer.longitude === 'number'
      && customer.latitude !== 0 && customer.longitude !== 0),
    [customers],
  )
  const customerOptions = useMemo(
    () => [...customers].sort((left, right) =>
      left.customerName.localeCompare(right.customerName)),
    [customers],
  )
  const selectedCustomer = useMemo(
    () => customerSelection && customerSelection !== 'ALL'
      ? customers.find(customer => customer.customerId === Number(customerSelection)) ?? null
      : null,
    [customerSelection, customers],
  )
  const visible = useMemo(() => {
    if (!customerSelection) return []
    if (customerSelection === 'ALL') return located
    return located.filter(customer => customer.customerId === Number(customerSelection))
  }, [customerSelection, located])
  const points = useMemo<LatLngExpression[]>(
    () => visible.map(customer => [customer.latitude, customer.longitude]),
    [visible],
  )

  return <div className="space-y-4">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <MapMetric label="Total customers" value={amount(mapQuery.data?.totalCustomers ?? 0)} detail="Customer master" />
      <MapMetric label="Mapped" value={amount(mapQuery.data?.locatedCustomers ?? 0)} detail="Latitude and longitude available" />
      <MapMetric label="Missing location" value={amount(mapQuery.data?.missingLocationCustomers ?? 0)} detail="Needs OTP/geocoding review" />
    </div>

    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-end">
      <label className="flex-1 text-xs font-medium text-slate-500">
        Customer
        <select
          value={customerSelection}
          onChange={event => setCustomerSelection(event.target.value)}
          disabled={mapQuery.isLoading || mapQuery.isError}
          className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="">Select customer</option>
          <option value="ALL">All customers</option>
          {customerOptions.map(customer => (
            <option key={customer.customerId} value={customer.customerId}>
              {customer.customerName} — {customer.customerAddress || `ID ${customer.customerId}`}
            </option>
          ))}
        </select>
      </label>
      <span className="pb-2 text-xs font-medium text-slate-500">
        {customerSelection ? `${visible.length} marker${visible.length === 1 ? '' : 's'}` : 'Choose what to load'}
      </span>
    </div>

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <MapContainer center={warehouse} zoom={11} className="h-[560px] w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker center={warehouse} radius={8} pathOptions={{ color: '#0f172a', fillColor: '#10b981', fillOpacity: 1 }}>
          <Popup><strong>Warehouse_Gazipur</strong><br />Official warehouse location</Popup>
        </CircleMarker>
        {visible.map(customer => <CircleMarker
          key={customer.customerId}
          center={[customer.latitude, customer.longitude]}
          radius={5}
          pathOptions={{ color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 0.75, weight: 1 }}
        >
          <Tooltip permanent direction="top" offset={[0, -4]} opacity={0.95}>
            <span className="font-semibold">{customer.customerName}</span>
            <br />
            <span>{customer.customerAddress || 'Address unavailable'}</span>
          </Tooltip>
          <Popup>
            <strong>{customer.customerName}</strong><br />
            {customer.customerAddress || 'Address unavailable'}
          </Popup>
        </CircleMarker>)}
        <FitBounds points={points.length > 0 ? points : [warehouse]} />
      </MapContainer>
    </div>

    {mapQuery.isLoading && <p className="text-center text-sm text-slate-500">Loading customer locations…</p>}
    {mapQuery.isError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Customer locations could not be loaded. Please retry or check the Customer API.</p>}
    {!mapQuery.isLoading && !mapQuery.isError && !customerSelection && (
      <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
        Select one customer or choose All customers to load map markers.
      </p>
    )}
    {selectedCustomer && visible.length === 0 && (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {selectedCustomer.customerName} has no valid latitude and longitude.
      </p>
    )}
  </div>
}

function runPoints(run: DeliveryAuditRun | null): LatLngExpression[] {
  if (!run) return [warehouse]
  const points: LatLngExpression[] = []
  for (const leg of run.legs) {
    if (leg.startLatitude != null && leg.startLongitude != null) {
      points.push([leg.startLatitude, leg.startLongitude])
    }
    if (leg.endLatitude != null && leg.endLongitude != null) {
      points.push([leg.endLatitude, leg.endLongitude])
    }
  }
  for (const stop of run.stops) {
    if (stop.latitude != null && stop.longitude != null) points.push([stop.latitude, stop.longitude])
  }
  return points.length > 0 ? points : [warehouse]
}

function statusTone(status: string) {
  if (status === 'Normal') return 'bg-emerald-100 text-emerald-700'
  if (status === 'High Cost') return 'bg-red-100 text-red-700'
  if (status === 'Insufficient History') return 'bg-slate-100 text-slate-600'
  return 'bg-amber-100 text-amber-800'
}

function DeliveryAuditPanel() {
  const initial = useMemo(() => recentDaysRange(30), [])
  const [filters, setFilters] = useState<DeliveryAuditFilter>(initial)
  const [draftTaskId, setDraftTaskId] = useState('')
  const auditQuery = useDeliveryAudit(filters)
  const employeeOptionsQuery = useEmployeeOptions()
  const vehicleOptionsQuery = useDropdown('vehicle')
  const employeeOptions = auditQuery.data?.employees?.length
    ? auditQuery.data.employees.map(employee => ({
        id: employee.employeeId,
        label: employee.employeeName,
      }))
    : (employeeOptionsQuery.data ?? [])
  const vehicleOptions = auditQuery.data?.vehicles?.length
    ? auditQuery.data.vehicles.map(vehicle => ({
        id: vehicle.vehicleId,
        label: vehicle.vehicleName,
      }))
    : (vehicleOptionsQuery.data ?? []).map(vehicle => ({
        id: vehicle.key,
        label: vehicle.value,
      }))
  const runs = useMemo(() => auditQuery.data?.runs ?? [], [auditQuery.data?.runs])
  const [selectedRunId, setSelectedRunId] = useState('')
  const selectedRun = runs.find(run => run.runId === selectedRunId) ?? runs[0] ?? null
  const points = useMemo(() => runPoints(selectedRun), [selectedRun])

  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      <MapMetric label="Delivery runs" value={amount(auditQuery.data?.totalRuns ?? 0)} detail={`${auditQuery.data?.totalTasks ?? 0} tasks`} />
      <MapMetric label="Customer stops" value={amount(auditQuery.data?.totalCustomerStops ?? 0)} detail="Same-company tasks combined" />
      <MapMetric label="Transport cost" value={`৳${amount(auditQuery.data?.totalTransportCost ?? 0)}`} detail={`৳${amount(auditQuery.data?.averageCostPerRun ?? 0)} per run`} />
      <MapMetric label="Coordinate distance" value={`${(auditQuery.data?.totalDistanceKm ?? 0).toFixed(1)} km`} detail="Straight-line leg estimate" />
      <MapMetric label="Runs to review" value={amount(auditQuery.data?.reviewRunCount ?? 0)} detail={`${auditQuery.data?.durationReviewRunCount ?? 0} duration`} />
      <MapMetric label="Potential excess" value={`৳${amount(auditQuery.data?.potentialExcessPayment ?? 0)}`} detail={`${auditQuery.data?.highCostRunCount ?? 0} high-cost runs`} />
    </div>

    <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-4 xl:grid-cols-7">
      <label className="text-xs font-medium text-slate-500">Start
        <input type="date" value={filters.startDate} onChange={event => setFilters(current => ({ ...current, startDate: event.target.value }))} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-900" />
      </label>
      <label className="text-xs font-medium text-slate-500">End
        <input type="date" value={filters.endDate} onChange={event => setFilters(current => ({ ...current, endDate: event.target.value }))} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-900" />
      </label>
      <label className="text-xs font-medium text-slate-500">Delivery person
        <select value={filters.employeeId ?? 0} onChange={event => setFilters(current => ({ ...current, employeeId: Number(event.target.value) || undefined }))} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-900">
          <option value={0}>All</option>
          {employeeOptions.map(employee => <option key={employee.id} value={employee.id}>{employee.label}</option>)}
        </select>
      </label>
      <label className="text-xs font-medium text-slate-500">Vehicle
        <select value={filters.vehicleId ?? 0} onChange={event => setFilters(current => ({ ...current, vehicleId: Number(event.target.value) || undefined }))} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-900">
          <option value={0}>All</option>
          {vehicleOptions.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.label}</option>)}
        </select>
      </label>
      <label className="text-xs font-medium text-slate-500">Audit status
        <select value={filters.auditStatus ?? 'All'} onChange={event => setFilters(current => ({ ...current, auditStatus: event.target.value }))} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-900">
          {auditStatuses.map(status => <option key={status}>{status}</option>)}
        </select>
      </label>
      <label className="text-xs font-medium text-slate-500">Task ID
        <input inputMode="numeric" value={draftTaskId} onChange={event => setDraftTaskId(event.target.value.replace(/\D/g, ''))} placeholder="e.g. 35447" className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-900" />
      </label>
      <div className="flex items-end">
        <button type="button" onClick={() => setFilters(current => ({ ...current, taskId: Number(draftTaskId) || undefined }))} className="h-9 w-full rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800">Apply task</button>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(370px,.65fr)]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <MapContainer center={warehouse} zoom={12} className="h-[590px] w-full" scrollWheelZoom>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <CircleMarker center={warehouse} radius={8} pathOptions={{ color: '#0f172a', fillColor: '#10b981', fillOpacity: 1 }}>
            <Popup><strong>Warehouse_Gazipur</strong></Popup>
          </CircleMarker>
          {selectedRun?.legs.map(leg => {
            const legPoints: LatLngExpression[] = []
            if (leg.startLatitude != null && leg.startLongitude != null) legPoints.push([leg.startLatitude, leg.startLongitude])
            if (leg.endLatitude != null && leg.endLongitude != null) legPoints.push([leg.endLatitude, leg.endLongitude])
            return legPoints.length === 2 ? <Polyline key={leg.transportationId} positions={legPoints} pathOptions={{ color: leg.wayStatus === 1 ? '#f59e0b' : '#2563eb', weight: 5, opacity: 0.8 }}>
              <Tooltip sticky>{leg.startLocation || 'Unknown'} → {leg.endLocation || 'Unknown'} · {leg.vehicleName} · ৳{amount(leg.cost)}</Tooltip>
            </Polyline> : null
          })}
          {selectedRun?.stops.map(stop => stop.latitude != null && stop.longitude != null ? <CircleMarker
            key={`${stop.taskId}-${stop.sequence}`}
            center={[stop.latitude, stop.longitude]}
            radius={7}
            pathOptions={{ color: '#7c3aed', fillColor: '#8b5cf6', fillOpacity: 0.9 }}
          >
            <Tooltip>{stop.sequence}. {stop.customerName}</Tooltip>
            <Popup><strong>{stop.customerName}</strong><br />Task {stop.taskId}<br />Arrival: {timeText(stop.arrivedAt)}<br />{stop.packageType}</Popup>
          </CircleMarker> : null)}
          <FitBounds points={points} />
        </MapContainer>
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">Blue = outbound, amber = return. Lines connect recorded segment coordinates; they are not exact road paths.</p>
      </div>

      <div className="max-h-[630px] space-y-2 overflow-y-auto pr-1">
        {runs.map(run => <button
          key={run.runId}
          type="button"
          onClick={() => setSelectedRunId(run.runId)}
          className={`w-full rounded-xl border p-3 text-left transition ${selectedRun?.runId === run.runId ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-950">{run.employeeName}</p>
              <p className="text-xs text-slate-500">{run.deliveryDate.slice(0, 10)} · Tasks {run.taskIds.join(', ')}</p>
            </div>
            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusTone(run.auditStatus)}`}>{run.auditStatus}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-slate-700">{run.customerNames || 'Customer unavailable'}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>Duration <strong className="text-slate-700">{duration(run.grossDurationMinutes)}</strong></span>
            <span>Return <strong className="text-slate-700">{duration(run.returnDurationMinutes)}</strong></span>
            <span>Cost <strong className="text-slate-700">৳{amount(run.actualCost)}</strong></span>
            <span>Expected <strong className="text-slate-700">{run.expectedCost == null ? '—' : `৳${amount(run.expectedCost)}`}</strong></span>
            <span>Vehicles <strong className="text-slate-700">{run.vehicleNames || '—'}</strong></span>
            <span>Stops <strong className="text-slate-700">{run.customerStopCount}</strong></span>
          </div>
        </button>)}
        {!auditQuery.isLoading && runs.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No delivery runs match the selected filters.</div>}
      </div>
    </div>

    {selectedRun && <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4 xl:grid-cols-8">
      <div><p className="text-xs text-slate-500">Run start</p><p className="font-semibold">{timeText(selectedRun.startedAt)}</p></div>
      <div><p className="text-xs text-slate-500">Last OTP</p><p className="font-semibold">{timeText(selectedRun.lastDeliveryAt)}</p></div>
      <div><p className="text-xs text-slate-500">Completed</p><p className="font-semibold">{timeText(selectedRun.completedAt)}</p></div>
      <div><p className="text-xs text-slate-500">Gross duration</p><p className="font-semibold">{duration(selectedRun.grossDurationMinutes)}</p></div>
      <div><p className="text-xs text-slate-500">Longest gap</p><p className="font-semibold">{duration(selectedRun.longestCustomerGapMinutes)}</p></div>
      <div><p className="text-xs text-slate-500">Coordinate distance</p><p className="font-semibold">{selectedRun.coordinateDistanceKm.toFixed(1)} km</p></div>
      <div><p className="text-xs text-slate-500">Warehouse start</p><p className="font-semibold">{selectedRun.startsAtWarehouse ? 'Yes' : 'No'}</p></div>
      <div><p className="text-xs text-slate-500">Warehouse return</p><p className="font-semibold">{selectedRun.returnsToWarehouse ? 'Yes' : 'No'}</p></div>
    </div>}

    {auditQuery.isFetching && <p className="text-center text-sm text-slate-500">Loading delivery audit…</p>}
    {auditQuery.isError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Delivery-audit API is unavailable. Deploy the included backend files and refresh.</p>}
  </div>
}

export function DashboardMapsTab({ initialSection = 'customers' }: { initialSection?: 'customers' | 'audit' }) {
  const [section, setSection] = useState<'customers' | 'audit'>(initialSection)

  return <section className="space-y-4">
    <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
      <div className="flex flex-wrap gap-1">
        <button type="button" onClick={() => setSection('customers')} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${section === 'customers' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><MapPin size={16} />Customer Map</button>
        <button type="button" onClick={() => setSection('audit')} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${section === 'audit' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Route size={16} />Delivery Route & Transport Audit</button>
      </div>
    </div>
    {section === 'customers' ? <CustomerMapPanel /> : <DeliveryAuditPanel />}
  </section>
}

export function DeliveryAuditAttention({ onOpenMaps }: { onOpenMaps: () => void }) {
  const filters = useMemo(() => recentDaysRange(30), [])
  const audit = useDeliveryAudit(filters)

  return <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div><h2 className="font-semibold text-slate-950">Delivery Audit Alerts</h2><p className="mt-0.5 text-xs text-slate-500">Last 30 days · route, duration and transport-cost exceptions</p></div>
      <button type="button" onClick={onOpenMaps} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"><Navigation size={14} />Open full audit</button>
    </header>
    <div className="grid grid-cols-2 gap-3 p-5 lg:grid-cols-4">
      <div className="rounded-xl bg-red-50 p-3"><AlertTriangle className="text-red-600" size={18} /><p className="mt-2 text-2xl font-bold text-red-800">{audit.data?.highCostRunCount ?? 0}</p><p className="text-xs font-medium text-red-700">High-cost runs</p></div>
      <div className="rounded-xl bg-amber-50 p-3"><Clock3 className="text-amber-600" size={18} /><p className="mt-2 text-2xl font-bold text-amber-800">{audit.data?.durationReviewRunCount ?? 0}</p><p className="text-xs font-medium text-amber-700">Duration reviews</p></div>
      <div className="rounded-xl bg-blue-50 p-3"><Truck className="text-blue-600" size={18} /><p className="mt-2 text-2xl font-bold text-blue-800">{audit.data?.reviewRunCount ?? 0}</p><p className="text-xs font-medium text-blue-700">Total runs to review</p></div>
      <div className="rounded-xl bg-violet-50 p-3"><Banknote className="text-violet-600" size={18} /><p className="mt-2 text-2xl font-bold text-violet-800">৳{amount(audit.data?.potentialExcessPayment ?? 0)}</p><p className="text-xs font-medium text-violet-700">Potential excess</p></div>
    </div>
    {audit.isError && <p className="mx-5 mb-5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Delivery-audit summary is unavailable.</p>}
  </section>
}
