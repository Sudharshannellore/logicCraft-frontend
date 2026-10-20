import type { AuthResponse } from '@/types'
import { useAuthStore } from '@/stores/authStore'

/**
 * The one way the app talks to the Logicraft API. Adds the access token, renews the session once when it
 * has expired, and turns every failure into an `ApiError` with a message that's safe to show.
 */

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown>

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const isApiError = (error: unknown, status?: number): error is ApiError =>
  error instanceof ApiError && (status === undefined || error.status === status)

/** A readable message for any error, for toasts and inline alerts. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'Something went wrong. Please try again.'
}

interface RequestOptions {
  body?: unknown
  /** Form-encoded body (only the OAuth token endpoint needs this). */
  form?: URLSearchParams
  /** Send the access token (default) — public endpoints pass false. */
  auth?: boolean
  signal?: AbortSignal
}

async function parseError(res: Response): Promise<ApiError> {
  const data = await res.json().catch(() => null)
  if (data?.error) return new ApiError(res.status, data.error.code ?? 'error', data.error.message ?? res.statusText, data.error.details)
  // FastAPI request validation: { detail: [{ loc, msg }] }
  if (Array.isArray(data?.detail) && data.detail.length) {
    const first = data.detail[0]
    const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : undefined
    const message = String(first.msg ?? 'Invalid input').replace(/^Value error, /, '')
    return new ApiError(res.status, 'validation_error', field && field !== 'body' ? `${field}: ${message}` : message, { field })
  }
  return new ApiError(res.status, 'http_error', res.statusText || 'Request failed')
}

let refreshing: Promise<boolean> | null = null

/** Swaps the refresh token for a new session. Shared, so parallel 401s trigger a single refresh. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = useAuthStore.getState().refreshToken
    if (!refreshToken) return false
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) return false
      useAuthStore.getState().setSession((await res.json()) as AuthResponse)
      return true
    } catch {
      return false
    }
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

export async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const useAuth = options.auth !== false

  const send = (token: string | null) => {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    let body: BodyInit | undefined
    if (options.form) body = options.form
    else if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(options.body)
    }
    return fetch(`${API_URL}${path}`, { method, headers, body, signal: options.signal })
  }

  let res: Response
  try {
    const token = useAuth ? useAuthStore.getState().accessToken : null
    res = await send(token)
    if (res.status === 401 && useAuth && token && (await refreshSession())) {
      res = await send(useAuthStore.getState().accessToken)
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiError(0, 'network_error', "Can't reach the Logicraft server. Check that the API is running and try again.")
  }

  if (!res.ok) {
    const error = await parseError(res)
    // The session is over (expired refresh token, password changed elsewhere…): sign out locally.
    if (res.status === 401 && useAuth) useAuthStore.getState().clear()
    throw error
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
}

/** Turns a 404 into null — for detail pages that show their own "not found" state. */
export async function orNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise
  } catch (error) {
    if (isApiError(error, 404)) return null
    throw error
  }
}

export function query(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  const text = search.toString()
  return text ? `?${text}` : ''
}
