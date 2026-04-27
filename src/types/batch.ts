// ─── Batch list row (from GetBatchesGridData) ───
export interface BatchRow {
  batchId: number
  batchNo: string
  productName: string
  batchProductionDate: string
  batchExpiryDate: string
  batchCurrentStatus: number | string
}

// ─── Batch detail (from GetBatchInfoById — returns array, use [0]) ───
export interface BatchDetail {
  batchId: number
  batchNo: string
  productName: string
  batchProductionDate: string
  batchExpiryDate: string
  batchCurrentStatus: number | string
}

// ─── Update payload ───
export interface UpdateBatchPayload {
  batchId: number
  batchProductionDateInText: string
  batchExpiryDateInText: string
  batchCurrentStatus: string
}
