const KEY = 'ff.theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');
export const getTheme = () => {
    try {
        const v = localStorage.getItem(KEY);
        return v === 'light' || v === 'dark' ? v : 'system';
    }
    catch {
        return 'system';
    }
};
export function applyTheme(t) {
    document.documentElement.classList.toggle('dark', t === 'dark' || (t === 'system' && media().matches));
}
export function setTheme(t) {
    try {
        localStorage.setItem(KEY, t);
    }
    catch { /* storage blocked */ }
    applyTheme(t);
}
export function initTheme() {
    applyTheme(getTheme());
    media().addEventListener('change', () => { if (getTheme() === 'system')
        applyTheme('system'); });
}
