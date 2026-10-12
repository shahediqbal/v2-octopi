import { getAccessToken, logoutFromBridge } from '@/auth/authBridge'
import { env } from '@/config/env'

function getFirstValidationMessage(errors: unknown): string | null {
  if (!errors || typeof errors !== 'object') {
    return null
  }

  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (!Array.isArray(value)) {
      continue
    }

    const message = value.find(
      (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
    )
    if (message) {
      return message
    }
  }

  return null
}

// function getBodyMessage(body: unknown): string | null {
//   if (typeof body === 'string') {
//     const normalized = body.trim()
//     return normalized.length > 0 ? normalized : null
//   }

//   if (!body || typeof body !== 'object') {
//     return null
//   }

//   const response = body as {
//     errMsg?: unknown
//     message?: unknown
//      detail?: unknown
//     title?: unknown
//     errors?: unknown
//   }

//   if (typeof response.errMsg === 'string' && response.errMsg.trim().length > 0) {
//     return response.errMsg
//   }

//   if (typeof response.message === 'string' && response.message.trim().length > 0) {
//     return response.message
//   }

//   const validationMessage = getFirstValidationMessage(response.errors)
//   if (validationMessage) {
//     return validationMessage
//   }

//   if (typeof response.title === 'string' && response.title.trim().length > 0) {
//     return response.title
//   }

//   try {
//     return JSON.stringify(body)
//   } catch {
//     return null
//   }
// }
function getBodyMessage(body: unknown): string | null {
  if (typeof body === 'string') {
    const normalized = body.trim()
    return normalized.length > 0
      ? normalized
      : null
  }

  if (!body || typeof body !== 'object') {
    return null
  }

  const response = body as {
    errMsg?: unknown
    message?: unknown
    detail?: unknown
    title?: unknown
    errors?: unknown
  }

  if (
    typeof response.errMsg === 'string' &&
    response.errMsg.trim().length > 0
  ) {
    return response.errMsg
  }

  if (
    typeof response.message === 'string' &&
    response.message.trim().length > 0
  ) {
    return response.message
  }

  const validationMessage =
    getFirstValidationMessage(
      response.errors,
    )

  if (validationMessage) {
    return validationMessage
  }

  if (
    typeof response.detail === 'string' &&
    response.detail.trim().length > 0
  ) {
    return response.detail
  }

  if (
    typeof response.title === 'string' &&
    response.title.trim().length > 0
  ) {
    return response.title
  }

  try {
    return JSON.stringify(body)
  } catch {
    return null
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => '')

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

class ApiError extends Error {
  status: number
  statusText: string
  body: unknown

  constructor(status: number, statusText: string, body: unknown) {
    super(getBodyMessage(body) ?? `API ${status}: ${statusText}`)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.body = body
  }
}

function authHeaders(): HeadersInit {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await parseResponseBody(response)
    // If the token is expired or invalid, clear it and redirect to sign-in
    if (response.status === 401 && getAccessToken()) {
      logoutFromBridge()
      // Use history API so React Router picks up the navigation without a full reload
      window.history.replaceState(null, '', '/signin')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
    throw new ApiError(response.status, response.statusText, body)
  }
  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(url: string) =>
    fetch(`${env.apiBaseUrl}${url}`, { headers: authHeaders() }).then(handleResponse<T>),

  post: <T>(url: string, data: unknown) =>
    fetch(`${env.apiBaseUrl}${url}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<T>),

  put: <T>(url: string, data: unknown) =>
    fetch(`${env.apiBaseUrl}${url}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<T>),

  delete: <T>(url: string) =>
    fetch(`${env.apiBaseUrl}${url}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(handleResponse<T>),
}
export const aiApiClient = {
  post: <T>(url: string, data: unknown) =>
    fetch(`${env.aiApiBaseUrl}${url}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<T>),
}