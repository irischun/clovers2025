// Language constants — kept separate from LanguageContext.tsx so that the
// context module only exports React components/hooks and is Fast-Refresh
// compatible (mixing component + non-component exports breaks HMR and can
// cause "useLanguage must be used within a LanguageProvider" after edits).

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
