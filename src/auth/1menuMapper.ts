import type { AppMenuItem, LegacyMenuItem } from '@/types/auth'

/**
 * Maps legacy route paths (from API / JWT menus) to v2 equivalents.
 * Only paths that exist in the v2 app are listed here.
 * Any legacy path NOT in this map is passed through as-is (dynamic menus
 * will render a link but the route won't match yet — harmless until migrated).
 */
const legacyToV2: Record<string, string> = {
  '/dashboard': '/dashboard',
  '/customers': '/customers',
  '/addcustomer': '/customers/add',
  '/assignemployeetocustomers': '/customers/assign-employees',
  '/inhouseemployees': '/employees',
  '/cheque/list': '/cheques',
  '/cheque/create': '/cheques/add',
  '/payment/list': '/payments',
  '/payment/create': '/payments/add',
  '/suppliers': '/suppliers',
  '/addsupplier': '/suppliers/add',
  '/salesorderinternal': '/sales-orders',
  '/salesorderinternal/create': '/sales-orders/create',
  '/salesorderinternal/escalationlist': '/sales-orders/escalations',
  '/salesorderinternal/general': '/sales-orders/admin/general',
  '/salesorderinternal/pendingprice': '/sales-orders/admin/pending-price',
  '/salesorderinternal/packagelist': '/sales-orders/packages',
  '/salesorderinternal/packagelist/done': '/sales-orders/packages/done',
  '/salesorder/limitededit': '/sales-orders/admin/limited-edit',
  '/stockout/status': '/sales-orders/status',
  '/stockout/update': '/sales-orders/pending',
  '/salesoperation/stockoutstockrevert': '/sales-orders/delivery-return',
  '/packingessential/packingrelatedprint': '/packing/print-panel',
  '/locationlist': '/locations',
  '/location/add': '/locations/add',
  '/products': '/products',
  '/addproduct': '/products/add',
  '/mappingproduct': '/products/mapping',
  '/products/sample/update': '/products/samples',
  '/productfunctionlist': '/products/functions',
  '/function/add': '/products/functions/add',
  '/report/payment': '/reports/payment',
  '/report/sales': '/reports/sales',
  '/report/delivery-conveyance': '/reports/delivery-conveyance',
  '/report/mapped': '/reports/mapping',
  '/report/packedbyreport': '/reports/repacking-packed-by',
  '/report/productout': '/reports/product-out',
  '/manageroleandmenu': '/admin/roles',
  // Stock-In
  '/stockin': '/stock-in',
  '/stockinlist': '/stock-in',
  '/stockin/list': '/stock-in',
  '/stockin/create': '/stock-in/create',
  '/stockin/unapprovedqty/list': '/stock-in/confirm-qty',
  '/stockin/stockadjustment': '/stock-in/adjustment',
  '/stockin/priceupdatelist': '/stock-in/price-update',
  '/stockinadminaction': '/stock-in/admin/approved',
  '/stockin/stockinadminaction': '/stock-in/admin/approved',
  '/stockin/stockininvoicelist': '/stock-in/invoices',
  '/stockin/invoicereport': '/stock-in/invoice-report',
  // Stock-In Reports
  '/report/currentstock': '/reports/current-stock',
  '/report/productin': '/reports/product-in',
  '/report/stockin/stockadjustmentreport': '/reports/stock-adjustment',
  '/report/getstockbyproduct': '/reports/stock-by-product',
  '/report/productinsummaryreport': '/reports/stockin-summary',
  '/report/productin-with-adjustment': '/reports/product-in-adjustment',
  // Selling Price
  '/price': '/selling-prices',
  '/addsellprice': '/selling-prices/add',
  // Purchase Price
  '/purchaseprices': '/purchase-prices',
  '/purchaseprice/add': '/purchase-prices/add',
  // Price Quotation
  '/quotation/list': '/quotations',
  '/quotation/unapprovedlist': '/quotations/unapproved',
  '/quotation/approvedlist': '/quotations/approved',
  '/quotation/create': '/quotations/create',
  // LC Tracking
  '/lctracking/pilists': '/lc/pi',
  '/lctracking/createpi': '/lc/pi/create',
  '/lctracking/listlcanddoc': '/lc/operations',
  '/lctracking/createlcdoc': '/lc/create',
  '/lctracking/documentactionlist': '/lc/documents',
  '/lctracking/lcpaymentlist': '/lc/payments',
  '/lctracking/lcpaymentcompletedlist': '/lc/payments/completed',
  '/lctracking/lctrackingreport': '/lc/status',
  '/lc-payments/list': '/lc/payment/edit-list',
  '/lc/list': '/lc/edit-list',
}

export function mapLegacyPathToV2Path(url?: string): string | undefined {
  if (!url) return undefined
  const raw = url.startsWith('/') ? url : `/${url}`
  return legacyToV2[raw] ?? raw
}

function isVisible(menu: LegacyMenuItem): boolean {
  return menu.MenuIsVisible !== false
}

export function mapLegacyMenuToAppMenu(items: LegacyMenuItem[]): AppMenuItem[] {
  return items
    .filter(isVisible)
    .map((item) => ({
      id: String(item.MenuId),
      label: item.MenuName,
      path: mapLegacyPathToV2Path(item.MenuURL),
      children: item.ChildMenus?.filter(isVisible).map((child) => ({
        id: String(child.MenuId),
        label: child.MenuName,
        path: mapLegacyPathToV2Path(child.MenuURL),
      })),
    }))
}
