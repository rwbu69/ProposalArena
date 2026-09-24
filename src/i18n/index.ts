import { init, register } from 'svelte-i18n';
import { uiLanguage } from '../lib/state/stores';

register('en', () => import('./en.json'));
register('id', () => import('./id.json'));

// Detect browser language (defaulting to en)
function getBrowserLang() {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language.split('-')[0] || 'en';
  return ['en', 'id'].includes(lang) ? lang : 'en';
}

init({
  fallbackLocale: 'en',
  initialLocale: getBrowserLang(),
});

// Sync i18n locale with the global store
uiLanguage.subscribe(($locale: string) => {
  if ($locale) {
    import('svelte-i18n').then(({ locale }) => {
      locale.set($locale);
    });
  }
});
