import enRaw from './locales/en.json';
import idRaw from './locales/id.json';

// Handle different import formats (some bundlers wrap JSON in default, some don't)
const en = (enRaw as any).default || enRaw;
const id = (idRaw as any).default || idRaw;

const translations: Record<string, any> = {
  en: en,
  id: id,
};

// Debug: log translations in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Translations loaded:', {
    enKeys: Object.keys(en || {}).length,
    idKeys: Object.keys(id || {}).length,
    sampleId: id?.admin?.courses?.editCourse || 'NOT FOUND'
  });
}

let currentLocale: 'en' | 'id' = 'id';

function getCurrentLocale(): 'en' | 'id' {
  return currentLocale;
}

function setLocale(locale: 'en' | 'id'): void {
  currentLocale = locale;
  localStorage.setItem('locale', locale);
}

function t(key: string, locale?: 'en' | 'id'): string {
  const targetLocale = locale || currentLocale;
  const trans = translations[targetLocale] || translations['en'] || {};
  
  // Debug log in development
  if (process.env.NODE_ENV === 'development' && Object.keys(trans).length === 0) {
    console.warn('Translations not loaded for locale:', targetLocale);
  }
  
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
  // Translate text content
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (key && element instanceof HTMLElement) {
      const translation = t(key, locale);
      if (translation && translation !== `[${key}]`) {
        // Simply replace text content - this works for most cases
        element.textContent = translation;
      } else {
        // Debug: log missing translations
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Translation missing for key: ${key}`);
        }
      }
    }
  });
  
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
  // Get saved locale or default
  const savedLocale = localStorage.getItem('locale') as 'en' | 'id' | null;
  const currentLoc = savedLocale || 'id';
  
  // Apply saved locale
  setLocale(currentLoc);
  
  // Update locale switcher
  const switcher = document.getElementById('locale-switcher') as HTMLSelectElement;
  if (switcher) {
    switcher.value = currentLoc;
    switcher.addEventListener('change', (e) => {
      const newLocale = (e.target as HTMLSelectElement).value as 'en' | 'id';
      setLocale(newLocale);
      translatePage(newLocale);
    });
  }
  
  // Translate page on load - with a slight delay to ensure DOM is ready
  setTimeout(() => {
    translatePage(currentLoc);
  }, 0);
  
  // Also translate immediately in case DOM is already ready
  translatePage(currentLoc);
  
  // Update html lang attribute
  const htmlRoot = document.getElementById('html-root');
  if (htmlRoot) {
    htmlRoot.setAttribute('lang', currentLoc === 'id' ? 'id' : 'en');
  }
}

// Initialize when DOM is ready
function startI18n() {
  // Wait a bit to ensure all scripts are loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initI18n, 10);
    });
  } else {
    // DOM already loaded, but wait a tick to ensure everything is ready
    setTimeout(initI18n, 10);
  }
}

startI18n();

// Also try again after a short delay as a fallback
setTimeout(() => {
  const savedLocale = localStorage.getItem('locale') as 'en' | 'id' | null;
  const currentLoc = savedLocale || 'id';
  translatePage(currentLoc);
}, 100);

// Re-translate on navigation (for SPA-like behavior)
const originalPushState = history.pushState;
history.pushState = function(...args) {
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

