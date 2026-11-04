// API client. The only module that talks to the backend.
import type { Form, FormResponse, User } from '../types'

const KEY = 'ff.token'
export const token = {
  get: () => { try { return localStorage.getItem(KEY) } catch { return null } },
  set: (t: string) => { try { localStorage.setItem(KEY, t) } catch { /* storage blocked */ } },
  clear: () => { try { localStorage.removeItem(KEY) } catch { /* storage blocked */ } },
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) { super(message) }
}
let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn }

async function req<T>(path: string, o: { method?: string; body?: unknown; quiet?: boolean } = {}): Promise<T> {
  const t = token.get()
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method: o.method ?? 'GET',
      headers: { ...(o.body ? { 'Content-Type': 'application/json' } : {}), ...(t ? { Authorization: `Bearer ${t}` } : {}) },
      body: o.body ? JSON.stringify(o.body) : undefined,
    })
  } catch { throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.') }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && t && !o.quiet) onUnauthorized()
    throw new ApiError(res.status, data?.error ?? data?.message ?? 'Request failed', data)
  }
  return data as T
}

export type FormBody = Pick<Form, 'title' | 'description' | 'fields' | 'accent'> & Partial<Pick<Form, 'submissionLimit' | 'expiresAt'>>
export type PublicForm = Pick<Form, 'id' | 'title' | 'description' | 'accent' | 'fields'>
type Session = { token: string; user: User }

export const api = {
  signup: (b: { name: string; email: string; password: string }) => req<Session>('/auth/signup', { method: 'POST', body: b, quiet: true }),
  login: (b: { email: string; password: string }) => req<Session>('/auth/login', { method: 'POST', body: b, quiet: true }),
  me: () => req<User>('/auth/me', { quiet: true }),
  listForms: () => req<Form[]>('/forms'),
  getForm: (id: string) => req<Form>(`/forms/${id}`),
  createForm: (b: FormBody) => req<Form>('/forms', { method: 'POST', body: b }),
  patchForm: (id: string, b: Partial<FormBody>) => req<Form>(`/forms/${id}`, { method: 'PATCH', body: b }),
  setStatus: (id: string, status: Form['status']) => req<Form>(`/forms/${id}/status`, { method: 'POST', body: { status } }),
  duplicate: (id: string) => req<Form>(`/forms/${id}/duplicate`, { method: 'POST' }),
  removeForm: (id: string) => req<void>(`/forms/${id}`, { method: 'DELETE' }),
  getPublicForm: (id: string) => req<PublicForm>(`/public/forms/${id}`, { quiet: true }),
  submitResponse: (id: string, answers: Record<string, unknown>, completionSeconds: number) => req<{ ok: true }>(`/public/forms/${id}/responses`, { method: 'POST', body: { answers, completionSeconds }, quiet: true }),
  listResponses: (id: string) => req<FormResponse[]>(`/forms/${id}/responses`),
  deleteResponse: (id: string, rid: string) => req<void>(`/forms/${id}/responses/${rid}`, { method: 'DELETE' }),
  saveSettings: (b: Partial<Pick<User, 'name' | 'workspaceName' | 'defaultAccent' | 'notifications'>>) => req<User>('/settings', { method: 'PATCH', body: b }),
  changeEmail: (b: { email: string; password: string }) => req<User>('/settings/email', { method: 'POST', body: b }),
  changePassword: (b: { currentPassword: string; newPassword: string }) => req<void>('/settings/password', { method: 'POST', body: b }),
  deleteAccount: (b: { password: string }) => req<void>('/settings/account', { method: 'DELETE', body: b }),
  activity: () => req<FormResponse[]>('/forms/activity'),
}
