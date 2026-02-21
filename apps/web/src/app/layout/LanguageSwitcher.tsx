import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === "en" ? "mn" : "en";
        void i18n.changeLanguage(newLang);
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="min-w-16 h-8 px-2 flex items-center gap-1.5"
        >
            <span className="text-xl leading-none pt-0.5">{i18n.language === "en" ? "🇬🇧" : "🇲🇳"}</span>
            <span className="font-semibold">{i18n.language === "en" ? "EN" : "МН"}</span>
        </Button>
    );
}
