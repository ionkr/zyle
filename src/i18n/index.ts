/**
 * Zyle i18n module
 *
 * Provides internationalization support for the Zyle library.
 * - Default language: Browser language detection
 * - Fallback language: English
 * - Supported languages: Korean (ko), English (en)
 */

// Re-export types
export type { Locale, Translations, SeverityLevel } from './types';

// Re-export service functions
export {
  initLocale,
  getLocale,
  setLocale,
  onLocaleChange,
  getTranslations,
  getTranslationsForLocale,
  getSupportedLocales,
  t,
  getUITranslations,
  getAITranslations,
  getNetworkTranslations,
  getErrorTranslations,
  getPromptTranslations,
  getSeverityLabel,
} from './i18n-service';

// Re-export locale data for direct access if needed
export { en } from './locales/en';
export { ko } from './locales/ko';
