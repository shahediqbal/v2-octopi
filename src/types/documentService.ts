export type ScannedDocumentType = 'INVOICE' | 'CHALLAN'

export interface ScannedDocument {
  id: number
  soSystemId: number | null
  documentNumber: string | null
  documentType: ScannedDocumentType
  documentDate: string | null
  customerId: number | null
  customerName: string | null
  documentFlow: string | null
  manualDocumentNumber: string | null
  metadataStatus: string | null
  fileName: string
  fileExtension: string
  fileSizeBytes: number | null
  uploadSource: string
  uploadedBy: number
  uploadedByName: string
  uploadedAt: string
  isActive: boolean | null
  createdAt: string
  updatedAt: string | null
  viewUrl: string | null
  downloadUrl: string | null
}

export type DocumentPairStatus =
  | 'COMPLETE'
  | 'INVOICE_ONLY'
  | 'CHALLAN_ONLY'
  | 'MISSING'

export interface DocumentPair {
  soSystemId: number
  documentNumber: string
  pairStatus: DocumentPairStatus
  invoice: ScannedDocument | null
  challan: ScannedDocument | null
}

export interface DocumentAccessTicket {
  previewUrl: string
  downloadUrl: string
  expiresAt: string
}

export interface DocumentPairReportFile {
  id: number
  documentNumber: string
  fileName: string
  fileExtension: string
  documentDate: string | null
  uploadedAt: string
  metadataStatus: string | null
}

export interface DocumentPairReportRow {
  soSystemId: number
  customerName: string | null
  pairStatus: Exclude<DocumentPairStatus, 'MISSING'>
  lastScannedAt: string
  totalActiveDocuments: number
  invoice: DocumentPairReportFile | null
  challan: DocumentPairReportFile | null
}

export interface DocumentPairReport {
  startDate: string
  endDate: string
  generatedAt: string
  totalSalesOrders: number
  completePairs: number
  invoiceOnly: number
  challanOnly: number
  completionRate: number
  rows: DocumentPairReportRow[]
}

export type ScannedDocumentPreviewInfo = Pick<
  ScannedDocument,
  'documentType' | 'fileName' | 'fileExtension'
>
