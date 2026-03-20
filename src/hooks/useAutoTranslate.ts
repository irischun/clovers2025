import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage, Language } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

// In-memory cache shared across all hook instances
const translationCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string>>();

function getCacheKey(text: string, targetLang: Language): string {
  return `${targetLang}::${text}`;
}

/**
 * Hook for auto-translating dynamic/user-generated content at runtime.
 * Uses AI translation with aggressive caching for performance.
 * 
 * Usage:
 *   const { translate, autoT } = useAutoTranslate();
 *   const translated = autoT("需要翻譯的文字", "zh-TW"); // auto translates to current language
 */
export function useAutoTranslate() {
  const { language } = useLanguage();

  const translateTexts = useCallback(
    async (
      texts: { key: string; text: string }[],
      sourceLang: Language,
      targetLangs: Language[]
    ): Promise<Record<Language, Record<string, string>>> => {
      try {
        const { data, error } = await supabase.functions.invoke('auto-translate', {
          body: { texts, sourceLang, targetLangs },
        });
        if (error) throw error;
        return data?.translations || {};
      } catch (err) {
        console.error('Auto-translate failed:', err);
        return {} as Record<Language, Record<string, string>>;
      }
    },
    []
  );

  /**
   * Translate a single text string to the user's current language.
   * Returns the original text immediately, then updates when translation is ready.
   */
  const useTranslatedText = (text: string, sourceLang: Language = 'zh-TW'): string => {
    const [translated, setTranslated] = useState<string>(() => {
      if (language === sourceLang) return text;
      const cached = translationCache.get(getCacheKey(text, language));
      return cached || text;
    });

    useEffect(() => {
      if (language === sourceLang || !text) {
        setTranslated(text);
        return;
      }

      const cacheKey = getCacheKey(text, language);
      const cached = translationCache.get(cacheKey);
      if (cached) {
        setTranslated(cached);
        return;
      }

      // Deduplicate in-flight requests
      let promise = pendingRequests.get(cacheKey);
      if (!promise) {
        promise = (async () => {
          try {
            const result = await translateTexts(
              [{ key: 'text', text }],
              sourceLang,
              [language]
            );
            const t = result[language]?.text || text;
            translationCache.set(cacheKey, t);
            return t;
          } catch {
            return text;
          } finally {
            pendingRequests.delete(cacheKey);
          }
        })();
        pendingRequests.set(cacheKey, promise);
      }

      promise.then(setTranslated);
    }, [text, language, sourceLang]);

    return translated;
  };

  /**
   * Batch translate multiple texts. Returns cached results immediately
   * and fetches missing ones in a single API call.
   */
  const batchTranslate = useCallback(
    async (
      items: { key: string; text: string }[],
      sourceLang: Language = 'zh-TW'
    ): Promise<Record<string, string>> => {
      if (language === sourceLang) {
        return Object.fromEntries(items.map((i) => [i.key, i.text]));
      }

      const results: Record<string, string> = {};
      const missing: { key: string; text: string }[] = [];

      for (const item of items) {
        const cached = translationCache.get(getCacheKey(item.text, language));
        if (cached) {
          results[item.key] = cached;
        } else {
          missing.push(item);
        }
      }

      if (missing.length > 0) {
        const translated = await translateTexts(missing, sourceLang, [language]);
        const langResults = translated[language] || {};
        for (const item of missing) {
          const t = langResults[item.key] || item.text;
          translationCache.set(getCacheKey(item.text, language), t);
          results[item.key] = t;
        }
      }

      return results;
    },
    [language, translateTexts]
  );

  return {
    translateTexts,
    useTranslatedText,
    batchTranslate,
    currentLanguage: language,
  };
}

/**
 * Clear the translation cache (useful for testing or memory management)
 */
export function clearTranslationCache() {
  translationCache.clear();
}
