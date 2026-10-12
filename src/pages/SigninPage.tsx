import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { env } from '@/config/env'
import { getDefaultAuthenticatedRoute, isAuthenticated } from '@/auth/authBridge'

interface LoginResponse {
  dataObj?: Record<string, unknown>
  data?: Record<string, unknown>
  token?: string
  accessToken?: string
  errMsg?: string
  message?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function extractUserInfo(payload: LoginResponse): Record<string, unknown> | null {
  const root = asRecord(payload)
  const dataObj = asRecord(root.dataObj)
  const data = asRecord(root.data)

  const token =
    asString(dataObj.token) ||
    asString(dataObj.accessToken) ||
    asString(data.token) ||
    asString(data.accessToken) ||
    asString(root.token) ||
    asString(root.accessToken)

  if (!token) return null

  return {
    ...data,
    ...dataObj,
    token,
    menuToken: asString(dataObj.menuToken) || asString(data.menuToken) || undefined,
    menuInPlainListToken:
      asString(dataObj.menuInPlainListToken) || asString(data.menuInPlainListToken) || undefined,
  }
}

export function SigninPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If already authenticated, redirect
  if (isAuthenticated()) {
    return <Navigate to={getDefaultAuthenticatedRoute()} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${env.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, userPassword }),
      })

      const payload = (await response.json()) as LoginResponse
      const userInfo = extractUserInfo(payload)

      if (userInfo?.token) {
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
        navigate(getDefaultAuthenticatedRoute(), { replace: true })
        return
      }

      setError(payload?.errMsg || payload?.message || 'Login response did not include a token.')
    } catch {
      setError('Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* brand card */}
        <div className="mb-8 text-center">
          <img
            src="/images/trade.png"
            alt="Trade"
            className="mx-auto mb-3 h-14 w-auto shadow-md"
          />
          <h1 className="text-2xl font-bold text-gray-900">Octopi ERP</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
        </div>

        {/* form card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
                placeholder="Enter your username"
              />
            </div>

            {/* password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -trangray-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Already authenticated?{' '}
          <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
            Go to Dashboard
          </Link>
        </p>
      </div>
    </div>
  )
}
