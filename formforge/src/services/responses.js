import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { responseDeleted, useAppDispatch } from '../store/index.js';
export function useResponses(formId) {
    const dispatch = useAppDispatch();
    const [state, setState] = useState({ data: null, error: null });
    const [tick, setTick] = useState(0);
    useEffect(() => {
        let live = true;
        api.listResponses(formId).then(data => live && setState({ data, error: null })).catch((e) => live && setState({ data: null, error: e.message }));
        return () => { live = false; };
    }, [formId, tick]);
    const reload = useCallback(() => { setState({ data: null, error: null }); setTick(t => t + 1); }, []);
    const remove = async (rid) => {
        await api.deleteResponse(formId, rid);
        setState(s => ({ ...s, data: s.data?.filter(r => r.id !== rid) ?? null }));
        dispatch(responseDeleted({ formId, responseId: rid }));
    };
    return { ...state, reload, remove };
}
export const fmtAnswer = (a) => Array.isArray(a) ? a.join(', ') : typeof a === 'boolean' ? (a ? 'Yes' : 'No') : a && typeof a === 'object' && 'fileId' in a ? String(a.name ?? 'Uploaded file') : a == null ? '' : String(a);
export const responseFieldKey = field => `${field.id}\u0000${field.label}\u0000${field.type}`;
export function fieldsForResponse(response, fallbackFields) {
    return Array.isArray(response.fieldSnapshots) && response.fieldSnapshots.length ? response.fieldSnapshots : fallbackFields;
}
export function responseFieldColumns(responses, fallbackFields) {
    const columns = new Map(fallbackFields.map(field => [responseFieldKey(field), field]));
    for (const response of responses) {
        for (const field of fieldsForResponse(response, fallbackFields)) {
            const key = responseFieldKey(field);
            if (!columns.has(key)) columns.set(key, field);
        }
    }
    return [...columns.values()];
}
export function answerForResponseField(response, field, fallbackFields) {
    const fields = fieldsForResponse(response, fallbackFields);
    return fields.some(snapshot => responseFieldKey(snapshot) === responseFieldKey(field))
        ? fmtAnswer(response.answers[field.id])
        : '';
}
// Inclusive local-date range check; `from`/`to` are yyyy-mm-dd strings from date inputs.
export function inRange(iso, from, to) {
    const t = new Date(iso).getTime();
    if (from && t < new Date(`${from}T00:00:00`).getTime())
        return false;
    if (to && t > new Date(`${to}T23:59:59.999`).getTime())
        return false;
    return true;
}
export function toCsv(rows) {
    // Prefix formula-looking text so spreadsheets don't execute it (CSV injection).
    const cell = (v) => {
        const s = /^[=+\-@]/.test(v) && !Number.isFinite(Number(v)) ? `'${v}` : v;
        return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return rows.map(r => r.map(cell).join(',')).join('\r\n');
}
export function downloadCsv(name, csv) {
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}
