export interface AppSettings {
  providerId: string;
  model: string;
  apiKey?: string;
  proxyUrl?: string;
  theme?: 'system' | 'light' | 'dark';
  uiLanguage?: 'en' | 'id';
}

const KEY = 'thesis-defense-simulator:settings';

export function loadSettings(): AppSettings | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppSettings;
  } catch {
    return null;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function clearSettings(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(KEY);
}
