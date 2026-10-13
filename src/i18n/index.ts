import { init, register, locale } from 'svelte-i18n';
import { uiLanguage } from '../lib/state/stores';

register('en', () => import('./en.json'));
register('id', () => import('./id.json'));

// Detect browser language (defaulting to en)
function getBrowserLang() {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language.split('-')[0] || 'en';
  return ['en', 'id'].includes(lang) ? lang : 'en';
}

const savedLang = typeof localStorage !== 'undefined'
  ? localStorage.getItem('thesis-defense-simulator:ui-language') || getBrowserLang()
  : 'en';

init({
  fallbackLocale: 'en',
  initialLocale: ['en', 'id'].includes(savedLang) ? savedLang : 'en',
});

// Sync i18n locale with the global store
uiLanguage.subscribe(($locale: string) => {
  if ($locale) {
    locale.set($locale);
  }
});
