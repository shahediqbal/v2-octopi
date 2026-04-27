import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { AppShell } from '@/layout/AppShell'
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const SigninPage = lazy(() => import('@/pages/SigninPage').then((m) => ({ default: m.SigninPage })))
const DeliveryReportPage = lazy(() => import('@/pages/reports/DeliveryReportPage').then((m) => ({ default: m.DeliveryReportPage })))
const MappingReportPage = lazy(() => import('@/pages/reports/MappingReportPage').then((m) => ({ default: m.MappingReportPage })))
const PaymentReportPage = lazy(() => import('@/pages/reports/PaymentReportPage').then((m) => ({ default: m.PaymentReportPage })))
const RepackingPackedByReportPage = lazy(() => import('@/pages/reports/RepackingPackedByReportPage').then((m) => ({ default: m.RepackingPackedByReportPage })))
const SalesReportPage = lazy(() => import('@/pages/reports/SalesReportPage').then((m) => ({ default: m.SalesReportPage })))
const CustomerListPage = lazy(() => import('@/pages/customers/CustomerListPage').then((m) => ({ default: m.CustomerListPage })))
const AddCustomerPage = lazy(() => import('@/pages/customers/AddCustomerPage').then((m) => ({ default: m.AddCustomerPage })))
const EditCustomerPage = lazy(() => import('@/pages/customers/EditCustomerPage').then((m) => ({ default: m.EditCustomerPage })))
const AssignCustomersToEmployeePage = lazy(() => import('@/pages/customers/AssignCustomersToEmployeePage').then((m) => ({ default: m.AssignCustomersToEmployeePage })))
const CustomerFlagUpdatePage = lazy(() => import('@/pages/customers/CustomerFlagUpdatePage').then((m) => ({ default: m.CustomerFlagUpdatePage })))
const EmployeeListPage = lazy(() => import('@/pages/employees/EmployeeListPage').then((m) => ({ default: m.EmployeeListPage })))
const AddChequePage = lazy(() => import('@/pages/cheques/AddChequePage').then((m) => ({ default: m.AddChequePage })))
const ChequeListPage = lazy(() => import('@/pages/cheques/ChequeListPage').then((m) => ({ default: m.ChequeListPage })))
const EditChequePage = lazy(() => import('@/pages/cheques/EditChequePage').then((m) => ({ default: m.EditChequePage })))
const EditChequeStatusPage = lazy(() => import('@/pages/cheques/EditChequeStatusPage').then((m) => ({ default: m.EditChequeStatusPage })))
const SupplierListPage = lazy(() => import('@/pages/suppliers/SupplierListPage').then((m) => ({ default: m.SupplierListPage })))
const AddSupplierPage = lazy(() => import('@/pages/suppliers/AddSupplierPage').then((m) => ({ default: m.AddSupplierPage })))
const EditSupplierPage = lazy(() => import('@/pages/suppliers/EditSupplierPage').then((m) => ({ default: m.EditSupplierPage })))
const CreateSalesOrderPage = lazy(() => import('@/pages/sales-orders/CreateSalesOrderPage').then((m) => ({ default: m.CreateSalesOrderPage })))
const EditSalesOrderPage = lazy(() => import('@/pages/sales-orders/EditSalesOrderPage').then((m) => ({ default: m.EditSalesOrderPage })))
const SalesOrderListPage = lazy(() => import('@/pages/sales-orders/SalesOrderListPage').then((m) => ({ default: m.SalesOrderListPage })))
const PackageSalesOrderPage = lazy(() => import('@/pages/sales-orders/PackageSalesOrderPage').then((m) => ({ default: m.PackageSalesOrderPage })))
const ReviewCockpitPage = lazy(() => import('@/pages/sales-orders/ReviewCockpitPage').then((m) => ({ default: m.ReviewCockpitPage })))
const EscalateOrderPage = lazy(() => import('@/pages/sales-orders/EscalateOrderPage').then((m) => ({ default: m.EscalateOrderPage })))
const StockOutStatusPage = lazy(() => import('@/pages/sales-orders/StockOutStatusPage').then((m) => ({ default: m.StockOutStatusPage })))
const PendingStatusPage = lazy(() => import('@/pages/sales-orders/PendingStatusPage').then((m) => ({ default: m.PendingStatusPage })))
const DeliveryReturnPage = lazy(() => import('@/pages/sales-orders/DeliveryReturnPage').then((m) => ({ default: m.DeliveryReturnPage })))
const PackingPrintPage = lazy(() => import('@/pages/sales-orders/PackingPrintPage').then((m) => ({ default: m.PackingPrintPage })))
const LocationListPage = lazy(() => import('@/pages/locations/LocationListPage').then((m) => ({ default: m.LocationListPage })))
const AddLocationPage = lazy(() => import('@/pages/locations/AddLocationPage').then((m) => ({ default: m.AddLocationPage })))
const EditLocationPage = lazy(() => import('@/pages/locations/EditLocationPage').then((m) => ({ default: m.EditLocationPage })))
const AddProductPage = lazy(() => import('@/pages/products/AddProductPage').then((m) => ({ default: m.AddProductPage })))
const EditProductPage = lazy(() => import('@/pages/products/EditProductPage').then((m) => ({ default: m.EditProductPage })))
const ProductListPage = lazy(() => import('@/pages/products/ProductListPage').then((m) => ({ default: m.ProductListPage })))
const ProductMappingPage = lazy(() => import('@/pages/products/ProductMappingPage').then((m) => ({ default: m.ProductMappingPage })))
const ProductSampleUpdatePage = lazy(() => import('@/pages/products/ProductSampleUpdatePage').then((m) => ({ default: m.ProductSampleUpdatePage })))
const ProductFunctionListPage = lazy(() => import('@/pages/products/ProductFunctionListPage').then((m) => ({ default: m.ProductFunctionListPage })))
const AddProductFunctionPage = lazy(() => import('@/pages/products/AddProductFunctionPage').then((m) => ({ default: m.AddProductFunctionPage })))
const EditProductFunctionPage = lazy(() => import('@/pages/products/EditProductFunctionPage').then((m) => ({ default: m.EditProductFunctionPage })))
const ManageRoleAndMenuPage = lazy(() => import('@/pages/admin/ManageRoleAndMenuPage').then((m) => ({ default: m.ManageRoleAndMenuPage })))
const SignupPage = lazy(() => import('@/pages/users/SignupPage').then((m) => ({ default: m.SignupPage })))
const UserRolesPage = lazy(() => import('@/pages/users/UserRolesPage').then((m) => ({ default: m.UserRolesPage })))
const ProductOutReportPage = lazy(() => import('@/pages/reports/ProductOutReportPage').then((m) => ({ default: m.ProductOutReportPage })))
const TaskAssignListPage = lazy(() => import('@/pages/sales-orders/TaskAssignListPage').then((m) => ({ default: m.TaskAssignListPage })))
const AssignTaskPage = lazy(() => import('@/pages/sales-orders/AssignTaskPage').then((m) => ({ default: m.AssignTaskPage })))
const AssignedTaskListPage = lazy(() => import('@/pages/sales-orders/AssignedTaskListPage').then((m) => ({ default: m.AssignedTaskListPage })))
const EditTaskPage = lazy(() => import('@/pages/sales-orders/EditTaskPage').then((m) => ({ default: m.EditTaskPage })))
const IncompleteTaskListPage = lazy(() => import('@/pages/sales-orders/IncompleteTaskListPage').then((m) => ({ default: m.IncompleteTaskListPage })))
const AddTaskPage = lazy(() => import('@/pages/sales-orders/AddTaskPage').then((m) => ({ default: m.AddTaskPage })))
const PendingChecklistListPage = lazy(() => import('@/pages/sales-orders/PendingChecklistListPage').then((m) => ({ default: m.PendingChecklistListPage })))
const EditPendingChecklistPage = lazy(() => import('@/pages/sales-orders/EditPendingChecklistPage').then((m) => ({ default: m.EditPendingChecklistPage })))
const DeliveryPage = lazy(() => import('@/pages/sales-orders/DeliveryPage').then((m) => ({ default: m.DeliveryPage })))
const StockInListPage = lazy(() => import('@/pages/stock-in/StockInListPage').then((m) => ({ default: m.StockInListPage })))
const AddStockInPage = lazy(() => import('@/pages/stock-in/AddStockInPage').then((m) => ({ default: m.AddStockInPage })))
const EditStockInPage = lazy(() => import('@/pages/stock-in/EditStockInPage').then((m) => ({ default: m.EditStockInPage })))
const ConfirmQuantityPage = lazy(() => import('@/pages/stock-in/ConfirmQuantityPage').then((m) => ({ default: m.ConfirmQuantityPage })))
const StockAdjustmentPage = lazy(() => import('@/pages/stock-in/StockAdjustmentPage').then((m) => ({ default: m.StockAdjustmentPage })))
const StockInInvoiceListPage = lazy(() => import('@/pages/stock-in/StockInInvoiceListPage').then((m) => ({ default: m.StockInInvoiceListPage })))
const StockInInvoiceReportPage = lazy(() => import('@/pages/stock-in/StockInInvoiceReportPage').then((m) => ({ default: m.StockInInvoiceReportPage })))
const PaymentListPage = lazy(() => import('@/pages/payments/PaymentListPage').then((m) => ({ default: m.PaymentListPage })))
const AddPaymentPage = lazy(() => import('@/pages/payments/AddPaymentPage').then((m) => ({ default: m.AddPaymentPage })))
const EditPaymentPage = lazy(() => import('@/pages/payments/EditPaymentPage').then((m) => ({ default: m.EditPaymentPage })))
// ── Selling Price ──
const SellingPriceListPage = lazy(() => import('@/pages/prices/SellingPriceListPage').then((m) => ({ default: m.SellingPriceListPage })))
const AddSellingPricePage = lazy(() => import('@/pages/prices/AddSellingPricePage').then((m) => ({ default: m.AddSellingPricePage })))
const EditSellingPricePage = lazy(() => import('@/pages/prices/EditSellingPricePage').then((m) => ({ default: m.EditSellingPricePage })))
// ── Purchase Price ──
const PurchasePriceListPage = lazy(() => import('@/pages/prices/PurchasePriceListPage').then((m) => ({ default: m.PurchasePriceListPage })))
const AddPurchasePricePage = lazy(() => import('@/pages/prices/AddPurchasePricePage').then((m) => ({ default: m.AddPurchasePricePage })))
const EditPurchasePricePage = lazy(() => import('@/pages/prices/EditPurchasePricePage').then((m) => ({ default: m.EditPurchasePricePage })))
// ── Price Quotation ──
const QuotationListPage = lazy(() => import('@/pages/quotations/QuotationListPage').then((m) => ({ default: m.QuotationListPage })))
const CreateQuotationPage = lazy(() => import('@/pages/quotations/CreateQuotationPage').then((m) => ({ default: m.CreateQuotationPage })))
const EditQuotationPage = lazy(() => import('@/pages/quotations/EditQuotationPage').then((m) => ({ default: m.EditQuotationPage })))
const ApproveQuotationPage = lazy(() => import('@/pages/quotations/ApproveQuotationPage').then((m) => ({ default: m.ApproveQuotationPage })))
// ── LC Tracking ──
const PiListPage = lazy(() => import('@/pages/lc/PiListPage').then((m) => ({ default: m.PiListPage })))
const CreatePiPage = lazy(() => import('@/pages/lc/CreatePiPage').then((m) => ({ default: m.CreatePiPage })))
const EditPiPage = lazy(() => import('@/pages/lc/EditPiPage').then((m) => ({ default: m.EditPiPage })))
const LcOperationsPage = lazy(() => import('@/pages/lc/LcOperationsPage').then((m) => ({ default: m.LcOperationsPage })))
const CreateLcPage = lazy(() => import('@/pages/lc/CreateLcPage').then((m) => ({ default: m.CreateLcPage })))
const LcDocumentListPage = lazy(() => import('@/pages/lc/LcDocumentListPage').then((m) => ({ default: m.LcDocumentListPage })))
const UpdateLcDocPage = lazy(() => import('@/pages/lc/UpdateLcDocPage').then((m) => ({ default: m.UpdateLcDocPage })))
const LcEditListPage = lazy(() => import('@/pages/lc/LcEditListPage').then((m) => ({ default: m.LcEditListPage })))
const LcLimitedUpdatePage = lazy(() => import('@/pages/lc/LcLimitedUpdatePage').then((m) => ({ default: m.LcLimitedUpdatePage })))
const LcPaymentOperationsPage = lazy(() => import('@/pages/lc/LcPaymentOperationsPage').then((m) => ({ default: m.LcPaymentOperationsPage })))
const LcPaymentEntryPage = lazy(() => import('@/pages/lc/LcPaymentEntryPage').then((m) => ({ default: m.LcPaymentEntryPage })))
const LcPaymentEditListPage = lazy(() => import('@/pages/lc/LcPaymentEditListPage').then((m) => ({ default: m.LcPaymentEditListPage })))
const LcPaymentEditPage = lazy(() => import('@/pages/lc/LcPaymentEditPage').then((m) => ({ default: m.LcPaymentEditPage })))
const LcStatusReportPage = lazy(() => import('@/pages/lc/LcStatusReportPage').then((m) => ({ default: m.LcStatusReportPage })))
// ── Sticker Packing ──
const StickerOrderListPage = lazy(() => import('@/pages/sticker-packing/StickerOrderListPage').then((m) => ({ default: m.StickerOrderListPage })))
const DefinePackingPage = lazy(() => import('@/pages/sticker-packing/DefinePackingPage').then((m) => ({ default: m.DefinePackingPage })))
const EditPackingPage = lazy(() => import('@/pages/sticker-packing/EditPackingPage').then((m) => ({ default: m.EditPackingPage })))
const PrintPanelPage = lazy(() => import('@/pages/sticker-packing/PrintPanelPage').then((m) => ({ default: m.PrintPanelPage })))
// ── Batches ──
const BatchListPage = lazy(() => import('@/pages/batches/BatchListPage').then((m) => ({ default: m.BatchListPage })))
// ── Tax & Duty ──
const TaxDutyListPage = lazy(() => import('@/pages/tax-duty/TaxDutyListPage').then((m) => ({ default: m.TaxDutyListPage })))
const AddTaxDutyPage = lazy(() => import('@/pages/tax-duty/AddTaxDutyPage').then((m) => ({ default: m.AddTaxDutyPage })))
const EditTaxDutyPage = lazy(() => import('@/pages/tax-duty/EditTaxDutyPage').then((m) => ({ default: m.EditTaxDutyPage })))
// ── Phase 1 Reports ──
const StockOutSalesReturnReportPage = lazy(() => import('@/pages/reports/StockOutSalesReturnReportPage').then((m) => ({ default: m.StockOutSalesReturnReportPage })))
const ProductLoanReportPage = lazy(() => import('@/pages/reports/ProductLoanReportPage').then((m) => ({ default: m.ProductLoanReportPage })))
const LoanReportPage = lazy(() => import('@/pages/reports/LoanReportPage').then((m) => ({ default: m.LoanReportPage })))
const MonthlyCreditReportPage = lazy(() => import('@/pages/reports/MonthlyCreditReportPage').then((m) => ({ default: m.MonthlyCreditReportPage })))
const ReconcileAuditReportPage = lazy(() => import('@/pages/reports/ReconcileAuditReportPage').then((m) => ({ default: m.ReconcileAuditReportPage })))
// ── Phase 2 Reports ──
const DeliveryConveyanceReportPage = lazy(() => import('@/pages/reports/DeliveryConveyanceReportPage').then((m) => ({ default: m.DeliveryConveyanceReportPage })))
const StockOutBatchReportPage = lazy(() => import('@/pages/reports/StockOutBatchReportPage').then((m) => ({ default: m.StockOutBatchReportPage })))
const StockInBatchReportPage = lazy(() => import('@/pages/reports/StockInBatchReportPage').then((m) => ({ default: m.StockInBatchReportPage })))
const PurchasePriceHistoryPage = lazy(() => import('@/pages/reports/PurchasePriceHistoryPage').then((m) => ({ default: m.PurchasePriceHistoryPage })))
const TaxAitDetailsReportPage = lazy(() => import('@/pages/reports/TaxAitDetailsReportPage').then((m) => ({ default: m.TaxAitDetailsReportPage })))
const TaxAitSummaryReportPage = lazy(() => import('@/pages/reports/TaxAitSummaryReportPage').then((m) => ({ default: m.TaxAitSummaryReportPage })))
const EmployeeTaskReportPage = lazy(() => import('@/pages/reports/EmployeeTaskReportPage').then((m) => ({ default: m.EmployeeTaskReportPage })))
// ── Phase 3 Reports ──
const PendingCancelReportPage = lazy(() => import('@/pages/reports/PendingCancelReportPage').then((m) => ({ default: m.PendingCancelReportPage })))
// ── Phase 5 Stock-In Reports ──
const CurrentStockReportPage = lazy(() => import('@/pages/reports/CurrentStockReportPage').then((m) => ({ default: m.CurrentStockReportPage })))
const ProductInReportPage = lazy(() => import('@/pages/reports/ProductInReportPage').then((m) => ({ default: m.ProductInReportPage })))
const StockAdjustmentReportPage = lazy(() => import('@/pages/reports/StockAdjustmentReportPage').then((m) => ({ default: m.StockAdjustmentReportPage })))
const StockByProductReportPage = lazy(() => import('@/pages/reports/StockByProductReportPage').then((m) => ({ default: m.StockByProductReportPage })))
const StockInSummaryReportPage = lazy(() => import('@/pages/reports/StockInSummaryReportPage').then((m) => ({ default: m.StockInSummaryReportPage })))
const ProductInWithAdjustmentPage = lazy(() => import('@/pages/reports/ProductInWithAdjustmentPage').then((m) => ({ default: m.ProductInWithAdjustmentPage })))
const DailyInvoiceTrackingPage = lazy(() => import('@/pages/reports/DailyInvoiceTrackingPage').then((m) => ({ default: m.DailyInvoiceTrackingPage })))
const AllowanceCheckingPage = lazy(() => import('@/pages/reports/AllowanceCheckingPage').then((m) => ({ default: m.AllowanceCheckingPage })))
// ── Phase 4 Reports & Pages ──
const CustomerCreditReportPage = lazy(() => import('@/pages/reports/CustomerCreditReportPage').then((m) => ({ default: m.CustomerCreditReportPage })))
const SalesPaymentDashboardPage = lazy(() => import('@/pages/reports/SalesPaymentDashboardPage').then((m) => ({ default: m.SalesPaymentDashboardPage })))
const CustomerLookupPage = lazy(() => import('@/pages/customers/CustomerLookupPage').then((m) => ({ default: m.CustomerLookupPage })))
const PackingPrintPanelPage = lazy(() => import('@/pages/packing/PackingPrintPanelPage').then((m) => ({ default: m.PackingPrintPanelPage })))

function RouteFallback() {
  return (
    <div className="flex min-h-[320px] items-center justify-center py-16">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
        Loading page…
      </div>
    </div>
  )
}

const standardStockOutPaths = ['/sales-orders', '/salesorderinternal']
const escalationStockOutPaths = ['/sales-orders/escalations', '/salesorderinternal/escalationlist', ...standardStockOutPaths]
const packagingStockOutPaths = ['/sales-orders/packages', '/salesorderinternal/packagelist']
const packageDoneStockOutPaths = ['/sales-orders/packages/done', '/salesorderinternal/packagelist/done', '/sales-orders/packing-print', '/packingessential/packingrelatedprint']
const adminGeneralStockOutPaths = ['/sales-orders/admin/general', '/salesorderinternal/general']
const adminPendingPriceStockOutPaths = ['/sales-orders/admin/pending-price', '/salesorderinternal/pendingprice']
const adminLimitedStockOutPaths = ['/sales-orders/admin/limited-edit', '/salesorder/limitededit']
const statusStockOutPaths = ['/sales-orders/status', '/stockout/status']
const pendingStockOutPaths = ['/sales-orders/pending', '/stockout/update']
const deliveryReturnPaths = ['/sales-orders/delivery-return', '/salesoperation/stockoutstockrevert']
const stockInPaths = ['/stock-in', '/stockin/list', '/stockin']
const stockInConfirmQtyPaths = ['/stock-in/confirm-qty', '/stockin/unapprovedqty/list', ...stockInPaths]
const stockInPriceUpdatePaths = ['/stock-in/price-update', '/stockin/priceupdatelist']
const stockInAdminPaths = ['/stock-in/admin/approved', '/stockinadminaction']
const stockInAdjustmentPaths = ['/stock-in/adjustment', '/stockin/stockadjustment']
const stockInInvoicePaths = ['/stock-in/invoices', '/stockin/stockininvoicelist']
const stockInInvoiceReportPaths = ['/stock-in/invoice-report', '/stockin/invoicereport']
const sellingPricePaths = ['/selling-prices', '/price', '/addsellprice']
const purchasePricePaths = ['/purchase-prices', '/purchaseprices']
const lcOperationsPaths = ['/lc/operations', '/lctracking/listlcanddoc']
const lcDocPaths = ['/lc/documents', '/lctracking/documentactionlist']

function protect(element: React.ReactNode, allowedPaths: string[]) {
  return <ProtectedRoute allowedPaths={allowedPaths}>{element}</ProtectedRoute>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/signin" element={<SigninPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="reports/sales" element={<SalesReportPage />} />
              <Route path="reports/delivery" element={<DeliveryReportPage />} />
              <Route path="reports/mapping" element={<MappingReportPage />} />
              <Route path="reports/payment" element={<PaymentReportPage />} />
              <Route path="reports/repacking-packed-by" element={<RepackingPackedByReportPage />} />
              <Route path="customers" element={<CustomerListPage />} />
              <Route path="customers/add" element={<AddCustomerPage />} />
              <Route path="customers/:id/edit" element={<EditCustomerPage />} />
              <Route path="customers/assign-employees" element={<AssignCustomersToEmployeePage />} />
              <Route path="customers/flag-update" element={<CustomerFlagUpdatePage />} />
              <Route path="employees" element={<EmployeeListPage />} />
              <Route path="cheques" element={<ChequeListPage />} />
              <Route path="cheques/add" element={<AddChequePage />} />
              <Route path="cheques/:id/edit" element={<EditChequePage />} />
              <Route path="cheques/:id/status" element={<EditChequeStatusPage />} />
              <Route path="payments" element={<PaymentListPage />} />
              <Route path="payments/add" element={<AddPaymentPage />} />
              <Route path="payments/:id/edit" element={<EditPaymentPage />} />
              <Route path="suppliers" element={<SupplierListPage />} />
              <Route path="suppliers/add" element={<AddSupplierPage />} />
              <Route path="suppliers/:id/edit" element={<EditSupplierPage />} />
              <Route path="sales-orders" element={protect(<SalesOrderListPage />, standardStockOutPaths)} />
              <Route path="sales-orders/create" element={protect(<CreateSalesOrderPage />, standardStockOutPaths)} />
              <Route path="sales-orders/:id/edit" element={protect(<EditSalesOrderPage />, standardStockOutPaths)} />
              <Route path="sales-orders/:id/review" element={protect(<ReviewCockpitPage />, standardStockOutPaths)} />
              <Route path="sales-orders/escalations" element={protect(<SalesOrderListPage mode="escalation" />, escalationStockOutPaths)} />
              <Route path="sales-orders/:id/escalate" element={protect(<EscalateOrderPage />, escalationStockOutPaths)} />
              <Route path="sales-orders/:id/package" element={protect(<PackageSalesOrderPage />, packagingStockOutPaths)} />
              <Route path="sales-orders/packages" element={protect(<SalesOrderListPage mode="packaging" />, packagingStockOutPaths)} />
              <Route path="sales-orders/packages/done" element={protect(<SalesOrderListPage mode="package-done" />, packageDoneStockOutPaths)} />
              <Route path="sales-orders/packages/done/:id/edit" element={protect(<EditSalesOrderPage mode="packing-edit" />, packageDoneStockOutPaths)} />
              <Route path="sales-orders/admin/general" element={protect(<SalesOrderListPage mode="admin-general" />, adminGeneralStockOutPaths)} />
              <Route path="sales-orders/admin/pending-price" element={protect(<SalesOrderListPage mode="admin-pending-price" />, adminPendingPriceStockOutPaths)} />
              <Route path="sales-orders/admin/limited-edit" element={protect(<SalesOrderListPage mode="admin-limited-edit" />, adminLimitedStockOutPaths)} />
              <Route path="sales-orders/admin/:id/edit" element={protect(<EditSalesOrderPage mode="admin-full" />, adminGeneralStockOutPaths)} />
              <Route path="sales-orders/admin/:id/price-edit" element={protect(<EditSalesOrderPage mode="admin-price-edit" />, adminPendingPriceStockOutPaths)} />
              <Route path="sales-orders/admin/:id/invoice-edit" element={protect(<EditSalesOrderPage mode="admin-invoice-limited" />, adminLimitedStockOutPaths)} />
              <Route path="sales-orders/admin/packages/done/:id/edit" element={protect(<EditSalesOrderPage mode="admin-packing-edit" />, adminGeneralStockOutPaths)} />
              <Route path="sales-orders/status" element={protect(<StockOutStatusPage />, statusStockOutPaths)} />
              <Route path="sales-orders/pending" element={protect(<PendingStatusPage />, pendingStockOutPaths)} />
              <Route path="sales-orders/delivery-return" element={protect(<DeliveryReturnPage />, deliveryReturnPaths)} />
              <Route path="sales-orders/packing-print" element={protect(<PackingPrintPage />, packageDoneStockOutPaths)} />
              <Route path="sales-orders/task-assign" element={<TaskAssignListPage />} />
              <Route path="sales-orders/:id/assign-task" element={<AssignTaskPage />} />
              <Route path="sales-orders/task-assigned" element={<AssignedTaskListPage />} />
              <Route path="sales-orders/tasks/:id/edit" element={<EditTaskPage />} />
              <Route path="sales-orders/task-incomplete" element={<IncompleteTaskListPage />} />
              <Route path="sales-orders/tasks/new" element={<AddTaskPage />} />
              <Route path="sales-orders/pending-checklist" element={<PendingChecklistListPage />} />
              <Route path="sales-orders/pending-checklist/:id/edit" element={<EditPendingChecklistPage />} />
              <Route path="sales-orders/delivery" element={<DeliveryPage />} />

              {/* ── Stock-In ── */}
              <Route path="stock-in" element={protect(<StockInListPage />, stockInPaths)} />
              <Route path="stock-in/create" element={protect(<AddStockInPage />, stockInPaths)} />
              <Route path="stock-in/:id/edit" element={protect(<EditStockInPage />, stockInPaths)} />
              <Route path="stock-in/confirm-qty" element={protect(<StockInListPage mode="confirm-qty" />, stockInConfirmQtyPaths)} />
              <Route path="stock-in/:id/confirm-qty" element={protect(<ConfirmQuantityPage />, stockInConfirmQtyPaths)} />
              <Route path="stock-in/price-update" element={protect(<StockInListPage mode="price-update" />, stockInPriceUpdatePaths)} />
              <Route path="stock-in/:id/price-edit" element={protect(<EditStockInPage mode="price-edit" />, stockInPriceUpdatePaths)} />
              <Route path="stock-in/admin/approved" element={protect(<StockInListPage mode="admin-approved" />, stockInAdminPaths)} />
              <Route path="stock-in/admin/:id/revert" element={protect(<EditStockInPage mode="admin-revert" />, stockInAdminPaths)} />
              <Route path="stock-in/adjustment" element={protect(<StockAdjustmentPage />, stockInAdjustmentPaths)} />
              <Route path="stock-in/invoices" element={protect(<StockInInvoiceListPage />, stockInInvoicePaths)} />
              <Route path="stock-in/invoice-report" element={protect(<StockInInvoiceReportPage />, stockInInvoiceReportPaths)} />

              <Route path="locations" element={<LocationListPage />} />
              <Route path="locations/add" element={<AddLocationPage />} />
              <Route path="locations/:id/edit" element={<EditLocationPage />} />
              <Route path="products" element={<ProductListPage />} />
              <Route path="products/add" element={<AddProductPage />} />
              <Route path="products/:id/edit" element={<EditProductPage />} />
              <Route path="products/mapping" element={<ProductMappingPage />} />
              <Route path="products/samples" element={<ProductSampleUpdatePage />} />
              <Route path="products/functions" element={<ProductFunctionListPage />} />
              <Route path="products/functions/add" element={<AddProductFunctionPage />} />
              <Route path="products/functions/:id/edit" element={<EditProductFunctionPage />} />
              <Route path="admin/roles" element={<ManageRoleAndMenuPage />} />
              <Route path="users/signup" element={<SignupPage />} />
              <Route path="users/roles" element={<UserRolesPage />} />
              <Route path="reports/product-out" element={<ProductOutReportPage />} />

              {/* ── Selling Prices ── */}
              <Route path="selling-prices" element={protect(<SellingPriceListPage />, sellingPricePaths)} />
              <Route path="selling-prices/add" element={protect(<AddSellingPricePage />, sellingPricePaths)} />
              <Route path="selling-prices/:id/edit" element={protect(<EditSellingPricePage />, sellingPricePaths)} />

              {/* ── Purchase Prices ── */}
              <Route path="purchase-prices" element={protect(<PurchasePriceListPage />, purchasePricePaths)} />
              <Route path="purchase-prices/add" element={protect(<AddPurchasePricePage />, purchasePricePaths)} />
              <Route path="purchase-prices/:id/edit" element={protect(<EditPurchasePricePage />, purchasePricePaths)} />

              {/* ── Price Quotations ── */}
              <Route path="quotations" element={<QuotationListPage />} />
              <Route path="quotations/unapproved" element={<QuotationListPage mode="unapproved" />} />
              <Route path="quotations/approved" element={<QuotationListPage mode="approved" />} />
              <Route path="quotations/create" element={<CreateQuotationPage />} />
              <Route path="quotations/:id/edit" element={<EditQuotationPage />} />
              <Route path="quotations/:id/approve" element={<ApproveQuotationPage />} />

              {/* ── LC Tracking — PI ── */}
              <Route path="lc/pi" element={<PiListPage />} />
              <Route path="lc/pi/create" element={<CreatePiPage />} />
              <Route path="lc/pi/:id/edit" element={<EditPiPage />} />

              {/* ── LC Tracking — Operations ── */}
              <Route path="lc/operations" element={protect(<LcOperationsPage />, lcOperationsPaths)} />
              <Route path="lc/create" element={protect(<CreateLcPage />, lcOperationsPaths)} />

              {/* ── LC Tracking — Documents ── */}
              <Route path="lc/documents" element={protect(<LcDocumentListPage />, lcDocPaths)} />
              <Route path="lc/:id/update" element={protect(<UpdateLcDocPage />, lcDocPaths)} />
              <Route path="lc/edit-list" element={<LcEditListPage />} />
              <Route path="lc/:id/limited-update" element={<LcLimitedUpdatePage />} />

              {/* ── LC Tracking — Payments ── */}
              <Route path="lc/payments" element={<LcPaymentOperationsPage />} />
              <Route path="lc/payment/new" element={<LcPaymentEntryPage />} />
              <Route path="lc/payment/edit-list" element={<LcPaymentEditListPage />} />
              <Route path="lc/payment/:id/edit" element={<LcPaymentEditPage />} />

              {/* ── LC Status Report ── */}
              <Route path="lc/status" element={<LcStatusReportPage />} />

              {/* ── Sticker Packing ── */}
              <Route path="sticker-packing/orders" element={<StickerOrderListPage />} />
              <Route path="sticker-packing/:id/define" element={<DefinePackingPage />} />
              <Route path="sticker-packing/:id/edit" element={<EditPackingPage />} />
              <Route path="sticker-packing/print-panel" element={<PrintPanelPage />} />

              {/* ── Batches ── */}
              <Route path="batches" element={<BatchListPage />} />

              {/* ── Tax & Duty ── */}
              <Route path="tax-duty" element={<TaxDutyListPage />} />
              <Route path="tax-duty/add" element={<AddTaxDutyPage />} />
              <Route path="tax-duty/:id/edit" element={<EditTaxDutyPage />} />

              {/* ── Phase 1 Reports ── */}
              <Route path="reports/stockout-salesreturn" element={<StockOutSalesReturnReportPage />} />
              <Route path="reports/product-loan" element={<ProductLoanReportPage />} />
              <Route path="reports/loan" element={<LoanReportPage />} />
              <Route path="reports/monthly-credit" element={<MonthlyCreditReportPage />} />
              <Route path="reports/reconcile-audit" element={<ReconcileAuditReportPage />} />

              {/* ── Phase 2 Reports ── */}
              <Route path="reports/delivery-conveyance" element={<DeliveryConveyanceReportPage />} />
              <Route path="reports/stockout-batch" element={<StockOutBatchReportPage />} />
              <Route path="reports/stockin-batch" element={<StockInBatchReportPage />} />
              <Route path="reports/purchase-price-history" element={<PurchasePriceHistoryPage />} />
              <Route path="reports/tax-ait-details" element={<TaxAitDetailsReportPage />} />
              <Route path="reports/tax-ait-summary" element={<TaxAitSummaryReportPage />} />
              <Route path="reports/employee-task" element={<EmployeeTaskReportPage />} />

              {/* ── Phase 3 Reports ── */}
              <Route path="reports/pending-cancel" element={<PendingCancelReportPage />} />
              <Route path="reports/daily-invoice-tracking" element={<DailyInvoiceTrackingPage />} />
              <Route path="reports/allowance-checking" element={<AllowanceCheckingPage />} />

              {/* ── Phase 4 Reports & Pages ── */}
              <Route path="reports/customer-credit" element={<CustomerCreditReportPage />} />
              <Route path="reports/sales-payment-dashboard" element={<SalesPaymentDashboardPage />} />
              <Route path="customers/lookup" element={<CustomerLookupPage />} />
              <Route path="packing/print-panel" element={<PackingPrintPanelPage />} />
              <Route path="sample-sticker/print-panel" element={<PrintPanelPage />} />

              {/* ── Phase 5 Stock-In Reports ── */}
              <Route path="reports/current-stock" element={<CurrentStockReportPage />} />
              <Route path="reports/product-in" element={<ProductInReportPage />} />
              <Route path="reports/stock-adjustment" element={<StockAdjustmentReportPage />} />
              <Route path="reports/stock-by-product" element={<StockByProductReportPage />} />
              <Route path="reports/stockin-summary" element={<StockInSummaryReportPage />} />
              <Route path="reports/product-in-adjustment" element={<ProductInWithAdjustmentPage />} />

              <Route path="report/mapped" element={<Navigate to="/reports/mapping" replace />} />
              <Route path="report/payment" element={<Navigate to="/reports/payment" replace />} />
              <Route path="report/sales" element={<Navigate to="/reports/sales" replace />} />
              <Route path="report/delivery" element={<Navigate to="/reports/delivery" replace />} />
              <Route path="report/delivery-conveyance" element={<Navigate to="/reports/delivery-conveyance" replace />} />
              <Route path="report/stockoutbatchreport" element={<Navigate to="/reports/stockout-batch" replace />} />
              <Route path="report/stockinbatchreport" element={<Navigate to="/reports/stockin-batch" replace />} />
              <Route path="report/purchasepricehistory" element={<Navigate to="/reports/purchase-price-history" replace />} />
              <Route path="report/taxaitdetailsreport" element={<Navigate to="/reports/tax-ait-details" replace />} />
              <Route path="report/taxaitsummarreport" element={<Navigate to="/reports/tax-ait-summary" replace />} />
              <Route path="report/employee-task" element={<Navigate to="/reports/employee-task" replace />} />
              <Route path="report/pending-and-cancel-report" element={<Navigate to="/reports/pending-cancel" replace />} />
              <Route path="report/daily-invoice-tracking" element={<Navigate to="/reports/daily-invoice-tracking" replace />} />
              <Route path="allowance/checking" element={<Navigate to="/reports/allowance-checking" replace />} />
              <Route path="report/customercreditreport" element={<Navigate to="/reports/customer-credit" replace />} />
              <Route path="report/salesnpayment" element={<Navigate to="/reports/sales-payment-dashboard" replace />} />
              <Route path="customers/customerlist" element={<Navigate to="/customers/lookup" replace />} />
              <Route path="packingessential/packingrelatedprint" element={<Navigate to="/packing/print-panel" replace />} />
              <Route path="sampleSticker/print" element={<Navigate to="/sample-sticker/print-panel" replace />} />
              <Route path="report/packedbyreport" element={<Navigate to="/reports/repacking-packed-by" replace />} />
              <Route path="report/productout" element={<Navigate to="/reports/product-out" replace />} />
              <Route path="report/productoutadmin" element={<Navigate to="/reports/product-out" replace />} />
              <Route path="cheque/list" element={<Navigate to="/cheques" replace />} />
              <Route path="cheque/create" element={<Navigate to="/cheques/add" replace />} />
              <Route path="cheque/:id/edit" element={<EditChequePage />} />
              <Route path="payment/list" element={<Navigate to="/payments" replace />} />
              <Route path="payment/create" element={<Navigate to="/payments/add" replace />} />
              <Route path="payment/:id/edit" element={<EditPaymentPage />} />
              <Route path="products/sample/update" element={<Navigate to="/products/samples" replace />} />
              <Route path="addproduct" element={<Navigate to="/products/add" replace />} />
              <Route path="product/:id/edit" element={<EditProductPage />} />
              <Route path="mappingproduct" element={<Navigate to="/products/mapping" replace />} />
              <Route path="productfunctionlist" element={<Navigate to="/products/functions" replace />} />
              <Route path="function/add" element={<Navigate to="/products/functions/add" replace />} />
              <Route path="function/:id/edit" element={<EditProductFunctionPage />} />
              <Route path="addcustomer" element={<Navigate to="/customers/add" replace />} />
              <Route path="customers/flagupdate" element={<Navigate to="/customers/flag-update" replace />} />
              <Route path="assignemployeetocustomers" element={<Navigate to="/customers/assign-employees" replace />} />
              <Route path="addsupplier" element={<Navigate to="/suppliers/add" replace />} />
              <Route path="supplier/:id/edit" element={<EditSupplierPage />} />
              <Route path="salesorderinternal" element={<Navigate to="/sales-orders" replace />} />
              <Route path="salesorderinternal/create" element={<Navigate to="/sales-orders/create" replace />} />
              <Route path="salesorderinternal/escalationlist" element={<Navigate to="/sales-orders/escalations" replace />} />
              <Route path="salesorderinternal/general" element={<Navigate to="/sales-orders/admin/general" replace />} />
              <Route path="salesorderinternal/pendingprice" element={<Navigate to="/sales-orders/admin/pending-price" replace />} />
              <Route path="salesorderinternal/:id/edit" element={protect(<EditSalesOrderPage />, standardStockOutPaths)} />
              <Route path="salesorderinternal/:id/action" element={protect(<EscalateOrderPage />, escalationStockOutPaths)} />
              <Route path="salesorderinternal/admin/:id/edit" element={protect(<EditSalesOrderPage mode="admin-full" />, adminGeneralStockOutPaths)} />
              <Route path="salesorderinternal/:id/action/price" element={protect(<EditSalesOrderPage mode="admin-price-edit" />, adminPendingPriceStockOutPaths)} />
              <Route path="salesorderinternal/:id/package" element={protect(<PackageSalesOrderPage />, packagingStockOutPaths)} />
              <Route path="salesorderinternal/packagelist" element={<Navigate to="/sales-orders/packages" replace />} />
              <Route path="salesorderinternal/packagelist/done" element={<Navigate to="/sales-orders/packages/done" replace />} />
              <Route path="salesorder/:id/invoicelimitededit" element={protect(<EditSalesOrderPage mode="admin-invoice-limited" />, adminLimitedStockOutPaths)} />
              <Route path="salesorder/limitededit" element={<Navigate to="/sales-orders/admin/limited-edit" replace />} />
              <Route path="packagelist/done/:id/edit" element={protect(<EditSalesOrderPage mode="packing-edit" />, packageDoneStockOutPaths)} />
              <Route path="packagelist/done/admin/:id/edit" element={protect(<EditSalesOrderPage mode="admin-packing-edit" />, adminGeneralStockOutPaths)} />
              <Route path="stockout/status" element={<Navigate to="/sales-orders/status" replace />} />
              <Route path="stockout/update" element={<Navigate to="/sales-orders/pending" replace />} />
              <Route path="salesoperation/stockoutstockrevert" element={<Navigate to="/sales-orders/delivery-return" replace />} />
              <Route path="packingessential/packingrelatedprint" element={<Navigate to="/sales-orders/packing-print" replace />} />
              <Route path="task/assign" element={<Navigate to="/sales-orders/task-assign" replace />} />
              <Route path="task/:id/create" element={<Navigate to="/sales-orders/task-assign" replace />} />
              <Route path="task/assignedlist" element={<Navigate to="/sales-orders/task-assigned" replace />} />
              <Route path="task/:id/edit" element={<EditTaskPage />} />
              <Route path="task/incompletelist" element={<Navigate to="/sales-orders/task-incomplete" replace />} />
              <Route path="task/newtask" element={<Navigate to="/sales-orders/tasks/new" replace />} />
              <Route path="task/incompletechecklist" element={<Navigate to="/sales-orders/pending-checklist" replace />} />
              <Route path="task/:id/editpendingchecklist" element={<EditPendingChecklistPage />} />
              <Route path="delivery/create" element={<Navigate to="/sales-orders/delivery" replace />} />
              <Route path="locationlist" element={<Navigate to="/locations" replace />} />
              <Route path="location/add" element={<Navigate to="/locations/add" replace />} />
              <Route path="location/:id/edit" element={<EditLocationPage />} />
              <Route path="inhouseemployees" element={<Navigate to="/employees" replace />} />
              <Route path="manageroleandmenu" element={<Navigate to="/admin/roles" replace />} />
              <Route path="signup" element={<Navigate to="/users/signup" replace />} />
              <Route path="roles/users" element={<Navigate to="/users/roles" replace />} />

              {/* ── Selling / Purchase Price legacy ── */}
              <Route path="price" element={<Navigate to="/selling-prices" replace />} />
              <Route path="addsellprice" element={<Navigate to="/selling-prices/add" replace />} />
              <Route path="price/:id/edit" element={protect(<EditSellingPricePage />, sellingPricePaths)} />
              <Route path="purchaseprices" element={<Navigate to="/purchase-prices" replace />} />
              <Route path="purchaseprice/add" element={<Navigate to="/purchase-prices/add" replace />} />
              <Route path="purchaseprice/:id/edit" element={protect(<EditPurchasePricePage />, purchasePricePaths)} />

              {/* ── Quotation legacy ── */}
              <Route path="quotation/list" element={<Navigate to="/quotations" replace />} />
              <Route path="quotation/unapprovedlist" element={<Navigate to="/quotations/unapproved" replace />} />
              <Route path="quotation/approvedlist" element={<Navigate to="/quotations/approved" replace />} />
              <Route path="quotation/create" element={<Navigate to="/quotations/create" replace />} />
              <Route path="quotation/:id/edit" element={<EditQuotationPage />} />
              <Route path="quotation/:id/approve" element={<ApproveQuotationPage />} />

              {/* ── LC Tracking legacy ── */}
              <Route path="lctracking/pilists" element={<Navigate to="/lc/pi" replace />} />
              <Route path="lctracking/createpi" element={<Navigate to="/lc/pi/create" replace />} />
              <Route path="lctracking/:id/updatepi" element={<EditPiPage />} />
              <Route path="lctracking/listlcanddoc" element={<Navigate to="/lc/operations" replace />} />
              <Route path="lctracking/createlcdoc" element={<Navigate to="/lc/create" replace />} />
              <Route path="lctracking/:id/updatelcdoc" element={protect(<UpdateLcDocPage />, lcDocPaths)} />
              <Route path="lctracking/documentactionlist" element={<Navigate to="/lc/documents" replace />} />
              <Route path="lctracking/lcpaymentlist" element={<Navigate to="/lc/payments" replace />} />
              <Route path="lctracking/:id/lcpayment" element={<LcPaymentEntryPage />} />
              <Route path="lctracking/lctrackingreport" element={<Navigate to="/lc/status" replace />} />
              <Route path="lc-payments/list" element={<Navigate to="/lc/payment/edit-list" replace />} />
              <Route path="lc-payments/:id/edit" element={<LcPaymentEditPage />} />
              <Route path="lc/list" element={<Navigate to="/lc/edit-list" replace />} />
              <Route path="lctracking/:id/limitedupdate" element={<LcLimitedUpdatePage />} />

              {/* ── Stock-In legacy redirects ── */}
              <Route path="stockin" element={<Navigate to="/stock-in" replace />} />
              <Route path="stockin/list" element={<Navigate to="/stock-in" replace />} />
              <Route path="stockin/create" element={<Navigate to="/stock-in/create" replace />} />
              <Route path="stockin/:id/edit" element={protect(<EditStockInPage />, stockInPaths)} />
              <Route path="stockin/unapprovedqty/list" element={<Navigate to="/stock-in/confirm-qty" replace />} />
              <Route path="stockin/:id/confirmQty" element={protect(<ConfirmQuantityPage />, stockInConfirmQtyPaths)} />
              <Route path="stockin/stockadjustment" element={<Navigate to="/stock-in/adjustment" replace />} />
              <Route path="stockin/priceupdatelist" element={<Navigate to="/stock-in/price-update" replace />} />
              <Route path="stockin/:id/updateprice" element={protect(<EditStockInPage mode="price-edit" />, stockInPriceUpdatePaths)} />
              <Route path="stockinadminaction" element={<Navigate to="/stock-in/admin/approved" replace />} />
              <Route path="stockin/stockinadminaction" element={<Navigate to="/stock-in/admin/approved" replace />} />
              <Route path="stockin/:id/stockinadminrevert" element={protect(<EditStockInPage mode="admin-revert" />, stockInAdminPaths)} />
              <Route path="stockin/stockininvoicelist" element={<Navigate to="/stock-in/invoices" replace />} />
              <Route path="stockin/invoicereport" element={<Navigate to="/stock-in/invoice-report" replace />} />

              {/* ── Sticker Packing legacy redirects ── */}
              <Route path="stockoutpackagesticker/orderlist" element={<Navigate to="/sticker-packing/orders" replace />} />
              <Route path="stockoutpackagesticker/:id/definepacking" element={<Navigate to="/sticker-packing/orders" replace />} />
              <Route path="stockoutpackagesticker/:id/editdefinepacking" element={<Navigate to="/sticker-packing/orders" replace />} />
              <Route path="packing/printpanel" element={<Navigate to="/sticker-packing/print-panel" replace />} />

              {/* ── Tax & Duty legacy redirects ── */}
              <Route path="customers/taxndutylist" element={<Navigate to="/tax-duty" replace />} />
              <Route path="taxandduty/add" element={<Navigate to="/tax-duty/add" replace />} />
              <Route path="taxandduty/:id/edit" element={<Navigate to="/tax-duty" replace />} />

              {/* ── Phase 1 Report legacy redirects ── */}
              <Route path="report/stockoutwithsalesreturn" element={<Navigate to="/reports/stockout-salesreturn" replace />} />
              <Route path="report/productloandetails" element={<Navigate to="/reports/product-loan" replace />} />
              <Route path="report/loanreports" element={<Navigate to="/reports/loan" replace />} />
              <Route path="report/monthlycreditreport" element={<Navigate to="/reports/monthly-credit" replace />} />
              <Route path="report/reconcileaudit" element={<Navigate to="/reports/reconcile-audit" replace />} />
              {/* ── Phase 5 Stock-In Report legacy redirects ── */}
              <Route path="report/currentstock" element={<Navigate to="/reports/current-stock" replace />} />
              <Route path="report/productin" element={<Navigate to="/reports/product-in" replace />} />
              <Route path="report/stockin/stockadjustmentreport" element={<Navigate to="/reports/stock-adjustment" replace />} />
              <Route path="report/getstockbyproduct" element={<Navigate to="/reports/stock-by-product" replace />} />
              <Route path="report/productinsummaryreport" element={<Navigate to="/reports/stockin-summary" replace />} />
              <Route path="report/productin-with-adjustment" element={<Navigate to="/reports/product-in-adjustment" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
