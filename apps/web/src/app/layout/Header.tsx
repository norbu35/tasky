import { Shield } from "lucide-react";
import { Button } from "../../components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAppContext } from "../context/AppContext";
import { useTranslation } from "react-i18next";

export function Header() {
  const { profile, signOut } = useAppContext();
  const { t } = useTranslation();

  return (
    <header aria-label="Site header" className="fixed left-0 right-0 top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 h-16 sm:px-6">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-lg font-extrabold font-display text-primary tracking-tight">
            Tasky
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {profile && (
            <Button variant="ghost" size="sm" className="text-xs font-semibold" onClick={signOut}>
              {t("nav.logout", "Sign out")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
