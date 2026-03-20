import { useState, useEffect, useCallback } from 'react';
import { useLanguage, Language } from '@/i18n/LanguageContext';
import { translationCacheManager } from '@/i18n/translationCache';

/**
 * Hook for auto-translating dynamic/user-generated content at runtime.
 * Uses persistent caching (localStorage + memory) with intelligent batch queuing.
 * 
 * Usage:
 *   const { translateText, batchTranslate } = useAutoTranslate();
 *   
 *   // Single text
 *   const translated = useAutoTranslatedText("需要翻譯的文字");
 *   
 *   // Batch
 *   const results = await batchTranslate([
 *     { key: "title", text: "標題" },
 *     { key: "desc", text: "描述" },
 *   ]);
 */
export function useAutoTranslate() {
  const { language } = useLanguage();

  /**
   * Translate a single text. Returns a promise.
   */
  const translateText = useCallback(
    async (text: string, sourceLang: Language = 'zh-TW'): Promise<string> => {
      if (!text || language === sourceLang) return text;
      return translationCacheManager.queueTranslation(text, sourceLang, language);
    },
    [language]
  );

  /**
   * Batch translate multiple texts. Returns cached results immediately
   * and fetches missing ones via the batch queue.
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
      const promises: Promise<void>[] = [];

      for (const item of items) {
        const cached = translationCacheManager.get(item.text, language);
        if (cached) {
          results[item.key] = cached;
        } else {
          promises.push(
            translationCacheManager
              .queueTranslation(item.text, sourceLang, language)
              .then((t) => { results[item.key] = t; })
          );
        }
      }

      await Promise.all(promises);
      return results;
    },
    [language]
  );

  return { translateText, batchTranslate, currentLanguage: language };
}

/**
 * Hook that returns the translated version of a text string.
 * Automatically re-translates when language changes.
 */
export function useAutoTranslatedText(text: string, sourceLang: Language = 'zh-TW'): string {
  const { language } = useLanguage();
  
  const [translated, setTranslated] = useState<string>(() => {
    if (!text || language === sourceLang) return text;
    return translationCacheManager.get(text, language) || text;
  });

  useEffect(() => {
    if (!text || language === sourceLang) {
      setTranslated(text);
      return;
    }

    const cached = translationCacheManager.get(text, language);
    if (cached) {
      setTranslated(cached);
      return;
    }

    translationCacheManager.queueTranslation(text, sourceLang, language).then(setTranslated);
  }, [text, language, sourceLang]);

  return translated;
}

/**
 * Clear the translation cache (useful for testing or memory management)
 */
export function clearTranslationCache() {
  translationCacheManager.clear();
}
