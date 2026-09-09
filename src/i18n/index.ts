import { init, register } from 'svelte-i18n';
import { uiLanguage } from '../lib/state/stores';

register('en', () => import('./en.json'));
register('id', () => import('./id.json'));

init({
  fallbackLocale: 'en',
  initialLocale: 'en',
});

// Sync i18n locale with the global store
uiLanguage.subscribe(($locale: string) => {
  if ($locale) {
    import('svelte-i18n').then(({ locale }) => {
      locale.set($locale);
    });
  }
});
