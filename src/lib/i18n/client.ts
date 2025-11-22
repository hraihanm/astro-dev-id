import enRaw from './locales/en.json';
import idRaw from './locales/id.json';

// Handle different import formats (some bundlers wrap JSON in default, some don't)
const en = (enRaw as any).default || enRaw;
const id = (idRaw as any).default || idRaw;

const translations: Record<string, any> = {
  en: en,
  id: id,
};

// Debug log translations on load
console.log('=== I18N MODULE LOADED ===');
console.log('EN translations keys:', Object.keys(en || {}).length);
console.log('ID translations keys:', Object.keys(id || {}).length);
console.log('Sample EN admin.courses.editCourse:', en?.['admin.courses']?.editCourse);
console.log('Sample ID admin.courses.editCourse:', id?.['admin.courses']?.editCourse);

let currentLocale: 'en' | 'id' = 'id';

function getCurrentLocale(): 'en' | 'id' {
  return currentLocale;
}

function setLocale(locale: 'en' | 'id'): void {
  currentLocale = locale;
  localStorage.setItem('locale', locale);
  document.cookie = `locale=${locale}; path=/; max-age=31536000`; // 1 year
}

function t(key: string, locale?: 'en' | 'id'): string {
  const targetLocale = locale || currentLocale;
  const trans = translations[targetLocale] || translations['en'] || {};

  const keys = key.split('.');
  let value: any = trans;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return `[${key}]`;
    }
  }

  return typeof value === 'string' ? value : `[${key}]`;
}

function translatePage(locale: 'en' | 'id') {
  console.log(`Translating page to: ${locale}`);

  // Translate text content
  const elements = document.querySelectorAll('[data-i18n]');
  console.log(`Found ${elements.length} elements with data-i18n`);

  let translatedCount = 0;
  let failedCount = 0;

  elements.forEach((element, index) => {
    const key = element.getAttribute('data-i18n');
    if (key && element instanceof HTMLElement) {
      const translation = t(key, locale);
      if (translation && translation !== `[${key}]`) {
        const oldText = element.textContent?.substring(0, 30);
        element.textContent = translation;
        translatedCount++;
        if (index < 3) { // Log first 3 for debugging
          console.log(`  [${index}] "${key}": "${oldText}..." -> "${translation.substring(0, 30)}..."`);
        }
      } else {
        failedCount++;
        if (index < 3) {
          console.warn(`  [${index}] Failed to translate "${key}"`);
        }
      }
    }
  });

  console.log(`Translation complete: ${translatedCount} succeeded, ${failedCount} failed`);

  // Translate placeholders
  const inputs = document.querySelectorAll('[data-i18n-placeholder]');

  inputs.forEach((element) => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (key && element instanceof HTMLInputElement) {
      const translation = t(key, locale);
      if (translation !== `[${key}]`) {
        element.placeholder = translation;
      }
    }
  });

  // Update html lang attribute
  const htmlRoot = document.getElementById('html-root');
  if (htmlRoot) {
    htmlRoot.setAttribute('lang', locale === 'id' ? 'id' : 'en');
  }
}

function initI18n() {
  console.log('=== INIT I18N ===');

  // Get saved locale or default
  const savedLocale = localStorage.getItem('locale') as 'en' | 'id' | null;
  const currentLoc = savedLocale || 'id';

  console.log('Initializing with locale:', currentLoc);
  console.log('Translations available:', Object.keys(translations));

  // Apply saved locale
  setLocale(currentLoc);

  // Translate page on load - multiple attempts to handle timing
  function applyInitialTranslations() {
    console.log('Applying translations for locale:', currentLoc);
    translatePage(currentLoc);
  }

  // Apply immediately
  applyInitialTranslations();

  // Apply after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyInitialTranslations);
  } else {
    // DOM already ready, apply again
    setTimeout(applyInitialTranslations, 10);
  }

  // Apply multiple times to ensure translations stick
  setTimeout(applyInitialTranslations, 100);
  setTimeout(applyInitialTranslations, 300);
  setTimeout(applyInitialTranslations, 500);

  // Update html lang attribute
  const htmlRoot = document.getElementById('html-root');
  if (htmlRoot) {
    htmlRoot.setAttribute('lang', currentLoc === 'id' ? 'id' : 'en');
  }

  console.log('Init complete');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}

// Re-translate on navigation (for SPA-like behavior)
const originalPushState = history.pushState;
history.pushState = function (...args) {
  originalPushState.apply(history, args);
  setTimeout(() => {
    translatePage(getCurrentLocale());
  }, 100);
};

window.addEventListener('popstate', () => {
  setTimeout(() => {
    translatePage(getCurrentLocale());
  }, 100);
});

