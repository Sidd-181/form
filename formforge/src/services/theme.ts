// Theme is a per-device preference, so it lives in localStorage rather than on the server.
export type Theme = 'light' | 'dark' | 'system'
const KEY = 'ff.theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

export const getTheme = (): Theme => {
  try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : 'system' } catch { return 'system' }
}
export function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark' || (t === 'system' && media().matches))
}
export function setTheme(t: Theme) {
  try { localStorage.setItem(KEY, t) } catch { /* storage blocked */ }
  applyTheme(t)
}
export function initTheme() {
  applyTheme(getTheme())
  media().addEventListener('change', () => { if (getTheme() === 'system') applyTheme('system') })
}
