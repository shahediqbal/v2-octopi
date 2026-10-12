import { useMutation } from '@tanstack/react-query'
import { aiApiClient } from '@/lib/api'
import type {
  AiChatRequest,
  AiChatResponse,
} from '@/types/aiChat'

export function useAiChat() {
  return useMutation({
    mutationFn: (request: AiChatRequest) =>
      aiApiClient.post<AiChatResponse>(
        '/ai/chat',
        request,
      ),
  })
}