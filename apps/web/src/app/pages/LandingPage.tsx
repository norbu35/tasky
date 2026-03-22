import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Shield, ShieldCheck, Star, CreditCard,
  CheckCircle, Search, Sparkles,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { LanguageSwitcher } from "../layout/LanguageSwitcher";


const CATEGORIES = [
  { icon: "🧹", name: "Гэр цэвэрлэгээ", count: "450+ Taskers" },
  { icon: "🔧", name: "Сантехник", count: "230+ Taskers" },
  { icon: "📦", name: "Нүүлгэлт", count: "180+ Taskers" },
  { icon: "✨", name: "See All", count: "50+ Services" },
];

const TRUST_PILLARS = [
  { id: "verifiedTaskers", icon: ShieldCheck, title: "Verified Taskers", desc: "Every Tasker is identity-verified before joining the platform." },
  { id: "fixedPricing", icon: CreditCard, title: "Fixed Pricing", desc: "Set your budget upfront — no haggling, no surprises." },
  { id: "securePayment", icon: Star, title: "Secure Payment", desc: "Funds are held safely until you confirm the job is done." },
];

const HOW_STEPS = [
  { n: "1", title: "Post your task", desc: "Describe what you need, set a budget, pick a time and location." },
  { n: "2", title: "Choose the best fit", desc: "Review Tasker profiles, ratings, and experience before booking." },
  { n: "3", title: "Pay securely", desc: "Your payment is held in escrow until the job is complete." },
];

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 h-16 sm:px-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-lg font-extrabold font-display text-primary tracking-tight">Tasky</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button size="sm" variant="ghost" className="font-semibold text-sm" onClick={() => navigate("/auth")}>
              {t("auth.login", "Login")}
            </Button>
            <Button size="sm" className="font-semibold shadow-md shadow-primary/20" onClick={() => navigate("/auth")}>
              {t("landing.getStarted", "Get Started")}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-20 pt-20 sm:px-6">
        {/* Hero Section */}
        <section className="py-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-5"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              {t("landing.trustedBy", "Trusted by 10,000+ users in Mongolia")}
            </div>

            <h1 className="text-4xl font-display font-bold leading-tight tracking-tight sm:text-5xl">
              {t("landing.heroTitle1", "Home help you")}{" "}
              <span className="text-primary">{t("landing.heroTitleHighlight", "can trust")}</span>
            </h1>

            <p className="text-base text-muted-foreground max-w-sm mx-auto">
              {t(
                "landing.heroSubtitle",
                "Mongolia's first trust-centric domestic service marketplace. Reliable professionals at your doorstep."
              )}
            </p>

            {/* Search bar */}
            <button
              type="button"
              aria-label={t("landing.searchPlaceholder", "What do you need help with?")}
              onClick={() => navigate("/auth")}
              className="relative mt-6 max-w-sm mx-auto w-full flex items-center gap-2 h-12 rounded-2xl border border-border bg-card shadow-sm px-4 text-sm text-muted-foreground hover:border-primary/50 transition-colors"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span>{t("landing.searchPlaceholder", "What do you need help with?")}</span>
            </button>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="h-12 rounded-2xl px-7 font-semibold shadow-lg shadow-primary/25"
                onClick={() => navigate("/auth")}
              >
                {t("landing.postTaskBtn", "Post a Task")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="h-12 rounded-2xl px-7 font-semibold"
                onClick={() => navigate("/auth")}
              >
                {t("landing.becomeTaskerBtn", "Become a Tasker")}
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Popular Categories */}
        <section className="py-8">
          <h2 className="text-lg font-display font-bold mb-4">
            {t("landing.categoriesTitle", "Popular Categories")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/auth")}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 text-left shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
              >
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-foreground">{cat.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{cat.count}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Why Choose Tasky */}
        <section className="py-8 border-t border-border/50">
          <h2 className="text-lg font-display font-bold mb-6 text-center">
            {t("landing.whyTitle", "Why choose Tasky?")}
          </h2>
          <div className="space-y-4">
            {TRUST_PILLARS.map(({ id, icon: Icon, title, desc }) => (
              <div key={id} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{t(`landing.pillar.${id}`, title)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t(`landing.pillarDesc.${id}`, desc)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it Works */}
        <section className="py-8 border-t border-border/50">
          <h2 className="text-lg font-display font-bold mb-2 text-center">
            {t("landing.howItWorksTitle", "How Tasky Works")}
          </h2>
          <p className="text-xs text-muted-foreground text-center mb-6">
            {t("landing.howItWorksSub", "Simple, secure, and transparent.")}
          </p>
          <div className="space-y-6">
            {HOW_STEPS.map(({ n, title, desc }) => (
              <div key={n} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {n}
                </div>
                <div className="pt-0.5">
                  <div className="text-sm font-semibold">{t(`landing.step${n}Title`, title)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t(`landing.step${n}Desc`, desc)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust Banner */}
        <section className="py-8">
          <div className="rounded-3xl bg-primary p-8 text-center text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 pointer-events-none" />
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-xl font-display font-bold mb-2 relative z-10">
              {t("landing.trustTitle", "Built on Trust & Safety")}
            </h2>
            <p className="text-sm text-primary-foreground/80 mb-6 max-w-xs mx-auto relative z-10">
              {t(
                "landing.trustDesc",
                "Every Tasker is identity-verified. Every payment is protected."
              )}
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="h-12 px-7 rounded-2xl font-bold relative z-10"
              onClick={() => navigate("/auth")}
            >
              {t("landing.joinNow", "Join Tasky Today")}
              <CheckCircle className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 bg-muted/20 py-8 px-4">
        <div className="mx-auto max-w-2xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 opacity-50">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-display font-bold">Tasky</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("auth.copyright", "© 2026 Tasky Network. All rights reserved.")}
          </p>
        </div>
      </footer>
    </div>
  );
}
