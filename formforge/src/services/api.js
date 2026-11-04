const KEY = 'ff.token';
export const token = {
    get: () => { try {
        return localStorage.getItem(KEY);
    }
    catch {
        return null;
    } },
    set: (t) => { try {
        localStorage.setItem(KEY, t);
    }
    catch { /* storage blocked */ } },
    clear: () => { try {
        localStorage.removeItem(KEY);
    }
    catch { /* storage blocked */ } },
};
export class ApiError extends Error {
    status;
    body;
    constructor(status, message, body) {
        super(message);
        this.status = status;
        this.body = body;
    }
}
let onUnauthorized = () => { };
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };
async function req(path, o = {}) {
    const t = token.get();
    let res;
    try {
        res = await fetch(`/api${path}`, {
            method: o.method ?? 'GET',
            headers: { ...(o.body ? { 'Content-Type': 'application/json' } : {}), ...(t ? { Authorization: `Bearer ${t}` } : {}) },
            body: o.body ? JSON.stringify(o.body) : undefined,
        });
    }
    catch {
        throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
    }
    if (res.status === 204)
        return undefined;
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        if (res.status === 401 && t && !o.quiet)
            onUnauthorized();
        throw new ApiError(res.status, data?.error ?? data?.message ?? 'Request failed', data);
    }
    return data;
}
export const api = {
    signup: (b) => req('/auth/signup', { method: 'POST', body: b, quiet: true }),
    login: (b) => req('/auth/login', { method: 'POST', body: b, quiet: true }),
    me: () => req('/auth/me', { quiet: true }),
    listForms: () => req('/forms'),
    getForm: (id) => req(`/forms/${id}`),
    createForm: (b) => req('/forms', { method: 'POST', body: b }),
    patchForm: (id, b) => req(`/forms/${id}`, { method: 'PATCH', body: b }),
    setStatus: (id, status) => req(`/forms/${id}/status`, { method: 'POST', body: { status } }),
    duplicate: (id) => req(`/forms/${id}/duplicate`, { method: 'POST' }),
    removeForm: (id) => req(`/forms/${id}`, { method: 'DELETE' }),
    getPublicForm: (id) => req(`/public/forms/${id}`, { quiet: true }),
    submitResponse: (id, answers, completionSeconds) => req(`/public/forms/${id}/responses`, { method: 'POST', body: { answers, completionSeconds }, quiet: true }),
    listResponses: (id) => req(`/forms/${id}/responses`),
    deleteResponse: (id, rid) => req(`/forms/${id}/responses/${rid}`, { method: 'DELETE' }),
    saveSettings: (b) => req('/settings', { method: 'PATCH', body: b }),
    changeEmail: (b) => req('/settings/email', { method: 'POST', body: b }),
    changePassword: (b) => req('/settings/password', { method: 'POST', body: b }),
    deleteAccount: (b) => req('/settings/account', { method: 'DELETE', body: b }),
    activity: () => req('/forms/activity'),
};
