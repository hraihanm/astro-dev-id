import en from './locales/en.json';
import id from './locales/id.json';

const translations: Record<string, any> = {
  en: en.default || en,
  id: id.default || id,
};

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
      if (translation !== `[${key}]`) {
        element.textContent = translation;
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
  
  // Translate page on load
  translatePage(currentLoc);
  
  // Update html lang attribute
  const htmlRoot = document.getElementById('html-root');
  if (htmlRoot) {
    htmlRoot.setAttribute('lang', currentLoc === 'id' ? 'id' : 'en');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}

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

