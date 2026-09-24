import { persistentAtom } from '@nanostores/persistent';
import { atom } from 'nanostores';

export const uiLanguage = persistentAtom<'en' | 'id'>('thesis-defense-simulator:ui-language', 'en');
export const theme = persistentAtom<'system' | 'light' | 'dark'>('thesis-defense-simulator:theme', 'system');
export const voiceEnabled = persistentAtom<boolean>('thesis-defense-simulator:voice-enabled', false, {
  encode: JSON.stringify,
  decode: JSON.parse
});

export const isInterviewActive = atom<boolean>(false);
export const integrityWarnings = atom<string | null>(null);
export const showSettings = atom<boolean>(false);
