import { configureStore, createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import type { Form, FormResponse, User } from '../types'
import { api, token, setUnauthorizedHandler, type FormBody } from '../services/api'

interface State {
  forms: Form[]; responses: FormResponse[]; load: 'idle' | 'loading' | 'ready' | 'error'; loadError?: string
  auth: { user: User | null; status: 'checking' | 'authed' | 'anon' }
}
const blank = { forms: [], responses: [], load: 'idle' as const }
const initialState: State = { ...blank, auth: { user: null, status: token.get() ? 'checking' : 'anon' } }

export const loadDashboard = createAsyncThunk('app/load', async () => {
  const [forms, responses] = await Promise.all([api.listForms(), api.activity()])
  return { forms, responses }
})
export const fetchForm = createAsyncThunk('app/fetchForm', (id: string) => api.getForm(id))
export const createForm = createAsyncThunk('app/create', (b: FormBody) => api.createForm(b))
export const duplicateForm = createAsyncThunk('app/duplicate', (id: string) => api.duplicate(id))
export const removeForm = createAsyncThunk('app/remove', async (id: string) => { await api.removeForm(id); return id })
export const setStatus = createAsyncThunk('app/status', (a: { id: string; status: Form['status'] }) => api.setStatus(a.id, a.status))
export const updateContent = createAsyncThunk('app/update', ({ id, ...body }: { id: string } & Pick<FormBody, 'title' | 'description' | 'fields' | 'accent'>) => api.patchForm(id, body))
export const updateSettings = createAsyncThunk('app/settings', ({ id, ...body }: { id: string } & Pick<FormBody, 'submissionLimit' | 'expiresAt'>) => api.patchForm(id, body))
export const saveProfile = createAsyncThunk('settings/save', (b: Parameters<typeof api.saveSettings>[0]) => api.saveSettings(b))
export const changeEmail = createAsyncThunk('settings/email', (b: { email: string; password: string }) => api.changeEmail(b))
export const changePassword = createAsyncThunk('settings/password', (b: { currentPassword: string; newPassword: string }) => api.changePassword(b))
export const deleteAccount = createAsyncThunk('settings/delete', (b: { password: string }) => api.deleteAccount(b))
export const login = createAsyncThunk('auth/login', async (b: { email: string; password: string }) => { const r = await api.login(b); token.set(r.token); return r.user })
export const signup = createAsyncThunk('auth/signup', async (b: { name: string; email: string; password: string }) => { const r = await api.signup(b); token.set(r.token); return r.user })
export const restoreSession = createAsyncThunk('auth/restore', async () => {
  try { return await api.me() } catch (e) { token.clear(); throw e }
})

const upsert = (s: State, f: Form) => {
  const i = s.forms.findIndex(x => x.id === f.id)
  if (i < 0) s.forms.unshift(f); else s.forms[i] = { ...s.forms[i], ...f }
}

const slice = createSlice({
  name: 'app', initialState,
  reducers: { signedOut: (): State => ({ ...blank, auth: { user: null, status: 'anon' } }) },
  extraReducers: b => {
    b.addCase(loadDashboard.pending, s => { s.load = 'loading'; s.loadError = undefined })
      .addCase(loadDashboard.fulfilled, (s, a) => { s.load = 'ready'; s.forms = a.payload.forms; s.responses = a.payload.responses })
      .addCase(loadDashboard.rejected, (s, a) => { s.load = 'error'; s.loadError = a.error.message })
      .addCase(fetchForm.fulfilled, (s, a) => upsert(s, a.payload))
      .addCase(createForm.fulfilled, (s, a) => upsert(s, a.payload))
      .addCase(duplicateForm.fulfilled, (s, a) => upsert(s, a.payload))
      .addCase(updateContent.fulfilled, (s, a) => upsert(s, a.payload))
      .addCase(updateSettings.fulfilled, (s, a) => upsert(s, a.payload))
      .addCase(setStatus.fulfilled, (s, a) => upsert(s, a.payload))
      .addCase(removeForm.fulfilled, (s, a) => { s.forms = s.forms.filter(f => f.id !== a.payload); s.responses = s.responses.filter(r => r.formId !== a.payload) })
      .addCase(saveProfile.fulfilled, (s, a) => { s.auth.user = a.payload })
      .addCase(changeEmail.fulfilled, (s, a) => { s.auth.user = a.payload })
      .addCase(login.fulfilled, (s, a) => { s.auth = { user: a.payload, status: 'authed' } })
      .addCase(signup.fulfilled, (s, a) => { s.auth = { user: a.payload, status: 'authed' } })
      .addCase(restoreSession.fulfilled, (s, a) => { s.auth = { user: a.payload, status: 'authed' } })
      .addCase(restoreSession.rejected, s => { s.auth = { user: null, status: 'anon' } })
  },
})

export const store = configureStore({ reducer: slice.reducer })
export const logout = () => { token.clear(); return slice.actions.signedOut() }
setUnauthorizedHandler(() => { store.dispatch(logout()) })

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
