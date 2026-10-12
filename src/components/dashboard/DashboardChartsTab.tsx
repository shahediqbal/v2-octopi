import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { useMonthlyPurchaseSalesPayment } from '@/hooks/useSalesPaymentDashboard'
import { analyseCreditRisk } from '@/utils/creditRiskAnalysis'
import type { ApiResponse } from '@/types/customer'
import type { MonthlyCreditItem } from '@/types/monthlyCreditReport'
import type { CreditRiskSummary, StockMovementSummary } from '@/types/superAdminDashboard'

type FinancialMetric = 'sales' | 'payment' | 'purchase'
type FinancialChartType = 'line' | 'bar' | 'area'

interface DashboardChartsTabProps {
  enabled: boolean
  creditRisk?: CreditRiskSummary
  stockMovement?: StockMovementSummary
}

interface TrendSeries {
  id: string
  label: string
  values: number[]
  colour: string
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const palette = ['#0f766e', '#2563eb', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#65a30d', '#c026d3', '#475569']
const metricConfig: Record<FinancialMetric, { label: string; key: 'totalSales' | 'totalPayment' | 'totalPurchase' }> = {
  sales: { label: 'Sales', key: 'totalSales' },
  payment: { label: 'Recovery', key: 'totalPayment' },
  purchase: { label: 'Purchase', key: 'totalPurchase' },
}

function dateText(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function compactAmount(value: number) {
  return new Intl.NumberFormat('en-BD', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function FilterPill({
  selected,
  label,
  onClick,
}: {
  selected: boolean
  label: string
  onClick: () => void
}) {
  return <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selected
      ? 'border-emerald-600 bg-emerald-600 text-white'
      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
  >
    {label}
  </button>
}

function FinancialTrendChart({
  series,
  chartType,
}: {
  series: TrendSeries[]
  chartType: FinancialChartType
}) {
  const chartWidth = 1000
  const chartHeight = 330
  const left = 72
  const right = 22
  const top = 22
  const bottom = 48
  const plotWidth = chartWidth - left - right
  const plotHeight = chartHeight - top - bottom
  const maximum = Math.max(...series.flatMap(item => item.values), 1)
  const roundedMaximum = maximum > 0 ? maximum : 1
  const monthWidth = plotWidth / months.length
  const x = (index: number) => left + (index + 0.5) * monthWidth
  const y = (value: number) => top + plotHeight - value / roundedMaximum * plotHeight
  const barGap = 2
  const barWidth = Math.min(
    20,
    Math.max(4, (monthWidth - 10 - Math.max(series.length - 1, 0) * barGap) / Math.max(series.length, 1)),
  )
  const barGroupWidth = series.length * barWidth + Math.max(series.length - 1, 0) * barGap

  return <div>
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="min-w-[760px]"
        role="img"
        aria-label={`Monthly financial ${chartType} chart`}
      >
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const gridY = top + plotHeight - ratio * plotHeight
          return <g key={ratio}>
            <line x1={left} x2={chartWidth - right} y1={gridY} y2={gridY} stroke="#e2e8f0" strokeWidth="1" />
            <text x={left - 10} y={gridY + 4} textAnchor="end" fontSize="11" fill="#64748b">{compactAmount(roundedMaximum * ratio)}</text>
          </g>
        })}
        {months.map((month, index) => <text key={month} x={x(index)} y={chartHeight - 18} textAnchor="middle" fontSize="11" fill="#64748b">{month}</text>)}
        {chartType === 'bar' && series.flatMap((item, seriesIndex) => item.values.map((value, monthIndex) => {
          const barX = x(monthIndex) - barGroupWidth / 2 + seriesIndex * (barWidth + barGap)
          const barY = y(value)
          return <rect
            key={`${item.id}-${monthIndex}`}
            x={barX}
            y={barY}
            width={barWidth}
            height={top + plotHeight - barY}
            rx="2"
            fill={item.colour}
          >
            <title>{`${months[monthIndex]} · ${item.label}: ৳ ${value.toLocaleString('en-BD')}`}</title>
          </rect>
        }))}
        {chartType !== 'bar' && series.map(item => {
          const points = item.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')
          const areaPoints = `${x(0)},${top + plotHeight} ${points} ${x(months.length - 1)},${top + plotHeight}`
          return <g key={item.id}>
            {chartType === 'area' && <polygon points={areaPoints} fill={item.colour} fillOpacity="0.12" />}
            <polyline points={points} fill="none" stroke={item.colour} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {item.values.map((value, index) => <circle key={`${item.id}-${index}`} cx={x(index)} cy={y(value)} r="3.5" fill="white" stroke={item.colour} strokeWidth="2">
              <title>{`${months[index]} · ${item.label}: ৳ ${value.toLocaleString('en-BD')}`}</title>
            </circle>)}
          </g>
        })}
      </svg>
    </div>
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
      {series.map(item => <div key={item.id} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.colour }} />{item.label}
      </div>)}
    </div>
  </div>
}

function MarketingYearChart({
  years,
  data,
  marketingName,
}: {
  years: number[]
  data: Map<number, { sales: number; recovery: number }>
  marketingName: string
}) {
  const width = 900
  const height = 320
  const left = 72
  const right = 20
  const top = 20
  const bottom = 52
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const maximum = Math.max(...years.flatMap(year => {
    const value = data.get(year)
    return [value?.sales ?? 0, value?.recovery ?? 0]
  }), 1)
  const groupWidth = plotWidth / Math.max(years.length, 1)
  const barWidth = Math.min(58, groupWidth * 0.28)
  const y = (value: number) => top + plotHeight - value / maximum * plotHeight

  return <div>
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[700px]" role="img" aria-label={`${marketingName} yearly sales and recovery`}>
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const gridY = top + plotHeight - ratio * plotHeight
          return <g key={ratio}>
            <line x1={left} x2={width - right} y1={gridY} y2={gridY} stroke="#e2e8f0" />
            <text x={left - 10} y={gridY + 4} textAnchor="end" fontSize="11" fill="#64748b">{compactAmount(maximum * ratio)}</text>
          </g>
        })}
        {years.map((year, index) => {
          const values = data.get(year) ?? { sales: 0, recovery: 0 }
          const center = left + groupWidth * index + groupWidth / 2
          const salesHeight = plotHeight - (y(values.sales) - top)
          const recoveryHeight = plotHeight - (y(values.recovery) - top)
          return <g key={year}>
            <rect x={center - barWidth - 3} y={y(values.sales)} width={barWidth} height={salesHeight} rx="5" fill="#2563eb">
              <title>{`${year} Sales: ৳ ${values.sales.toLocaleString('en-BD')}`}</title>
            </rect>
            <rect x={center + 3} y={y(values.recovery)} width={barWidth} height={recoveryHeight} rx="5" fill="#059669">
              <title>{`${year} Recovery: ৳ ${values.recovery.toLocaleString('en-BD')}`}</title>
            </rect>
            <text x={center} y={height - 20} textAnchor="middle" fontSize="12" fontWeight="600" fill="#475569">{year}</text>
          </g>
        })}
      </svg>
    </div>
    <div className="mt-3 flex gap-5 text-xs font-medium text-slate-600">
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-blue-600" />Sales</span>
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-600" />Recovery</span>
    </div>
  </div>
}

function DistributionBars({
  rows,
  valueFormatter = value => compactAmount(value),
}: {
  rows: { label: string; value: number; colour: string }[]
  valueFormatter?: (value: number) => string
}) {
  const maximum = Math.max(...rows.map(row => row.value), 1)
  return <div className="space-y-3">
    {rows.map(row => <div key={row.label}>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-600">{row.label}</span>
        <span className="font-semibold text-slate-900">{valueFormatter(row.value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${row.value / maximum * 100}%`, backgroundColor: row.colour }} />
      </div>
    </div>)}
  </div>
}

export function DashboardChartsTab({ enabled, creditRisk, stockMovement }: DashboardChartsTabProps) {
  const currentYear = new Date().getFullYear()
  const years = useMemo(
    () => Array.from({ length: Math.max(1, currentYear - 2024 + 1) }, (_, index) => 2024 + index),
    [currentYear],
  )
  const [selectedYears, setSelectedYears] = useState(years)
  const [selectedMetrics, setSelectedMetrics] = useState<FinancialMetric[]>(['sales', 'payment', 'purchase'])
  const [financialChartType, setFinancialChartType] = useState<FinancialChartType>('line')
  const [selectedMarketing, setSelectedMarketing] = useState('')
  const financial = useMonthlyPurchaseSalesPayment(
    dateText(years[0], 1, 1),
    dateText(currentYear, 12, 31),
    enabled,
  )

  const marketingQueries = useQueries({
    queries: years.map(year => ({
      queryKey: ['dashboardCharts', 'marketingYear', year],
      queryFn: () => apiClient
        .get<ApiResponse<MonthlyCreditItem[]>>(
          `/Report/GetCreditSummaryByMktByMonthForMd?employeeId=0&startDate=${dateText(year, 1, 1)}&endDate=${dateText(year, 12, 31)}`,
        )
        .then(response => response.dataObj ?? []),
      enabled,
      staleTime: 10 * 60_000,
    })),
  })

  const trendSeries = useMemo(() => {
    const rows = financial.data ?? []
    return selectedYears.flatMap((year, yearIndex) => selectedMetrics.map((metric, metricIndex) => {
      const config = metricConfig[metric]
      const values = months.map((_, monthIndex) => {
        const row = rows.find(item => item.year === year && item.month === monthIndex + 1)
        return Number(row?.[config.key] ?? 0)
      })
      const series: TrendSeries = {
        id: `${metric}-${year}`,
        label: `${config.label} ${year}`,
        values,
        colour: palette[(yearIndex * selectedMetrics.length + metricIndex) % palette.length],
      }
      return series
    }))
  }, [financial.data, selectedMetrics, selectedYears])

  const marketingByYear = useMemo(() => {
    const result = new Map<number, Map<string, { sales: number; recovery: number }>>()
    years.forEach((year, index) => {
      const rows = analyseCreditRisk(marketingQueries[index]?.data ?? [])
      const byMarketing = new Map<string, { sales: number; recovery: number }>()
      rows.forEach(row => {
        const current = byMarketing.get(row.marketingName) ?? { sales: 0, recovery: 0 }
        current.sales += row.sales
        current.recovery += row.payment
        byMarketing.set(row.marketingName, current)
      })
      result.set(year, byMarketing)
    })
    return result
  }, [marketingQueries, years])

  const marketingNames = useMemo(() => [...new Set(
    [...marketingByYear.values()].flatMap(map => [...map.keys()]),
  )].sort(), [marketingByYear])
  const activeMarketing = selectedMarketing || marketingNames[0] || ''
  const activeMarketingData = useMemo(() => {
    const result = new Map<number, { sales: number; recovery: number }>()
    selectedYears.forEach(year => {
      result.set(year, marketingByYear.get(year)?.get(activeMarketing) ?? { sales: 0, recovery: 0 })
    })
    return result
  }, [activeMarketing, marketingByYear, selectedYears])

  const toggleYear = (year: number) => setSelectedYears(current => current.includes(year)
    ? current.length === 1 ? current : current.filter(item => item !== year)
    : [...current, year].sort())
  const toggleMetric = (metric: FinancialMetric) => setSelectedMetrics(current => current.includes(metric)
    ? current.length === 1 ? current : current.filter(item => item !== metric)
    : [...current, metric])

  const ageingRows = [
    { label: '0–30 days', value: creditRisk?.days0To30 ?? 0, colour: '#10b981' },
    { label: '31–60 days', value: creditRisk?.days31To60 ?? 0, colour: '#f59e0b' },
    { label: '61–90 days', value: creditRisk?.days61To90 ?? 0, colour: '#f97316' },
    { label: 'Over 90 days', value: creditRisk?.daysOver90 ?? 0, colour: '#ef4444' },
  ]
  const movementRows = [
    { label: 'Fast moving', value: stockMovement?.fastMovingCount ?? 0, colour: '#10b981' },
    { label: 'Medium', value: stockMovement?.mediumMovingCount ?? 0, colour: '#3b82f6' },
    { label: 'Slow', value: stockMovement?.slowMovingCount ?? 0, colour: '#f59e0b' },
    { label: 'Idle', value: stockMovement?.idleCount ?? 0, colour: '#f97316' },
    { label: 'Dead stock', value: stockMovement?.deadCount ?? 0, colour: '#ef4444' },
    { label: 'Never moved', value: stockMovement?.neverMovedCount ?? 0, colour: '#64748b' },
  ]

  return <div className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-950">Monthly Sales, Recovery & Purchase</h2>
        <p className="mt-0.5 text-xs text-slate-500">Monthly comparison by selected year and metric</p>
      </header>
      <div className="p-5">
        <div className="mb-5 grid gap-4 lg:grid-cols-3">
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Years</p><div className="flex flex-wrap gap-2">{years.map(year => <FilterPill key={year} selected={selectedYears.includes(year)} label={String(year)} onClick={() => toggleYear(year)} />)}<FilterPill selected={selectedYears.length === years.length} label="All years" onClick={() => setSelectedYears(years)} /></div></div>
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Metrics</p><div className="flex flex-wrap gap-2">{(Object.keys(metricConfig) as FinancialMetric[]).map(metric => <FilterPill key={metric} selected={selectedMetrics.includes(metric)} label={metricConfig[metric].label} onClick={() => toggleMetric(metric)} />)}<FilterPill selected={selectedMetrics.length === 3} label="All" onClick={() => setSelectedMetrics(['sales', 'payment', 'purchase'])} /></div></div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Chart type</p>
            <div className="flex flex-wrap gap-2">
              {(['line', 'bar', 'area'] as FinancialChartType[]).map(chartType => <FilterPill
                key={chartType}
                selected={financialChartType === chartType}
                label={`${chartType.charAt(0).toUpperCase()}${chartType.slice(1)}`}
                onClick={() => setFinancialChartType(chartType)}
              />)}
            </div>
          </div>
        </div>
        <FinancialTrendChart series={trendSeries} chartType={financialChartType} />
        {financial.isLoading && <p className="py-6 text-center text-sm text-slate-500">Loading monthly financial trend…</p>}
        {financial.isError && <p className="py-6 text-center text-sm text-red-600">Monthly financial trend could not be loaded.</p>}
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
        <div><h2 className="font-semibold text-slate-950">Marketing Sales vs Recovery — Year to Year</h2><p className="mt-0.5 text-xs text-slate-500">Compare one marketing person across the selected years</p></div>
        <select value={activeMarketing} onChange={event => setSelectedMarketing(event.target.value)} className="h-9 max-w-72 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
          {marketingNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </header>
      <div className="p-5">
        <MarketingYearChart years={selectedYears} data={activeMarketingData} marketingName={activeMarketing || 'Marketing'} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {selectedYears.map(year => {
            const row = activeMarketingData.get(year) ?? { sales: 0, recovery: 0 }
            const rate = row.sales > 0 ? row.recovery / row.sales * 100 : 0
            return <div key={year} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-slate-900">{year}</p>
              <p className="mt-1 text-xs text-slate-500">Sales ৳ {compactAmount(row.sales)} · Recovery ৳ {compactAmount(row.recovery)}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-700">Recovery rate {rate.toFixed(1)}%</p>
            </div>
          })}
        </div>
        {marketingQueries.some(query => query.isLoading) && <p className="py-4 text-center text-sm text-slate-500">Loading marketing comparisons…</p>}
        {marketingQueries.some(query => query.isError) && <p className="py-4 text-center text-sm text-red-600">One or more yearly marketing datasets could not be loaded.</p>}
      </div>
    </section>

    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Customer Due Aging Distribution</h2>
        <p className="mb-5 mt-0.5 text-xs text-slate-500">Outstanding invoice balance by age</p>
        <DistributionBars rows={ageingRows} valueFormatter={value => `৳ ${compactAmount(value)}`} />
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Inventory Movement Distribution</h2>
        <p className="mb-5 mt-0.5 text-xs text-slate-500">Products by movement classification</p>
        <DistributionBars rows={movementRows} valueFormatter={value => value.toLocaleString('en-BD')} />
      </section>
    </div>
  </div>
}
