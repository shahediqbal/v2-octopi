// ─────────────────────────────────────────────────────────────────────────────
// Dropdown Type Registry — Single Source of Truth for All 22 Dropdown Types
// ─────────────────────────────────────────────────────────────────────────────

/** Base option shape returned by the API */
export interface DropdownOption {
  key: number
  value: string
}

/** Paginated response wrapper from the API */
export interface PaginatedResponse<T> {
  data: T[]
  totalRecords: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

/** Standard API response wrapper */
export interface DropdownApiResponse<T> {
  statusCode: number
  message: string
  dataObj: T
}

// ─────────────────── Type Keys ───────────────────

export const DROPDOWN_TYPES = {
  // Paginated (large or growing datasets — use infinite scroll)
  customer: 'customer',
  product: 'product',
  location: 'location',
  employee: 'employee',
  supplier: 'supplier',

  // Load All (small datasets — fetch once, cache aggressively)
  taskMovementTransport: 'taskMovementTransport',
  employeeByChannel: 'employeebychannel',
  productFunction: 'productFunction',
  bank: 'bank',
  jobType: 'jobType',
  designation: 'designation',
  taskChecklist: 'taskChecklist',
  productCategory: 'productCategory',
  productGroup: 'productGroup',
  paymentMode: 'paymentMode',
  department: 'department',
  vehicle: 'vehicle',
  channel: 'channel',
  chequeStatus: 'chequeStatus',
  packType: 'packType',
  employeeType: 'employeeType',
  lcPaymentTerms: 'lcPaymentTerms',
  productCountry: 'productCountry',
} as const

export type DropdownType = (typeof DROPDOWN_TYPES)[keyof typeof DROPDOWN_TYPES]

// ─────────────────── Dropdown Config Registry ───────────────────

export interface DropdownConfig {
  type: DropdownType
  label: string
  strategy: 'loadAll' | 'paginated'
  pageSize?: number
}

/**
 * Master registry — every dropdown type is configured here.
 * Use this to drive UI labels, decide strategy, and set page sizes.
 */
export const DROPDOWN_REGISTRY: Record<DropdownType, DropdownConfig> = {
  // Paginated
  customer:              { type: 'customer',              label: 'Customer',             strategy: 'paginated', pageSize: 50 },
  product:               { type: 'product',               label: 'Product',              strategy: 'paginated', pageSize: 50 },
  location:              { type: 'location',              label: 'Location',             strategy: 'paginated', pageSize: 50 },
  employee:              { type: 'employee',              label: 'Employee',             strategy: 'paginated', pageSize: 50 },
  supplier:              { type: 'supplier',              label: 'Supplier',             strategy: 'paginated', pageSize: 50 },

  // Load All
  taskMovementTransport: { type: 'taskMovementTransport', label: 'Movement Transport',   strategy: 'loadAll' },
  employeebychannel:     { type: 'employeebychannel',     label: 'Employee by Channel',  strategy: 'loadAll' },
  productFunction:       { type: 'productFunction',       label: 'Product Function',     strategy: 'loadAll' },
  bank:                  { type: 'bank',                  label: 'Bank',                 strategy: 'loadAll' },
  jobType:               { type: 'jobType',               label: 'Job Type',             strategy: 'loadAll' },
  designation:           { type: 'designation',           label: 'Designation',          strategy: 'loadAll' },
  taskChecklist:         { type: 'taskChecklist',         label: 'Task Checklist',       strategy: 'loadAll' },
  productCategory:       { type: 'productCategory',       label: 'Product Category',     strategy: 'loadAll' },
  productGroup:          { type: 'productGroup',          label: 'Product Group',        strategy: 'loadAll' },
  paymentMode:           { type: 'paymentMode',           label: 'Payment Mode',         strategy: 'loadAll' },
  department:            { type: 'department',            label: 'Department',           strategy: 'loadAll' },
  vehicle:               { type: 'vehicle',               label: 'Vehicle',              strategy: 'loadAll' },
  channel:               { type: 'channel',               label: 'Channel',              strategy: 'loadAll' },
  chequeStatus:          { type: 'chequeStatus',          label: 'Cheque Status',        strategy: 'loadAll' },
  packType:              { type: 'packType',              label: 'Pack Type',            strategy: 'loadAll' },
  employeeType:          { type: 'employeeType',          label: 'Employee Type',        strategy: 'loadAll' },
  lcPaymentTerms:        { type: 'lcPaymentTerms',        label: 'LC Payment Terms',     strategy: 'loadAll' },
  productCountry:        { type: 'productCountry',        label: 'Product Country',      strategy: 'loadAll' },
}

// ─────────────────── Strategy Classification ───────────────────

export const PAGINATED_TYPES: ReadonlySet<DropdownType> = new Set(
  Object.values(DROPDOWN_REGISTRY)
    .filter((config) => config.strategy === 'paginated')
    .map((config) => config.type),
)

export function isPaginated(type: DropdownType): boolean {
  return PAGINATED_TYPES.has(type)
}
