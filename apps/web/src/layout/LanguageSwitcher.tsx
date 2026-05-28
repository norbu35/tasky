import { useTranslation } from 'react-i18next';

import { Button } from '../components/ui/button';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const resolvedLanguage = (i18n.resolvedLanguage ?? i18n.language).toLowerCase();
  const isEnglish = resolvedLanguage.startsWith('en');

  const toggleLanguage = () => {
    const newLang = isEnglish ? 'mn' : 'en';
    void i18n.changeLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={`h-7 px-2 flex items-center gap-1.5 text-xs rounded-lg${className ? ` ${className}` : ''}`}
    >
      <span className="text-base leading-none">{isEnglish ? '🇬🇧' : '🇲🇳'}</span>
      <span className="font-semibold">{isEnglish ? 'EN' : 'МН'}</span>
    </Button>
  );
}
