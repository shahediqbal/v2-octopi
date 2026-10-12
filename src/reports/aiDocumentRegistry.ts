import { apiClient } from '@/lib/api'
import type { AiDocumentAction } from '@/types/aiChat'
import type { StockOutApiResponse, StockOutJobSearchResult, StockOutOrderDetail, StockOutPackagingDetail } from '@/types/stockOut'
import { exportErpDocumentDocx } from '@/utils/exportErpDocumentDocx'

export interface AiDocumentPreview {
  type: 'invoice' | 'challan'
  detail: StockOutOrderDetail
  packaging: StockOutPackagingDetail | null
}

export async function runAiDocument(action: AiDocumentAction): Promise<AiDocumentPreview | null> {
  const search = await apiClient.get<StockOutApiResponse<StockOutJobSearchResult | StockOutJobSearchResult[]>>(
    `/StockOut/GetJobBySearch/${encodeURIComponent(action.documentNumber)}`,
  )
  const matches = Array.isArray(search.dataObj)
    ? search.dataObj
    : search.dataObj
      ? [search.dataObj]
      : []
  const match = matches.find((item) => item.soSystemNo?.toLowerCase() === action.documentNumber.toLowerCase()) ?? matches[0]
  if (!match) throw new Error(`Invoice ${action.documentNumber} was not found.`)

  const detailResponse = await apiClient.get<StockOutApiResponse<StockOutOrderDetail>>(
    `/StockOut/GetStockOutOrderDetails/${match.soSystemId}`,
  )
  const detail = detailResponse.dataObj
  if (!detail) throw new Error('ERP document details could not be loaded.')

  let packaging: StockOutPackagingDetail | null = null
  if (action.documentType === 'challan') {
    const packagingResponse = await apiClient.get<StockOutApiResponse<StockOutPackagingDetail>>(
      `/StockOut/GetPackagingInfo/${match.soSystemId}`,
    )
    packaging = packagingResponse.dataObj ?? null
    if (!packaging) throw new Error('Challan packaging details could not be loaded.')
  }

  if (action.format === 'docx') {
    await exportErpDocumentDocx({ type: action.documentType, detail, packaging })
    return null
  }

  return { type: action.documentType, detail, packaging }
}
