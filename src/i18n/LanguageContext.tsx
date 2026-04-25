import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import en from './translations/en';
import zhTW from './translations/zh-TW';
import zhCN from './translations/zh-CN';
import { Language, languageLabels, languageNames } from './languages';

// Re-export for backward compatibility with existing imports
export { languageLabels, languageNames };
export type { Language };

type TranslationKey = keyof typeof en;

const translations: Record<Language, Record<string, string>> = {
  en,
  'zh-TW': zhTW,
  'zh-CN': zhCN,
};

// Runtime translation registry for dynamically added keys
const runtimeTranslations: Record<Language, Record<string, string>> = {
  en: {},
  'zh-TW': {},
  'zh-CN': {},
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  registerTranslation: (lang: Language, key: string, value: string) => void;
  registerTranslations: (newTranslations: Record<Language, Record<string, string>>) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'clovers-language';

// Track missing keys in development to help catch untranslated content
const missingKeys = new Set<string>();

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'zh-TW';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === 'en' || stored === 'zh-TW' || stored === 'zh-CN')) {
      return stored as Language;
    }
    return 'zh-TW';
  });

  // Force re-render counter for runtime translation updates
  const [, setUpdateCounter] = useState(0);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    // Check runtime translations first (dynamically added), then static
    let text =
      runtimeTranslations[language]?.[key] ||
      translations[language]?.[key] ||
      runtimeTranslations['zh-TW']?.[key] ||
      translations['zh-TW']?.[key] ||
      key;

    // Dev warning for missing keys
    if (import.meta.env.DEV && text === key && !missingKeys.has(key)) {
      missingKeys.add(key);
      console.warn(`[i18n] Missing translation key: "${key}" for language "${language}"`);
    }

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return text;
  }, [language]);

  /**
   * Register a single translation at runtime (for dynamic content)
   */
  const registerTranslation = useCallback((lang: Language, key: string, value: string) => {
    runtimeTranslations[lang][key] = value;
    setUpdateCounter((c) => c + 1);
  }, []);

  /**
   * Register multiple translations at once (batch)
   */
  const registerTranslations = useCallback(
    (newTranslations: Record<Language, Record<string, string>>) => {
      for (const lang of Object.keys(newTranslations) as Language[]) {
        Object.assign(runtimeTranslations[lang], newTranslations[lang]);
      }
      setUpdateCounter((c) => c + 1);
    },
    []
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, registerTranslation, registerTranslations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
