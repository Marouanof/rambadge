export function resolveDark(theme) {
  const t = (theme || '').toLowerCase();
  if (t === 'dark') return true;
  if (t === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
  return false;
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', resolveDark(theme));
}
