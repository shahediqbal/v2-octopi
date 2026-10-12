import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CircleDollarSign, PackageCheck, ShoppingCart, X } from 'lucide-react'
import { DashboardDataTable } from '@/components/dashboard/DashboardDataTable'
import { DashboardExcelButton } from '@/components/dashboard/DashboardExcelButton'
import { exportExcelOnDemand } from '@/utils/lazyExportExcel'
import type { CreditRiskAnalysisRow } from '@/utils/creditRiskAnalysis'
import type { SuperAdminPurchaseDetail } from '@/types/superAdminOverviewDetails'
import type { PendingOrderDetail, StockSummaryProduct } from '@/types/superAdminDashboard'

export type OverviewDrilldownKind = 'sales' | 'recovery' | 'purchases' | 'pending-orders' | 'stock-value'

interface OverviewDrilldownModalProps {
  kind: OverviewDrilldownKind
  startDate: string
  endDate: string
  creditRows: CreditRiskAnalysisRow[]
  purchaseRows: SuperAdminPurchaseDetail[]
  pendingOrderRows: PendingOrderDetail[]
  stockRows: StockSummaryProduct[]
  isLoading: boolean
  isError: boolean
  onClose: () => void
}

function money(value: number) {
  return `৳ ${Math.round(value).toLocaleString('en-BD')}`
}

function shortDate(value: string | null) {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-GB')
}

const modalConfig = {
  sales: {
    title: 'Customer Sales Details',
    detail: 'Period sales with each customer’s open closing due',
    icon: ShoppingCart,
    tone: 'bg-blue-100 text-blue-700',
  },
  recovery: {
    title: 'Customer Recovery Details',
    detail: 'Opening, sales, payments and closing balance after payment',
    icon: CircleDollarSign,
    tone: 'bg-emerald-100 text-emerald-700',
  },
  purchases: {
    title: 'Supplier Purchase Details',
    detail: 'Confirmed/received purchases grouped by supplier',
    icon: PackageCheck,
    tone: 'bg-amber-100 text-amber-700',
  },
  'pending-orders': {
    title: 'Pending Order Details',
    detail: 'Orders still open under the dashboard pending-status rule',
    icon: AlertTriangle,
    tone: 'bg-red-100 text-red-700',
  },
  'stock-value': {
    title: 'Stock Value Calculation',
    detail: 'Current quantity multiplied by the resolved latest purchase price',
    icon: PackageCheck,
    tone: 'bg-emerald-100 text-emerald-700',
  },
} as const

export function OverviewDrilldownModal({
  kind,
  startDate,
  endDate,
  creditRows,
  purchaseRows,
  pendingOrderRows,
  stockRows,
  isLoading,
  isError,
  onClose,
}: OverviewDrilldownModalProps) {
  const [openDueOnly, setOpenDueOnly] = useState(kind === 'sales')
  const config = modalConfig[kind]
  const Icon = config.icon

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const salesRows = useMemo(
    () => creditRows.filter(row => row.sales > 0 && (!openDueOnly || row.closing > 0)),
    [creditRows, openDueOnly],
  )
  const recoveryRows = useMemo(
    () => creditRows.filter(row => row.payment > 0),
    [creditRows],
  )

  const exportRows = async () => {
    if (kind === 'sales') {
      await exportExcelOnDemand({
        fileName: `Dashboard_Customer_Sales_${startDate}_to_${endDate}`,
        title: 'Dashboard Customer Sales Details',
        subtitle: `${startDate} to ${endDate}`,
        sheetName: 'Customer Sales',
        columns: [
          { key: 'customerName', header: 'Customer', width: 28 },
          { key: 'marketingName', header: 'Marketing', width: 22 },
          { key: 'orderCount', header: 'Sales Orders', format: 'integer' },
          { key: 'sales', header: 'Period Sales', format: 'number' },
          { key: 'openDue', header: 'Open Sales Due', format: 'number' },
          { key: 'lastSaleDate', header: 'Last Sale Date', format: 'date' },
        ],
        data: salesRows.map(row => ({
          customerName: row.customerName,
          marketingName: row.marketingName,
          orderCount: row.orderCount,
          sales: row.sales,
          openDue: Math.max(row.closing, 0),
          lastSaleDate: row.lastSaleDate,
        })),
        filters: [
          ['Date Range', `${startDate} – ${endDate}`],
          ['Rows', openDueOnly ? 'Customers with open due only' : 'All customers with sales'],
        ],
        summaryCards: [
          ['Customers', salesRows.length],
          ['Period Sales', salesRows.reduce((sum, row) => sum + row.sales, 0)],
          ['Open Sales Due', salesRows.reduce((sum, row) => sum + Math.max(row.closing, 0), 0)],
        ],
      })
      return
    }

    if (kind === 'recovery') {
      await exportExcelOnDemand({
        fileName: `Dashboard_Customer_Recovery_${startDate}_to_${endDate}`,
        title: 'Dashboard Customer Recovery Details',
        subtitle: `${startDate} to ${endDate}`,
        sheetName: 'Customer Recovery',
        columns: [
          { key: 'customerName', header: 'Customer', width: 28 },
          { key: 'marketingName', header: 'Marketing', width: 22 },
          { key: 'opening', header: 'Opening Balance', format: 'number' },
          { key: 'sales', header: 'Period Sales', format: 'number' },
          { key: 'payment', header: 'Payment', format: 'number' },
          { key: 'closing', header: 'Closing After Payment', format: 'number' },
          { key: 'recoveryRate', header: 'Recovery %', format: 'number' },
          { key: 'lastPaymentDate', header: 'Last Payment Date', format: 'date' },
        ],
        data: recoveryRows.map(row => ({
          customerName: row.customerName,
          marketingName: row.marketingName,
          opening: row.opening,
          sales: row.sales,
          payment: row.payment,
          closing: row.closing,
          recoveryRate: row.recoveryRate,
          lastPaymentDate: row.lastPaymentDate,
        })),
        filters: [['Date Range', `${startDate} – ${endDate}`]],
        summaryCards: [
          ['Customers', recoveryRows.length],
          ['Payments', recoveryRows.reduce((sum, row) => sum + row.payment, 0)],
          ['Closing Balance', recoveryRows.reduce((sum, row) => sum + row.closing, 0)],
        ],
      })
      return
    }

    if (kind === 'purchases') {
      await exportExcelOnDemand({
        fileName: `Dashboard_Supplier_Purchases_${startDate}_to_${endDate}`,
        title: 'Dashboard Supplier Purchase Details',
        subtitle: `${startDate} to ${endDate}`,
        sheetName: 'Supplier Purchases',
        columns: [
          { key: 'supplierName', header: 'Supplier', width: 28 },
          { key: 'supplierAddress', header: 'Address', width: 38 },
          { key: 'invoiceCount', header: 'Invoices', format: 'integer' },
          { key: 'totalPurchase', header: 'Total Purchase', format: 'number' },
          { key: 'averageInvoiceValue', header: 'Average Invoice', format: 'number' },
          { key: 'lastPurchaseDate', header: 'Last Purchase Date', format: 'date' },
        ],
        data: purchaseRows as unknown as Record<string, unknown>[],
        filters: [['Date Range', `${startDate} – ${endDate}`]],
        summaryCards: [
          ['Suppliers', purchaseRows.length],
          ['Invoices', purchaseRows.reduce((sum, row) => sum + row.invoiceCount, 0)],
          ['Total Purchase', purchaseRows.reduce((sum, row) => sum + row.totalPurchase, 0)],
        ],
      })
      return
    }

    if (kind === 'pending-orders') {
      await exportExcelOnDemand({
        fileName: `Dashboard_Pending_Orders_${startDate}_to_${endDate}`,
        title: 'Dashboard Pending Order Details',
        subtitle: `${startDate} to ${endDate}`,
        sheetName: 'Pending Orders',
        columns: [
          { key: 'customerName', header: 'Customer', width: 28 },
          { key: 'soSystemNo', header: 'Order Number', width: 18 },
          { key: 'invoiceDate', header: 'Order Date', format: 'date' },
          { key: 'currentStatusName', header: 'Current Status', width: 22 },
          { key: 'quantity', header: 'Quantity', format: 'number' },
          { key: 'amount', header: 'Amount', format: 'number' },
          { key: 'daysPending', header: 'Days Pending', format: 'integer' },
        ],
        data: pendingOrderRows as unknown as Record<string, unknown>[],
        filters: [['Date Range', `${startDate} – ${endDate}`]],
        summaryCards: [
          ['Pending Orders', pendingOrderRows.length],
          ['Quantity', pendingOrderRows.reduce((sum, row) => sum + row.quantity, 0)],
          ['Amount', pendingOrderRows.reduce((sum, row) => sum + row.amount, 0)],
        ],
      })
      return
    }

    await exportExcelOnDemand({
      fileName: 'Dashboard_Stock_Value_Calculation',
      title: 'Dashboard Stock Value Calculation',
      subtitle: 'Current quantity × resolved latest purchase price',
      sheetName: 'Stock Value',
      columns: [
        { key: 'productName', header: 'Product', width: 30 },
        { key: 'categoryName', header: 'Category', width: 20 },
        { key: 'currentQuantity', header: 'Current Quantity', format: 'number' },
        { key: 'latestPurchasePrice', header: 'Latest Purchase Price', format: 'number' },
        { key: 'priceSource', header: 'Price Source', width: 24 },
        { key: 'latestPurchaseDate', header: 'Price Date', format: 'date' },
        { key: 'stockValue', header: 'Stock Value', format: 'number' },
      ],
      data: stockRows as unknown as Record<string, unknown>[],
      summaryCards: [
        ['Products', stockRows.length],
        ['Quantity', stockRows.reduce((sum, row) => sum + row.currentQuantity, 0)],
        ['Stock Value', stockRows.reduce((sum, row) => sum + row.stockValue, 0)],
      ],
    })
  }

  const activeRowCount = kind === 'sales'
    ? salesRows.length
    : kind === 'recovery'
      ? recoveryRows.length
      : kind === 'purchases'
        ? purchaseRows.length
        : kind === 'pending-orders'
          ? pendingOrderRows.length
          : stockRows.length

  return <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby="overview-drilldown-title"
    onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}
  >
    <div className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`rounded-xl p-2.5 ${config.tone}`}><Icon size={20} /></div>
          <div>
            <h2 id="overview-drilldown-title" className="text-lg font-bold text-slate-950">{config.title}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{config.detail} · {startDate} to {endDate}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close details">
          <X size={19} />
        </button>
      </header>

      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div>
          {kind === 'sales' && <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
            <input type="checkbox" checked={openDueOnly} onChange={event => setOpenDueOnly(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
            Open sales due only
          </label>}
          {kind === 'recovery' && <p className="text-xs text-slate-500">{recoveryRows.length} customers with payment activity</p>}
          {kind === 'purchases' && <p className="text-xs text-slate-500">{purchaseRows.length} suppliers with purchase activity</p>}
          {kind === 'pending-orders' && <p className="text-xs text-slate-500">{pendingOrderRows.length} orders match the pending rule</p>}
          {kind === 'stock-value' && <p className="text-xs text-slate-500">{stockRows.length} products · formula: quantity × unit price</p>}
        </div>
        <DashboardExcelButton
          disabled={isLoading || isError || !activeRowCount}
          onExport={exportRows}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        {!isLoading && !isError && kind === 'sales' && <DashboardDataTable
          rows={salesRows}
          minWidthClassName="min-w-[980px]"
          defaultSort={{ columnId: 'sales', direction: 'desc' }}
          initialRowCount={20}
          rowKey={(row, index) => `${row.customerName}-${index}`}
          columns={[
            { id: 'customer', header: 'Customer', sortValue: row => row.customerName, render: row => <span className="font-semibold text-slate-900">{row.customerName}</span> },
            { id: 'marketing', header: 'Marketing', sortValue: row => row.marketingName, render: row => row.marketingName },
            { id: 'orders', header: 'Sales orders', align: 'right', sortValue: row => row.orderCount, render: row => row.orderCount ?? '—' },
            { id: 'sales', header: 'Period sales', align: 'right', sortValue: row => row.sales, render: row => money(row.sales) },
            { id: 'openDue', header: 'Open sales due', align: 'right', sortValue: row => Math.max(row.closing, 0), render: row => <span className="font-semibold text-red-700">{money(Math.max(row.closing, 0))}</span> },
            { id: 'lastSale', header: 'Last sale', align: 'right', sortValue: row => row.lastSaleDate ? new Date(row.lastSaleDate).getTime() : null, render: row => shortDate(row.lastSaleDate) },
          ]}
        />}

        {!isLoading && !isError && kind === 'recovery' && <DashboardDataTable
          rows={recoveryRows}
          minWidthClassName="min-w-[1120px]"
          defaultSort={{ columnId: 'payment', direction: 'desc' }}
          initialRowCount={20}
          rowKey={(row, index) => `${row.customerName}-${index}`}
          columns={[
            { id: 'customer', header: 'Customer', sortValue: row => row.customerName, render: row => <span className="font-semibold text-slate-900">{row.customerName}</span> },
            { id: 'marketing', header: 'Marketing', sortValue: row => row.marketingName, render: row => row.marketingName },
            { id: 'opening', header: 'Opening', align: 'right', sortValue: row => row.opening, render: row => money(row.opening) },
            { id: 'sales', header: 'Sales', align: 'right', sortValue: row => row.sales, render: row => money(row.sales) },
            { id: 'payment', header: 'Payment', align: 'right', sortValue: row => row.payment, render: row => <span className="font-semibold text-emerald-700">{money(row.payment)}</span> },
            { id: 'closing', header: 'Closing after payment', align: 'right', sortValue: row => row.closing, render: row => money(row.closing) },
            { id: 'rate', header: 'Recovery', align: 'right', sortValue: row => row.recoveryRate, render: row => `${row.recoveryRate.toFixed(1)}%` },
            { id: 'lastPayment', header: 'Last payment', align: 'right', sortValue: row => row.lastPaymentDate ? new Date(row.lastPaymentDate).getTime() : null, render: row => shortDate(row.lastPaymentDate) },
          ]}
        />}

        {!isLoading && !isError && kind === 'purchases' && <DashboardDataTable
          rows={purchaseRows}
          minWidthClassName="min-w-[1120px]"
          defaultSort={{ columnId: 'purchase', direction: 'desc' }}
          initialRowCount={20}
          rowKey={row => row.supplierId}
          columns={[
            { id: 'supplier', header: 'Supplier', sortValue: row => row.supplierName, render: row => <p className="font-semibold text-slate-900">{row.supplierName}</p> },
            { id: 'address', header: 'Address', sortValue: row => row.supplierAddress || 'No address', render: row => <p className="max-w-sm truncate">{row.supplierAddress || 'No address'}</p> },
            { id: 'invoices', header: 'Invoices', align: 'right', sortValue: row => row.invoiceCount, render: row => row.invoiceCount },
            { id: 'purchase', header: 'Total purchase', align: 'right', sortValue: row => row.totalPurchase, render: row => <span className="font-semibold text-slate-900">{money(row.totalPurchase)}</span> },
            { id: 'average', header: 'Average invoice', align: 'right', sortValue: row => row.averageInvoiceValue, render: row => money(row.averageInvoiceValue) },
            { id: 'lastPurchase', header: 'Last purchase', align: 'right', sortValue: row => row.lastPurchaseDate ? new Date(row.lastPurchaseDate).getTime() : null, render: row => shortDate(row.lastPurchaseDate) },
          ]}
        />}

        {!isLoading && !isError && kind === 'pending-orders' && <DashboardDataTable
          rows={pendingOrderRows}
          minWidthClassName="min-w-[1080px]"
          defaultSort={{ columnId: 'daysPending', direction: 'desc' }}
          initialRowCount={20}
          rowKey={row => row.soSystemId}
          columns={[
            { id: 'customer', header: 'Customer', sortValue: row => row.customerName, render: row => <span className="font-semibold text-slate-900">{row.customerName || '—'}</span> },
            { id: 'order', header: 'Order number', sortValue: row => row.soSystemNo, render: row => row.soSystemNo || `#${row.soSystemId}` },
            { id: 'date', header: 'Order date', sortValue: row => row.invoiceDate, render: row => shortDate(row.invoiceDate) },
            { id: 'status', header: 'Current status', sortValue: row => row.currentStatusName, render: row => row.currentStatusName || 'Pending' },
            { id: 'quantity', header: 'Quantity', align: 'right', sortValue: row => row.quantity, render: row => row.quantity.toLocaleString('en-BD') },
            { id: 'amount', header: 'Amount', align: 'right', sortValue: row => row.amount, render: row => <span className="font-semibold">{money(row.amount)}</span> },
            { id: 'daysPending', header: 'Days pending', align: 'right', sortValue: row => row.daysPending, render: row => `${row.daysPending} days` },
          ]}
        />}

        {!isLoading && !isError && kind === 'stock-value' && <DashboardDataTable
          rows={stockRows}
          minWidthClassName="min-w-[1180px]"
          defaultSort={{ columnId: 'stockValue', direction: 'desc' }}
          initialRowCount={20}
          rowKey={row => row.productId}
          columns={[
            { id: 'product', header: 'Product', sortValue: row => row.productName, render: row => <span className="font-semibold text-slate-900">{row.productName}</span> },
            { id: 'category', header: 'Category', sortValue: row => row.categoryName, render: row => row.categoryName || 'Uncategorised' },
            { id: 'quantity', header: 'Current quantity', align: 'right', sortValue: row => row.currentQuantity, render: row => row.currentQuantity.toLocaleString('en-BD') },
            { id: 'price', header: 'Unit price', align: 'right', sortValue: row => row.latestPurchasePrice, render: row => money(row.latestPurchasePrice ?? 0) },
            { id: 'source', header: 'Price source', sortValue: row => row.priceSource, render: row => row.priceSource || 'Missing' },
            { id: 'date', header: 'Price date', sortValue: row => row.latestPurchaseDate, render: row => shortDate(row.latestPurchaseDate) },
            { id: 'stockValue', header: 'Stock value', align: 'right', sortValue: row => row.stockValue, render: row => <span className="font-semibold">{money(row.stockValue)}</span> },
          ]}
        />}

        {isLoading && <p className="py-10 text-center text-sm text-slate-500">Loading details…</p>}
        {isError && <p className="py-10 text-center text-sm font-medium text-red-600">The detail data could not be loaded. Please retry after deploying the Part 2 backend.</p>}
      </div>
    </div>
  </div>
}
