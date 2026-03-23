import { Shield, User } from "lucide-react";
import { Button } from "../../components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAppContext } from "../context/AppContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function Header() {
  const { profile, signOut } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed left-4 right-4 sm:left-auto sm:right-auto sm:top-6 sm:w-[calc(100%-3rem)] sm:max-w-5xl sm:mx-auto top-4 z-50 rounded-2xl border border-border/40 bg-background/70 backdrop-blur-xl shadow-lg shadow-black/5"
    >
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16">
        {/* Logo */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-deep to-primary flex items-center justify-center text-primary-foreground shadow-sm group-hover:shadow-md transition-all">
            <Shield className="w-4 h-4" strokeWidth={3} />
          </div>
          <span className="text-xl font-extrabold font-display tracking-tight text-foreground">
            Tasky
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          
          <div className="w-[1px] h-6 bg-border/50 hidden sm:block mx-1"></div>

          {profile ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hidden sm:flex text-sm font-medium h-9 px-4 rounded-xl text-muted-foreground hover:text-foreground" onClick={() => navigate("/dashboard")}>
                <User className="w-4 h-4 mr-2" />
                {t("nav.profile", "Profile")}
              </Button>
              <Button variant="secondary" size="sm" className="text-sm font-semibold h-9 px-4 rounded-xl" onClick={signOut}>
                {t("nav.logout", "Sign out")}
              </Button>
            </div>
          ) : (
            <Button 
              className="text-sm font-semibold h-9 px-5 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-sm" 
              onClick={() => navigate("/auth")}
            >
              {t("auth.login", "Login")}
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
