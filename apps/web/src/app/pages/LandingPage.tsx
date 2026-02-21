import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, Shield, ShieldCheck, MapPin, CreditCard, Star } from "lucide-react";
import { Button } from "../../components/ui/button";
import { LanguageSwitcher } from "../layout/LanguageSwitcher";

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-2xl font-display font-bold tracking-tight">Tasky</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="ghost" className="hidden sm:inline-flex font-semibold" onClick={() => navigate("/auth")}>
              {t("auth.login", "Login")}
            </Button>
            <Button className="font-semibold shadow-lg shadow-primary/20" onClick={() => navigate("/auth")}>
              {t("landing.getStarted", "Get Started")}
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative px-6 py-20 lg:py-32 overflow-hidden flex flex-col items-center text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>{t("landing.trustedBy", "Trusted by 10,000+ users in Mongolia")}</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.1]">
              {t("landing.heroTitle1", "Find trusted help for")}{" "}
              <span className="text-primary">{t("landing.heroTitleHighlight", "everyday tasks")}</span>
              <br className="hidden sm:block" /> {t("landing.heroTitle2", "quickly and securely.")}
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              {t("landing.heroSubtitle", "Whether you need someone to run errands, deep clean your apartment, or fix a leaky pipe—Tasky connects you with verified local workers instantly.")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold shadow-xl shadow-primary/20 hover:scale-105 transition-all" onClick={() => navigate("/auth")}>
                {t("landing.postTaskBtn", "Post a Task Now")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border border-input hover:bg-secondary/50" onClick={() => navigate("/auth")}>
                {t("landing.becomeTaskerBtn", "Become a Tasker")}
              </Button>
            </div>
          </motion.div>
        </section>

        {/* How it Works Section */}
        <section className="px-6 py-24 bg-muted/30 border-y border-border/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">{t("landing.howItWorksTitle", "How Tasky Works")}</h2>
              <p className="text-lg text-muted-foreground">{t("landing.howItWorksSub", "Simple, secure, and transparent for everyone.")}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-16">
              {/* Customer Flow */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold text-primary">{t("landing.forCustomers", "For Customers")}</h3>
                  <p className="text-muted-foreground">{t("landing.customerDesc", "Get your to-do list done in a few clicks.")}</p>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">1</div>
                    <div>
                      <h4 className="text-lg font-bold mb-1 flex items-center gap-2"><MapPin className="w-5 h-5 text-muted-foreground" /> {t("landing.cStep1Title", "Post your requirements")}</h4>
                      <p className="text-muted-foreground">{t("landing.cStep1Desc", "Describe what you need done, set your budget, and choose a time & location.")}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">2</div>
                    <div>
                      <h4 className="text-lg font-bold mb-1 flex items-center gap-2"><Star className="w-5 h-5 text-muted-foreground" /> {t("landing.cStep2Title", "Choose the best fit")}</h4>
                      <p className="text-muted-foreground">{t("landing.cStep2Desc", "Review profiles, ratings, and past work of interested Taskers before hiring.")}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">3</div>
                    <div>
                      <h4 className="text-lg font-bold mb-1 flex items-center gap-2"><Shield className="w-5 h-5 text-muted-foreground" /> {t("landing.cStep3Title", "Pay securely")}</h4>
                      <p className="text-muted-foreground">{t("landing.cStep3Desc", "Your money is held safely in escrow until the job is completed to your satisfaction.")}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tasker Flow */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold text-accent">{t("landing.forTaskers", "For Taskers")}</h3>
                  <p className="text-muted-foreground">{t("landing.taskerDesc", "Find flexible work and earn securely.")}</p>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent font-bold text-lg">1</div>
                    <div>
                      <h4 className="text-lg font-bold mb-1 flex items-center gap-2"><MapPin className="w-5 h-5 text-muted-foreground" /> {t("landing.tStep1Title", "Find local jobs")}</h4>
                      <p className="text-muted-foreground">{t("landing.tStep1Desc", "Browse a live feed of tasks near you that match your skills.")}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent font-bold text-lg">2</div>
                    <div>
                      <h4 className="text-lg font-bold mb-1 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-muted-foreground" /> {t("landing.tStep2Title", "Send proposals")}</h4>
                      <p className="text-muted-foreground">{t("landing.tStep2Desc", "Apply to tasks you want to do with a quick message to the customer.")}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent font-bold text-lg">3</div>
                    <div>
                      <h4 className="text-lg font-bold mb-1 flex items-center gap-2"><CreditCard className="w-5 h-5 text-muted-foreground" /> {t("landing.tStep3Title", "Guaranteed payment")}</h4>
                      <p className="text-muted-foreground">{t("landing.tStep3Desc", "Focus on the work knowing that the customer has already funded the task.")}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trust & Safety Banner */}
        <section className="px-6 py-24">
          <div className="max-w-4xl mx-auto bg-primary text-primary-foreground rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-white/5" />
            <ShieldCheck className="w-16 h-16 mx-auto mb-6 text-accent" />
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 relative z-10">{t("landing.trustTitle", "Built on Trust & Safety")}</h2>
            <p className="text-lg text-primary-foreground/80 font-medium mb-8 max-w-2xl mx-auto relative z-10">
              {t("landing.trustDesc", "Every Tasker is identity-verified. Every payment is protected. Support is available whenever you need it.")}
            </p>
            <Button variant="secondary" size="lg" className="h-14 px-8 text-lg font-bold relative z-10" onClick={() => navigate("/auth")}>
              {t("landing.joinNow", "Join Tasky Today")}
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 bg-muted/20 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Shield className="w-6 h-6" />
            <span className="font-display font-bold">Tasky</span>
          </div>
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            {t("auth.copyright", "© 2026 Tasky Network. All rights reserved.")}
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="#" className="hover:text-foreground transition-colors">{t("landing.privacy", "Privacy")}</Link>
            <Link to="#" className="hover:text-foreground transition-colors">{t("landing.terms", "Terms")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
