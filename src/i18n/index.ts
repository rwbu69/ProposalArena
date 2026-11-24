import { init, register, locale } from 'svelte-i18n';
import { uiLanguage } from '../lib/state/stores';

register('en', () => import('./en.json'));
register('id', () => import('./id.json'));

// Detect browser language (defaulting to id)
function getBrowserLang() {
  if (typeof navigator === 'undefined') return 'id';
  const lang = navigator.language.split('-')[0] || 'id';
  return ['en', 'id'].includes(lang) ? lang : 'id';
}

const savedLang = typeof localStorage !== 'undefined'
  ? localStorage.getItem('thesis-defense-simulator:ui-language') || getBrowserLang()
  : 'id';

init({
  fallbackLocale: 'id',
  initialLocale: ['en', 'id'].includes(savedLang) ? savedLang : 'id',
});

// Sync i18n locale with the global store
uiLanguage.subscribe(($locale: string) => {
  if ($locale) {
    locale.set($locale);
  }
});
