import {useTranslation} from "react-i18next";
import {Button} from "../../components/ui/button";

export function LanguageSwitcher() {
    const {i18n} = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === "en" ? "mn" : "en";
        void i18n.changeLanguage(newLang);
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="w-12 h-8 px-2"
        >
            {i18n.language === "en" ? "EN" : "MN"}
        </Button>
    );
}
