import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const protectedRouteSpy = vi.hoisted(() =>
  vi.fn(({ children }: { children: ReactNode }) => <>{children}</>),
)

vi.mock('@/auth/ProtectedRoute', () => ({
  ProtectedRoute: protectedRouteSpy,
}))

vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/layout/AppShell', () => ({
  AppShell: () => (
    <div data-testid="app-shell">
      <Outlet />
    </div>
  ),
}))

vi.mock('@/pages/sales-orders/CreateSalesOrderPage', () => ({
  CreateSalesOrderPage: () => <div>CreateSalesOrderPage</div>,
}))

vi.mock('@/pages/sales-orders/EditSalesOrderPage', () => ({
  EditSalesOrderPage: ({ mode }: { mode?: string }) => <div>{`EditSalesOrderPage:${mode ?? 'standard'}`}</div>,
}))

vi.mock('@/pages/sales-orders/PackageSalesOrderPage', () => ({
  PackageSalesOrderPage: () => <div>PackageSalesOrderPage</div>,
}))

vi.mock('@/pages/sales-orders/SalesOrderListPage', () => ({
  SalesOrderListPage: ({ mode }: { mode?: string }) => <div>{`SalesOrderListPage:${mode ?? 'standard'}`}</div>,
}))

vi.mock('@/pages/sales-orders/StockOutStatusPage', () => ({
  StockOutStatusPage: () => <div>StockOutStatusPage</div>,
}))

vi.mock('@/pages/sales-orders/PendingStatusPage', () => ({
  PendingStatusPage: () => <div>PendingStatusPage</div>,
}))

vi.mock('@/pages/sales-orders/DeliveryReturnPage', () => ({
  DeliveryReturnPage: () => <div>DeliveryReturnPage</div>,
}))

vi.mock('@/pages/sales-orders/PackingPrintPage', () => ({
  PackingPrintPage: () => <div>PackingPrintPage</div>,
}))

import { AppRouter } from '@/router/AppRouter'

function getAllowedPathCalls(): string[][] {
  return protectedRouteSpy.mock.calls
    .map(([props]) => (props as { allowedPaths?: string[] }).allowedPaths)
    .filter((value): value is string[] => Array.isArray(value))
}

function renderRoute(path: string) {
  window.history.pushState({}, '', path)
  render(<AppRouter />)
}

describe('AppRouter stock-out protection', () => {
  beforeEach(() => {
    protectedRouteSpy.mockClear()
  })

  afterEach(() => {
    cleanup()
    window.history.pushState({}, '', '/')
  })

  it('protects the standard create route with standard stock-out menu paths', async () => {
    renderRoute('/sales-orders/create')

    expect(await screen.findByText('CreateSalesOrderPage')).toBeTruthy()
    expect(getAllowedPathCalls()).toContainEqual(['/sales-orders', '/salesorderinternal'])
  })

  it('protects the admin general list with admin-general menu paths', async () => {
    renderRoute('/sales-orders/admin/general')

    expect(await screen.findByText('SalesOrderListPage:admin-general')).toBeTruthy()
    expect(getAllowedPathCalls()).toContainEqual(['/sales-orders/admin/general', '/salesorderinternal/general'])
  })

  it('protects the escalation list with escalation menu paths', async () => {
    renderRoute('/sales-orders/escalations')

    expect(await screen.findByText('SalesOrderListPage:escalation')).toBeTruthy()
    expect(getAllowedPathCalls()).toContainEqual([
      '/sales-orders/escalations',
      '/salesorderinternal/escalationlist',
      '/sales-orders',
      '/salesorderinternal',
    ])
  })

  it('protects the packaging page with packaging menu paths', async () => {
    renderRoute('/sales-orders/123/package')

    expect(await screen.findByText('PackageSalesOrderPage')).toBeTruthy()
    expect(getAllowedPathCalls()).toContainEqual(['/sales-orders/packages', '/salesorderinternal/packagelist'])
  })

  it('protects the packing print hub with package-done menu paths', async () => {
    renderRoute('/sales-orders/packing-print')

    expect(await screen.findByText('PackingPrintPage')).toBeTruthy()
    expect(getAllowedPathCalls()).toContainEqual([
      '/sales-orders/packages/done',
      '/salesorderinternal/packagelist/done',
      '/sales-orders/packing-print',
      '/packingessential/packingrelatedprint',
    ])
  })

  it('keeps the legacy stock-out status route mapped to the protected V2 status page', async () => {
    renderRoute('/stockout/status')

    expect(await screen.findByText('StockOutStatusPage')).toBeTruthy()
    expect(getAllowedPathCalls()).toContainEqual(['/sales-orders/status', '/stockout/status'])
  })

  it('protects the pending-price admin edit route with pending-price menu paths', async () => {
    renderRoute('/sales-orders/admin/123/price-edit')

    expect(await screen.findByText('EditSalesOrderPage:admin-price-edit')).toBeTruthy()
    expect(getAllowedPathCalls()).toContainEqual([
      '/sales-orders/admin/pending-price',
      '/salesorderinternal/pendingprice',
    ])
  })

  it('protects the invoice-limited edit route with limited-edit menu paths', async () => {
    renderRoute('/sales-orders/admin/123/invoice-edit')

    expect(await screen.findByText('EditSalesOrderPage:admin-invoice-limited')).toBeTruthy()
    expect(getAllowedPathCalls()).toContainEqual(['/sales-orders/admin/limited-edit', '/salesorder/limitededit'])
  })

  it('protects the pending status page with pending-operation menu paths', async () => {
    renderRoute('/sales-orders/pending')

    expect(await screen.findByText('PendingStatusPage')).toBeTruthy()
    expect(getAllowedPathCalls()).toContainEqual(['/sales-orders/pending', '/stockout/update'])
  })

  it('protects the delivery return page with delivery-return menu paths', async () => {
    renderRoute('/sales-orders/delivery-return')

    expect(await screen.findByText('DeliveryReturnPage')).toBeTruthy()
    expect(getAllowedPathCalls()).toContainEqual([
      '/sales-orders/delivery-return',
      '/salesoperation/stockoutstockrevert',
    ])
  })
})