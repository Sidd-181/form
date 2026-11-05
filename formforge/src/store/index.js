import { configureStore, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { api, token, setUnauthorizedHandler } from '../services/api.js';
const blank = { forms: [], responses: [], load: 'idle' };
const initialState = { ...blank, auth: { user: null, status: token.get() ? 'checking' : 'anon' } };
export const loadDashboard = createAsyncThunk('app/load', async () => {
    const [forms, responses] = await Promise.all([api.listForms(), api.activity()]);
    return { forms, responses };
});
export const fetchForm = createAsyncThunk('app/fetchForm', (id) => api.getForm(id));
export const createForm = createAsyncThunk('app/create', (b) => api.createForm(b));
export const duplicateForm = createAsyncThunk('app/duplicate', (id) => api.duplicate(id));
export const removeForm = createAsyncThunk('app/remove', async (id) => { await api.removeForm(id); return id; });
export const setStatus = createAsyncThunk('app/status', (a) => api.setStatus(a.id, a.status));
export const updateContent = createAsyncThunk('app/update', ({ id, ...body }) => api.patchForm(id, body));
export const updateSettings = createAsyncThunk('app/settings', ({ id, ...body }) => api.patchForm(id, body));
export const saveProfile = createAsyncThunk('settings/save', (b) => api.saveSettings(b));
export const changeEmail = createAsyncThunk('settings/email', (b) => api.changeEmail(b));
export const changePassword = createAsyncThunk('settings/password', (b) => api.changePassword(b));
export const deleteAccount = createAsyncThunk('settings/delete', (b) => api.deleteAccount(b));
export const login = createAsyncThunk('auth/login', async (b) => { const r = await api.login(b); token.set(r.token); return r.user; });
export const signup = createAsyncThunk('auth/signup', async (b) => { const r = await api.signup(b); token.set(r.token); return r.user; });
export const restoreSession = createAsyncThunk('auth/restore', async () => {
    try {
        return await api.me();
    }
    catch (e) {
        token.clear();
        throw e;
    }
});
const upsert = (s, f) => {
    const i = s.forms.findIndex(x => x.id === f.id);
    if (i < 0)
        s.forms.unshift(f);
    else
        s.forms[i] = { ...s.forms[i], ...f };
};
const slice = createSlice({
    name: 'app', initialState,
    reducers: {
        signedOut: () => ({ ...blank, auth: { user: null, status: 'anon' } }),
        responseDeleted: (s, a) => {
            const form = s.forms.find(f => f.id === a.payload.formId);
            if (form?.responseCount != null)
                form.responseCount = Math.max(0, form.responseCount - 1);
            s.responses = s.responses.filter(r => r.id !== a.payload.responseId);
        },
    },
    extraReducers: b => {
        b.addCase(loadDashboard.pending, s => { s.load = 'loading'; s.loadError = undefined; })
            .addCase(loadDashboard.fulfilled, (s, a) => { s.load = 'ready'; s.forms = a.payload.forms; s.responses = a.payload.responses; })
            .addCase(loadDashboard.rejected, (s, a) => { s.load = 'error'; s.loadError = a.error.message; })
            .addCase(fetchForm.fulfilled, (s, a) => upsert(s, a.payload))
            .addCase(createForm.fulfilled, (s, a) => upsert(s, a.payload))
            .addCase(duplicateForm.fulfilled, (s, a) => upsert(s, a.payload))
            .addCase(updateContent.fulfilled, (s, a) => upsert(s, a.payload))
            .addCase(updateSettings.fulfilled, (s, a) => upsert(s, a.payload))
            .addCase(setStatus.fulfilled, (s, a) => upsert(s, a.payload))
            .addCase(removeForm.fulfilled, (s, a) => { s.forms = s.forms.filter(f => f.id !== a.payload); s.responses = s.responses.filter(r => r.formId !== a.payload); })
            .addCase(saveProfile.fulfilled, (s, a) => { s.auth.user = a.payload; })
            .addCase(changeEmail.fulfilled, (s, a) => { s.auth.user = a.payload; })
            .addCase(login.fulfilled, (s, a) => { s.auth = { user: a.payload, status: 'authed' }; })
            .addCase(signup.fulfilled, (s, a) => { s.auth = { user: a.payload, status: 'authed' }; })
            .addCase(restoreSession.fulfilled, (s, a) => { s.auth = { user: a.payload, status: 'authed' }; })
            .addCase(restoreSession.rejected, s => { s.auth = { user: null, status: 'anon' }; });
    },
});
export const store = configureStore({ reducer: slice.reducer });
export const responseDeleted = slice.actions.responseDeleted;
export const logout = () => { token.clear(); return slice.actions.signedOut(); };
setUnauthorizedHandler(() => { store.dispatch(logout()); });
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
