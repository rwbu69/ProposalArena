import { persistentAtom } from '@nanostores/persistent';
import { atom } from 'nanostores';

export const uiLanguage = persistentAtom<'en' | 'id'>('thesis-defense-simulator:ui-language', 'en');
export const theme = persistentAtom<'system' | 'light' | 'dark'>('thesis-defense-simulator:theme', 'system');
export const isInterviewActive = atom<boolean>(false);
