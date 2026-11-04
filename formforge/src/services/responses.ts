import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import type { FormResponse } from '../types'

export function useResponses(formId: string) {
  const [state, setState] = useState<{ data: FormResponse[] | null; error: string | null }>({ data: null, error: null })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let live = true
    api.listResponses(formId).then(data => live && setState({ data, error: null })).catch((e: Error) => live && setState({ data: null, error: e.message }))
    return () => { live = false }
  }, [formId, tick])
  const reload = useCallback(() => { setState({ data: null, error: null }); setTick(t => t + 1) }, [])
  const remove = async (rid: string) => {
    await api.deleteResponse(formId, rid)
    setState(s => ({ ...s, data: s.data?.filter(r => r.id !== rid) ?? null }))
  }
  return { ...state, reload, remove }
}

export const fmtAnswer = (a: unknown) => Array.isArray(a) ? a.join(', ') : typeof a === 'boolean' ? (a ? 'Yes' : 'No') : a == null ? '' : String(a)

// Inclusive local-date range check; `from`/`to` are yyyy-mm-dd strings from date inputs.
export function inRange(iso: string, from?: string, to?: string) {
  const t = new Date(iso).getTime()
  if (from && t < new Date(`${from}T00:00:00`).getTime()) return false
  if (to && t > new Date(`${to}T23:59:59.999`).getTime()) return false
  return true
}

export function toCsv(rows: string[][]) {
  // Prefix formula-looking text so spreadsheets don't execute it (CSV injection).
  const cell = (v: string) => {
    const s = /^[=+\-@]/.test(v) && !Number.isFinite(Number(v)) ? `'${v}` : v
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return rows.map(r => r.map(cell).join(',')).join('\r\n')
}

export function downloadCsv(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}
