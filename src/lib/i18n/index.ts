import type { SupportedLocale, TranslationKey } from './types';

// Lazy load translations to avoid importing in server context
let translations: any = null;
let currentLocale: SupportedLocale = 'id';

export async function loadTranslations(): Promise<any> {
  if (translations) return translations;

  // In SSR/Node environment, we can import both
  const en = await import('./locales/en.json');
  const id = await import('./locales/id.json');
  translations = { en: en.default, id: id.default };

  return translations;
}

export function getCurrentLocale(): SupportedLocale {
  return currentLocale;
}

export function setLocale(locale: SupportedLocale): void {
  currentLocale = locale;
}

export async function getTranslations(locale?: SupportedLocale): Promise<TranslationKey> {
  const targetLocale = locale || currentLocale;
  const trans = await loadTranslations();
  return trans[targetLocale] || trans['en'] || {};
}

export async function t(key: string, locale?: SupportedLocale): Promise<string> {
  const targetLocale = locale || currentLocale;
  const trans = await loadTranslations();
  const translations = trans[targetLocale] || trans['en'] || {};

  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return `[${key}]`; // Return key if translation missing
    }
  }

  return typeof value === 'string' ? value : `[${key}]`;
}

export function formatDate(date: Date, locale?: SupportedLocale): string {
  const targetLocale = locale || currentLocale;
  return new Intl.DateTimeFormat(targetLocale === 'id' ? 'id-ID' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatNumber(num: number, locale?: SupportedLocale): string {
  const targetLocale = locale || currentLocale;
  return new Intl.NumberFormat(targetLocale === 'id' ? 'id-ID' : 'en-US').format(num);
}

