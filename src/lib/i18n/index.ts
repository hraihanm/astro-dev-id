import type { SupportedLocale, TranslationKey } from './types';

// Lazy load translations to avoid importing in server context
let translations: any = null;
let currentLocale: SupportedLocale = 'id';

export async function loadTranslations(): Promise<any> {
  if (translations) return translations;
  
  if (typeof window !== 'undefined') {
    // Browser - dynamic import
    const localeModule = currentLocale === 'id' 
      ? await import('./locales/id.json') 
      : await import('./locales/en.json');
    translations = { [currentLocale]: localeModule.default };
  } else {
    // Server - direct import
    const en = await import('./locales/en.json');
    const id = await import('./locales/id.json');
    translations = { en: en.default, id: id.default };
  }
  
  return translations;
}

export function getCurrentLocale(): SupportedLocale {
  return currentLocale;
}

export function setLocale(locale: SupportedLocale): void {
  currentLocale = locale;
  // Store in localStorage for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);
  }
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

// Initialize locale from localStorage on client
if (typeof window !== 'undefined') {
  const savedLocale = localStorage.getItem('locale') as SupportedLocale;
  if (savedLocale && (savedLocale === 'en' || savedLocale === 'id')) {
    currentLocale = savedLocale;
  } else {
    // Default to Indonesian if no saved preference
    currentLocale = 'id';
  }
}

