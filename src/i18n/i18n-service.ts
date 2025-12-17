import type { Locale, Translations, SeverityLevel } from './types';
import { en } from './locales/en';
import { ko } from './locales/ko';

/**
 * localStorage key for locale setting
 */
const LOCALE_STORAGE_KEY = 'zyle-locale';

/**
 * Available translations
 */
const translations: Record<Locale, Translations> = {
  en,
  ko,
};

/**
 * Fallback locale (English)
 */
const FALLBACK_LOCALE: Locale = 'en';

/**
 * Supported locales
 */
const SUPPORTED_LOCALES: Locale[] = ['ko', 'en'];

/**
 * Current locale
 */
let currentLocale: Locale = FALLBACK_LOCALE;

/**
 * Locale change listeners
 */
const localeChangeListeners: Set<(locale: Locale) => void> = new Set();

/**
 * Check if a locale is supported
 */
function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

/**
 * Detect browser locale
 */
function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') {
    return FALLBACK_LOCALE;
  }

  // Check navigator.language
  const browserLang = navigator.language?.split('-')[0];
  if (browserLang && isValidLocale(browserLang)) {
    return browserLang;
  }

  // Check navigator.languages array
  if (navigator.languages) {
    for (const lang of navigator.languages) {
      const shortLang = lang.split('-')[0];
      if (isValidLocale(shortLang)) {
        return shortLang;
      }
    }
  }

  return FALLBACK_LOCALE;
}

/**
 * Get saved locale from localStorage
 */
function getSavedLocale(): Locale | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && isValidLocale(saved)) {
      return saved;
    }
  } catch {
    // localStorage might be blocked
  }

  return null;
}

/**
 * Save locale to localStorage
 */
function saveLocale(locale: Locale): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage might be blocked
  }
}

/**
 * Initialize locale based on priority:
 * 1. Explicitly set locale (via option)
 * 2. Saved locale in localStorage
 * 3. Browser language detection
 * 4. Fallback to English
 */
export function initLocale(explicitLocale?: Locale | 'auto'): Locale {
  if (explicitLocale && explicitLocale !== 'auto' && isValidLocale(explicitLocale)) {
    currentLocale = explicitLocale;
    saveLocale(currentLocale);
    return currentLocale;
  }

  // Try saved locale first
  const savedLocale = getSavedLocale();
  if (savedLocale) {
    currentLocale = savedLocale;
    return currentLocale;
  }

  // Detect from browser
  currentLocale = detectBrowserLocale();
  return currentLocale;
}

/**
 * Get current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Set locale and notify listeners
 */
export function setLocale(locale: Locale): void {
  if (!isValidLocale(locale)) {
    console.warn(`[Zyle i18n] Invalid locale: ${locale}. Using fallback: ${FALLBACK_LOCALE}`);
    locale = FALLBACK_LOCALE;
  }

  if (currentLocale !== locale) {
    currentLocale = locale;
    saveLocale(locale);

    // Notify listeners
    localeChangeListeners.forEach((listener) => {
      try {
        listener(locale);
      } catch (e) {
        console.error('[Zyle i18n] Error in locale change listener:', e);
      }
    });
  }
}

/**
 * Add locale change listener
 */
export function onLocaleChange(listener: (locale: Locale) => void): () => void {
  localeChangeListeners.add(listener);
  return () => {
    localeChangeListeners.delete(listener);
  };
}

/**
 * Get all translations for current locale
 */
export function getTranslations(): Translations {
  return translations[currentLocale] || translations[FALLBACK_LOCALE];
}

/**
 * Get translations for a specific locale
 */
export function getTranslationsForLocale(locale: Locale): Translations {
  return translations[locale] || translations[FALLBACK_LOCALE];
}

/**
 * Get supported locales
 */
export function getSupportedLocales(): Locale[] {
  return [...SUPPORTED_LOCALES];
}

/**
 * Translation helper - get nested value from translation object
 */
type TranslationPath = string;

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return typeof result === 'string' ? result : undefined;
}

/**
 * Translate a key with optional parameter interpolation
 * @param key - Dot-notation path to translation (e.g., 'ui.buttons.save')
 * @param params - Optional parameters for interpolation (e.g., { count: '5' })
 */
export function t(key: TranslationPath, params?: Record<string, string | number>): string {
  const trans = getTranslations();
  let value = getNestedValue(trans as unknown as Record<string, unknown>, key);

  // Fallback to English if not found
  if (value === undefined && currentLocale !== FALLBACK_LOCALE) {
    value = getNestedValue(translations[FALLBACK_LOCALE] as unknown as Record<string, unknown>, key);
  }

  // Return key if translation not found
  if (value === undefined) {
    console.warn(`[Zyle i18n] Translation not found: ${key}`);
    return key;
  }

  // Interpolate parameters
  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      value = value!.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
    });
  }

  return value;
}

/**
 * Convenience getters for commonly used translation sections
 */
export function getUITranslations() {
  return getTranslations().ui;
}

export function getAITranslations() {
  return getTranslations().ai;
}

export function getNetworkTranslations() {
  return getTranslations().network;
}

export function getErrorTranslations() {
  return getTranslations().errors;
}

export function getPromptTranslations() {
  return getTranslations().prompt;
}

/**
 * Get severity label for current locale
 */
export function getSeverityLabel(severity: SeverityLevel): string {
  return getTranslations().ui.severity[severity];
}
