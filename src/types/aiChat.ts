export interface AiChatRequest {
  message: string
  provider: 'luna'
}

export interface AiChatResponse {
  success: true
  provider: string
  model: string
  answer: string
  availableTools: string[]
  conversationId: string | null
  report?: AiReportAction | null
  document?: AiDocumentAction | null
}

export interface AiDocumentAction {
  documentType: 'invoice' | 'challan'
  format: 'pdf' | 'docx'
  documentNumber: string
}

export interface AiReportAction {
  reportKey: 'sales'
  format: 'excel' | 'pdf' | 'docx' | 'chart'
  filters: {
    startDate: string
    endDate: string
    partnerId: number
  }
}
