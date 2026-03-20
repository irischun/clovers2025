import { Globe } from 'lucide-react';
import { useLanguage, Language, languageLabels, languageNames } from '@/i18n/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages: Language[] = ['en', 'zh-TW', 'zh-CN'];

const LanguageSwitcher = ({ className = '' }: { className?: string }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-foreground bg-card/85 border-2 border-primary/30 hover:bg-secondary rounded-xl transition-colors duration-300 uppercase tracking-wider shadow-sm ${className}`}
        aria-label="Switch language"
      >
        <Globe className="w-4 h-4 text-primary" />
        <span className="hidden sm:inline">{languageLabels[language]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px] bg-card/95 backdrop-blur-xl border-border/50 rounded-xl shadow-xl">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`gap-3 rounded-lg cursor-pointer ${language === lang ? 'text-primary font-semibold bg-primary/10' : ''}`}
          >
            <span className="font-bold text-sm">{languageLabels[lang]}</span>
            <span className="text-muted-foreground text-sm">{languageNames[lang]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
