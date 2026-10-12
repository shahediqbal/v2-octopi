import { useQuery } from '@tanstack/react-query'
import { env } from '@/config/env'
import { apiClient } from '@/lib/api'
import type {
  DocumentAccessTicket,
  DocumentPair,
  DocumentPairReport,
  ScannedDocument,
} from '@/types/documentService'

export const documentServiceKeys = {
  all: ['documentService'] as const,
  pair: (soSystemId: number) =>
    [...documentServiceKeys.all, 'pair', soSystemId] as const,
  pairReport: (startDate: string, endDate: string) =>
    [...documentServiceKeys.all, 'pairReport', startDate, endDate] as const,
}

export function useDocumentPair(soSystemId: number | undefined) {
  return useQuery({
    queryKey: documentServiceKeys.pair(soSystemId ?? 0),
    queryFn: () =>
      apiClient.get<DocumentPair>(`/DocumentService/so/${soSystemId}`),
    enabled: soSystemId != null && soSystemId > 0,
    staleTime: 2 * 60_000,
    retry: false,
  })
}

export function useDocumentPairReport(
  startDate: string,
  endDate: string,
  enabled = true,
) {
  const params = new URLSearchParams({ startDate, endDate })

  return useQuery<DocumentPairReport>({
    queryKey: documentServiceKeys.pairReport(startDate, endDate),
    queryFn: () =>
      apiClient.get<DocumentPairReport>(`/DocumentService/pairs-report?${params.toString()}`),
    enabled: enabled && Boolean(startDate && endDate && startDate <= endDate),
    staleTime: 2 * 60_000,
  })
}

interface CachedDocumentAccess {
  ticket: DocumentAccessTicket
  reuseUntil: number
}

const documentAccessCache = new Map<number, CachedDocumentAccess>()

function resolveApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  return `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

async function getDocumentAccess(documentId: number) {
  const cached = documentAccessCache.get(documentId)

  if (cached && cached.reuseUntil > Date.now()) {
    return cached.ticket
  }

  const ticket = await apiClient.post<DocumentAccessTicket>(
    `/DocumentService/${documentId}/preview-ticket`,
    {},
  )

  // Server tickets use a five-minute sliding expiration. Reuse for four
  // minutes so a new URL is obtained before the idle window can expire.
  documentAccessCache.set(documentId, {
    ticket,
    reuseUntil: Date.now() + 4 * 60_000,
  })

  return ticket
}

export async function createDocumentPreview(
  document: Pick<ScannedDocument, 'id' | 'fileExtension'>,
): Promise<{ previewUrl: string; contentType: string }> {
  const ticket = await getDocumentAccess(document.id)
  const extension = document.fileExtension.replace('.', '').toLowerCase()

  return {
    previewUrl: resolveApiUrl(ticket.previewUrl),
    contentType:
      extension === 'pdf'
        ? 'application/pdf'
        : extension === 'png'
          ? 'image/png'
          : 'image/jpeg',
  }
}

export async function downloadScannedDocument(
  document: Pick<ScannedDocument, 'id' | 'fileName'>,
) {
  const ticket = await getDocumentAccess(document.id)
  const link = window.document.createElement('a')

  link.href = resolveApiUrl(ticket.downloadUrl)
  link.download = document.fileName
  window.document.body.appendChild(link)
  link.click()
  link.remove()
}
