import {
  useEffect,
  useRef,
  useState,
} from 'react'
import type {
  FormEvent,
  KeyboardEvent,
} from 'react'
import {
  BarChart3,
  Bot,
  Check,
  Copy,
  Download,
  Languages,
  Loader2,
  Mic,
  MicOff,
  Send,
  Trash2,
  User,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAiChat } from '@/hooks/useAiChat'
import { SalesOrderChalaanModal } from '@/pages/sales-orders/SalesOrderChalaanModal'
import { SalesOrderInternalModal } from '@/pages/sales-orders/SalesOrderInternalModal'
import { runAiDocument } from '@/reports/aiDocumentRegistry'
import type { AiDocumentPreview } from '@/reports/aiDocumentRegistry'
import { runAiReport } from '@/reports/aiReportRegistry'
import type { SalesChartItem } from '@/reports/aiReportRegistry'
import type { AiDocumentAction, AiReportAction } from '@/types/aiChat'

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  report?: AiReportAction | null
  document?: AiDocumentAction | null
}

type InputLanguage = 'en-US' | 'bn-BD'

interface SpeechResultEvent {
  results: ArrayLike<{ 0: { transcript: string } }>
}

interface SpeechRecognitionInstance {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

const exampleQuestions = [
  'Show me the top 5 customers for 2026.',
  'Summarize current stock.',
  'Show customers with the highest outstanding balance.',
]

const banglaExampleQuestions = [
  '২০২৬ সালের শীর্ষ ৫ জন গ্রাহক দেখান।',
  'বর্তমান স্টকের সারসংক্ষেপ দেখান।',
  'সর্বোচ্চ বকেয়া থাকা গ্রাহকদের দেখান।',
]

const normalizeAssistantAnswer = (answer: string) => {
  const lines = answer.split(/\r?\n/)
  const headerIndex = lines.findIndex((line) =>
    /^\s*\|/.test(line) && /recoverable\s+due/i.test(line),
  )

  if (headerIndex < 0) return answer

  const splitRow = (line: string) =>
    line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())

  const headers = splitRow(lines[headerIndex])
  const recoverableDueIndex = headers.findIndex((header) =>
    /recoverable\s+due/i.test(header),
  )

  if (recoverableDueIndex < 0) return answer

  let total = 0
  let rowCount = 0

  for (let index = headerIndex + 2; index < lines.length; index += 1) {
    if (!/^\s*\|/.test(lines[index])) break

    const cells = splitRow(lines[index])
    const rawAmount = cells[recoverableDueIndex]?.replace(/[^\d().-]/g, '') ?? ''
    const negative = rawAmount.startsWith('(') && rawAmount.endsWith(')')
    const amount = Number(rawAmount.replace(/[()]/g, ''))

    if (Number.isFinite(amount)) {
      total += negative ? -amount : amount
      rowCount += 1
    }
  }

  if (rowCount === 0) return answer

  const formattedTotal = total.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return lines
    .map((line) =>
      /^\s*\*\*Total recoverable due:\*\*/i.test(line)
        ? `**Total recoverable due:** ${formattedTotal}`
        : line,
    )
    .filter((line) =>
      !/(need not calculate|avoid error|don't include|invented arithmetic|mention .* concise)/i.test(line),
    )
    .join('\n')
}

export function AiChatPage() {
  const aiChat = useAiChat()

  const [message, setMessage] = useState('')
  const [messages, setMessages] =
    useState<ChatMessage[]>([])
  const [downloadingReportId, setDownloadingReportId] = useState<number | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
  const [reportCharts, setReportCharts] = useState<Record<number, SalesChartItem[]>>({})
  const [documentPreview, setDocumentPreview] = useState<AiDocumentPreview | null>(null)
  const [inputLanguage, setInputLanguage] = useState<InputLanguage>('en-US')
  const [isListening, setIsListening] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null)

  const formRef = useRef<HTMLFormElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageIdRef = useRef(0)
  const activeRequestRef = useRef(false)
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const activeExamples = inputLanguage === 'bn-BD' ? banglaExampleQuestions : exampleQuestions

  const createMessageId = () => {
    messageIdRef.current += 1
    return messageIdRef.current
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [messages, aiChat.isPending])

  useEffect(() => () => speechRecognitionRef.current?.stop(), [])

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const normalizedMessage = message.trim()

    if (
      !normalizedMessage ||
      aiChat.isPending ||
      activeRequestRef.current
    ) {
      return
    }

    activeRequestRef.current = true

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: normalizedMessage,
    }

    setMessages((current) => [
      ...current,
      userMessage,
    ])

    setMessage('')

    try {
      const response = await aiChat.mutateAsync({
        message: normalizedMessage,
        provider: 'luna',
      })

      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content: normalizeAssistantAnswer(response.answer),
        report: response.report,
        document: response.document,
      }

      setMessages((current) => [
        ...current,
        assistantMessage,
      ])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content:
          error instanceof Error
            ? error.message
            : 'Unable to complete the request.',
      }

      setMessages((current) => [
        ...current,
        errorMessage,
      ])
    } finally {
      activeRequestRef.current = false
    }
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return
    }

    event.preventDefault()

    if (
      message.trim() &&
      !aiChat.isPending &&
      !activeRequestRef.current
    ) {
      formRef.current?.requestSubmit()
    }
  }

  const selectExample = (question: string) => {
    if (!aiChat.isPending) {
      setMessage(question)
    }
  }

  const clearConversation = () => {
    if (aiChat.isPending) {
      return
    }

    setMessages([])
    setMessage('')
    aiChat.reset()
    setReportError(null)
    setReportCharts({})
    setDocumentPreview(null)
  }

  const handleReportDownload = async (chatMessage: ChatMessage) => {
    if (!chatMessage.report || downloadingReportId !== null) return

    setDownloadingReportId(chatMessage.id)
    setReportError(null)
    try {
      const result = await runAiReport(chatMessage.report)
      if (result.chart) {
        setReportCharts((current) => ({ ...current, [chatMessage.id]: result.chart ?? [] }))
      }
    } catch (error) {
      setReportError(error instanceof Error ? error.message : 'Unable to download the report.')
    } finally {
      setDownloadingReportId(null)
    }
  }

  const handleDocument = async (chatMessage: ChatMessage) => {
    if (!chatMessage.document || downloadingReportId !== null) return
    setDownloadingReportId(chatMessage.id)
    setReportError(null)
    try {
      const preview = await runAiDocument(chatMessage.document)
      if (preview) setDocumentPreview(preview)
    } catch (error) {
      setReportError(error instanceof Error ? error.message : 'Unable to prepare the ERP document.')
    } finally {
      setDownloadingReportId(null)
    }
  }

  const copyMessage = async (chatMessage: ChatMessage) => {
    await navigator.clipboard.writeText(chatMessage.content)
    setCopiedMessageId(chatMessage.id)
    window.setTimeout(() => setCopiedMessageId(null), 1500)
  }

  const toggleSpeechInput = () => {
    if (isListening) {
      speechRecognitionRef.current?.stop()
      return
    }

    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Recognition) {
      setSpeechError('Speech input is not supported by this browser. Use Chrome or Edge.')
      return
    }

    const recognition = new Recognition()
    recognition.lang = inputLanguage
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim()
      if (transcript) setMessage((current) => `${current}${current ? ' ' : ''}${transcript}`)
    }
    recognition.onerror = () => setSpeechError('Speech could not be recognized. Please try again.')
    recognition.onend = () => {
      setIsListening(false)
      speechRecognitionRef.current = null
    }
    speechRecognitionRef.current = recognition
    setSpeechError(null)
    setIsListening(true)
    recognition.start()
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Bot size={22} />
            </div>

            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Octopi AI
              </h1>

              <p className="text-sm text-gray-500">
                Ask questions about your ERP data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInputLanguage((current) => current === 'en-US' ? 'bn-BD' : 'en-US')}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
            title="Change input and speech language"
          >
            <Languages size={16} /> {inputLanguage === 'bn-BD' ? 'বাংলা' : 'English'}
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearConversation}
              disabled={aiChat.isPending}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              title="Clear conversation"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">
                Clear Chat
              </span>
            </button>
          )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <Bot size={28} />
            </div>

            <h2 className="text-xl font-semibold text-gray-900">
              How can I help with your ERP?
            </h2>

            <p className="mt-2 max-w-lg text-sm text-gray-500">
              Octopi AI accepts ERP-related questions only.
            </p>

            <div className="mt-6 grid w-full max-w-2xl gap-3 md:grid-cols-3">
              {activeExamples.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() =>
                    selectExample(question)
                  }
                  disabled={aiChat.isPending}
                  className="rounded-xl border border-gray-200 bg-white p-4 text-left text-sm text-gray-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((chatMessage) => (
              <div
                key={chatMessage.id}
                className={
                  chatMessage.role === 'user'
                    ? 'flex justify-end'
                    : 'flex justify-start'
                }
              >
                <div
                  className={
                    chatMessage.role === 'user'
                      ? 'flex max-w-[80%] flex-row-reverse gap-3'
                      : 'flex w-full max-w-full gap-3'
                  }
                >
                  <div
                    className={
                      chatMessage.role === 'user'
                        ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-800 text-white'
                        : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white'
                    }
                  >
                    {chatMessage.role === 'user' ? (
                      <User size={16} />
                    ) : (
                      <Bot size={16} />
                    )}
                  </div>

                  <div
                    className={
                      chatMessage.role === 'user'
                        ? 'whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-gray-800 px-4 py-3 text-sm text-white'
                        : 'min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-800 shadow-sm'
                    }
                  >
                    {chatMessage.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({ children }) => (
                              <div className="my-4 w-full overflow-x-auto rounded-lg border border-gray-200">
                                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="bg-slate-100 text-slate-700">{children}</thead>
                            ),
                            th: ({ children }) => (
                              <th className="border-b border-r border-gray-200 px-3 py-2.5 font-semibold last:border-r-0">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="border-b border-r border-gray-100 px-3 py-2 align-top last:border-r-0">
                                {children}
                              </td>
                            ),
                            tr: ({ children }) => (
                              <tr className="last:[&>td]:border-b-0 even:bg-slate-50/60">{children}</tr>
                            ),
                            p: ({ children }) => <p className="my-2">{children}</p>,
                          }}
                        >
                          {chatMessage.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      chatMessage.content
                    )}
                    {chatMessage.role === 'assistant' && chatMessage.report && (
                      <button
                        type="button"
                        onClick={() => void handleReportDownload(chatMessage)}
                        disabled={downloadingReportId !== null}
                        className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {downloadingReportId === chatMessage.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          chatMessage.report.format === 'chart' ? <BarChart3 size={16} /> : <Download size={16} />
                        )}
                        {downloadingReportId === chatMessage.id
                          ? 'Preparing report…'
                          : chatMessage.report.format === 'chart'
                            ? 'View Chart'
                            : `Download ${chatMessage.report.format.toUpperCase()}`}
                      </button>
                    )}
                    {chatMessage.role === 'assistant' && chatMessage.document && (
                      <button
                        type="button"
                        onClick={() => void handleDocument(chatMessage)}
                        disabled={downloadingReportId !== null}
                        className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {downloadingReportId === chatMessage.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        {downloadingReportId === chatMessage.id
                          ? 'Preparing document…'
                          : chatMessage.document.format === 'pdf'
                            ? `Open ${chatMessage.document.documentType} PDF`
                            : `Download ${chatMessage.document.documentType} DOCX`}
                      </button>
                    )}
                    {reportCharts[chatMessage.id] && (
                      <SalesBarChart items={reportCharts[chatMessage.id]} />
                    )}
                    {chatMessage.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => void copyMessage(chatMessage)}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600"
                      >
                        {copiedMessageId === chatMessage.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedMessageId === chatMessage.id ? 'Copied' : 'Copy response'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {aiChat.isPending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <Bot size={16} />
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Octopi AI is thinking...
                  </div>
                </div>
              </div>
            )}

            {reportError && (
              <div className="ml-11 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {reportError}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white p-4">
        {speechError && <p className="mb-2 text-center text-xs text-red-600">{speechError}</p>}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex items-end gap-3"
        >
          <textarea
            lang={inputLanguage}
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder={inputLanguage === 'bn-BD' ? 'ERP সম্পর্কিত প্রশ্ন লিখুন…' : 'Ask an ERP-related question...'}
            rows={2}
            maxLength={4000}
            disabled={aiChat.isPending}
            className="min-h-12 flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
          />

          <button
            type="button"
            onClick={toggleSpeechInput}
            disabled={aiChat.isPending}
            className={isListening
              ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white'
              : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-600 transition hover:bg-gray-50 disabled:opacity-50'}
            title={isListening ? 'Stop listening' : inputLanguage === 'bn-BD' ? 'বাংলায় বলুন' : 'Speak your question'}
          >
            {isListening ? <MicOff size={19} /> : <Mic size={19} />}
          </button>

          <button
            type="submit"
            disabled={
              !message.trim() ||
              aiChat.isPending
            }
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            title="Send question"
          >
            {aiChat.isPending ? (
              <Loader2
                size={19}
                className="animate-spin"
              />
            ) : (
              <Send size={19} />
            )}
          </button>
        </form>

        <p className="mt-2 text-center text-xs text-gray-400">
          Press Enter to send · Shift+Enter for a new line
        </p>
      </footer>

      <SalesOrderInternalModal
        isOpen={documentPreview?.type === 'invoice'}
        detail={documentPreview?.detail}
        title="ERP Invoice / Detail"
        viewVariant="packing-print"
        onClose={() => setDocumentPreview(null)}
      />
      <SalesOrderChalaanModal
        isOpen={documentPreview?.type === 'challan'}
        packagingDetail={documentPreview?.packaging}
        orderDetail={documentPreview?.detail}
        onClose={() => setDocumentPreview(null)}
      />
    </div>
  )
}

function SalesBarChart({ items }: { items: SalesChartItem[] }) {
  const max = Math.max(...items.map((item) => item.amount), 1)
  if (items.length === 0) return <p className="mt-3 text-sm text-gray-500">No chart data available.</p>

  return (
    <div className="mt-4 min-w-[320px] rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="mb-3 font-semibold text-gray-800">Monthly Sales</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="grid grid-cols-[70px_1fr_110px] items-center gap-2 text-xs">
            <span className="text-gray-600">{item.label}</span>
            <div className="h-5 overflow-hidden rounded bg-gray-200">
              <div className="h-full rounded bg-indigo-600" style={{ width: `${Math.max((item.amount / max) * 100, 1)}%` }} />
            </div>
            <span className="text-right tabular-nums text-gray-700">
              {item.amount.toLocaleString('en-BD', { maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
