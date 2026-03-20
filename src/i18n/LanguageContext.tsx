import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import en from './translations/en';
import zhTW from './translations/zh-TW';
import zhCN from './translations/zh-CN';

export type Language = 'en' | 'zh-TW' | 'zh-CN';

export const languageLabels: Record<Language, string> = {
  'en': 'EN',
  'zh-TW': '繁',
  'zh-CN': '简',
};

export const languageNames: Record<Language, string> = {
  'en': 'English',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
};

type TranslationKey = keyof typeof en;

const translations: Record<Language, Record<string, string>> = {
  en,
  'zh-TW': zhTW,
  'zh-CN': zhCN,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'clovers-language';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'zh-TW';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === 'en' || stored === 'zh-TW' || stored === 'zh-CN')) {
      return stored as Language;
    }
    return 'zh-TW';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    let text = translations[language]?.[key] || translations['zh-TW']?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
