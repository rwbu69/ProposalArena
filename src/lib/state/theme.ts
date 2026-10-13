import { theme } from './stores';

export type ThemeMode = 'system' | 'light' | 'dark';

let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;

/**
 * Applies the given theme mode by toggling the 'dark' class on <html>.
 */
export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const root = document.documentElement;
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // Clean up any previously attached listener
  if (mediaQueryListener) {
    mediaQuery.removeEventListener('change', mediaQueryListener);
    mediaQueryListener = null;
  }

  if (mode === 'dark') {
    root.classList.add('dark');
  } else if (mode === 'light') {
    root.classList.remove('dark');
  } else {
    // 'system': resolve based on OS preference
    if (mediaQuery.matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Reactively update if system preference changes while in 'system' mode
    mediaQueryListener = (e: MediaQueryListEvent) => {
      if (theme.get() === 'system') {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    mediaQuery.addEventListener('change', mediaQueryListener);
  }
}

/**
 * Initializes theme listener and subscribes to the persistent theme store.
 * Returns an unsubscribe / cleanup function.
 */
export function initTheme(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Apply initial theme from the store
  applyTheme(theme.get());

  // Subscribe to reactive changes in the store
  const unsubscribe = theme.subscribe((currentMode) => {
    applyTheme(currentMode);
  });

  return () => {
    unsubscribe();
    if (mediaQueryListener) {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', mediaQueryListener);
      mediaQueryListener = null;
    }
  };
}
