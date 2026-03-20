import { useState, useEffect, memo } from 'react';
import { useLanguage, Language } from '@/i18n/LanguageContext';
import { translationCacheManager } from '@/i18n/translationCache';

interface TranslatedTextProps {
  /** The text to translate */
  text: string;
  /** Source language of the text (defaults to 'zh-TW') */
  sourceLang?: Language;
  /** Optional className for the wrapper span */
  className?: string;
  /** Render as a specific HTML element (defaults to span) */
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'li' | 'label';
}

/**
 * Drop-in component that automatically translates any text to the user's chosen language.
 * Uses persistent caching (localStorage + memory) for instant repeat loads.
 * 
 * Usage:
 *   <TranslatedText text="需要翻譯的文字" />
 *   <TranslatedText text="Hello world" sourceLang="en" />
 *   <TranslatedText text="動態內容" as="p" className="text-sm" />
 */
const TranslatedText = memo(({ text, sourceLang = 'zh-TW', className, as: Element = 'span' }: TranslatedTextProps) => {
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

    // Queue for batch translation
    translationCacheManager.queueTranslation(text, sourceLang, language).then((result) => {
      setTranslated(result);
    });
  }, [text, language, sourceLang]);

  return <Element className={className}>{translated}</Element>;
});

TranslatedText.displayName = 'TranslatedText';

export default TranslatedText;
