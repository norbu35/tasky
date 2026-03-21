import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, Shield, ShieldCheck, MapPin, Star, Sparkles, Hammer, Truck, Wrench, Download, Smartphone, BadgeCheck, Banknote, Facebook, Twitter, Instagram, GraduationCap } from "lucide-react";
import { Button } from "../../components/ui/button";
import { LanguageSwitcher } from "../layout/LanguageSwitcher";
import { CustomerAdvantageVisual, TaskerAdvantageVisual } from "../../components/landing/ComparisonVisuals";

interface SampleTask {
  title: string;
  price: string;
  district: string;
  category: "cleaning" | "repair" | "moving" | "electric" | "childcare";
}

const CATEGORY_COLORS: Record<SampleTask["category"], string> = {
  cleaning: "bg-accent",
  repair: "bg-secondary",
  moving: "bg-trust",
  electric: "bg-primary",
  childcare: "bg-verified",
};

const SAMPLE_TASKS: SampleTask[] = [
  { title: "Deep clean 2-bedroom apartment", price: "₮65,000", district: "Bayangol", category: "cleaning" },
  { title: "Fix bathroom pipe leak", price: "₮40,000", district: "Sukhbaatar", category: "repair" },
  { title: "Move studio to 1-bedroom", price: "₮85,000", district: "Chingeltei", category: "moving" },
  { title: "Install ceiling light fixtures", price: "₮30,000", district: "Khan-Uul", category: "electric" },
  { title: "Weekly apartment cleaning", price: "₮45,000", district: "Bayanzurkh", category: "cleaning" },
  { title: "Assemble IKEA furniture", price: "₮25,000", district: "Sukhbaatar", category: "repair" },
  { title: "Move office — 3 rooms", price: "₮120,000", district: "Songinokhairkhan", category: "moving" },
  { title: "Babysitter for 2 children (4hrs)", price: "₮35,000", district: "Khan-Uul", category: "childcare" },
];

function AnimatedTaskFeed() {
  const [visibleStart, setVisibleStart] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleStart((prev) => (prev + 1) % SAMPLE_TASKS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const visibleTasks = Array.from({ length: 3 }, (_, i) => {
    const index = (visibleStart + i) % SAMPLE_TASKS.length;
    return { ...SAMPLE_TASKS[index], index };
  });

  return (
    <div className="space-y-3 w-full">
      <AnimatePresence mode="popLayout">
        {visibleTasks.map((task) => (
          <motion.div
            key={`${task.title}-${task.index}`}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-4"
          >
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${CATEGORY_COLORS[task.category]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{task.title}</p>
              <p className="text-xs text-white/50">{task.price} · {task.district}</p>
            </div>
            <span className="text-[10px] font-bold bg-verified text-white px-2 py-1 rounded flex-shrink-0">
              Verified
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-sans selection:bg-accent/20">
      {/* Header — transparent over dark hero */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-accent" />
            <span className="text-2xl font-display font-bold tracking-tight text-primary-foreground">Tasky</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="ghost" className="hidden sm:inline-flex font-semibold text-primary-foreground/70 hover:text-primary-foreground" onClick={() => navigate("/auth")}>
              {t("auth.login", "Login")}
            </Button>
            <Button className="font-semibold bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/auth")}>
              {t("landing.getStarted", "Get Started")}
            </Button>
          </div>
        </div>
      </header>

      <main className="pb-20">
        {/* Hero Section — Dark Teal */}
        <section className="relative min-h-screen flex items-center bg-gradient-to-br from-primary-deep via-primary to-primary-deep overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 py-32 lg:py-0 w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-accent font-semibold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>{t("landing.trustedBy", "Trusted by 10,000+ users in Mongolia")}</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.05] text-primary-foreground">
                {t("landing.heroTitle1", "Trusted help,")}<br />
                {t("landing.heroTitle2", "fixed price.")}
              </h1>

              <p className="text-lg text-primary-foreground/60 max-w-lg mx-auto lg:mx-0">
                {t("landing.heroSubtitle", "ID-verified workers. Upfront budgets. Dispute protection built in.")}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl shadow-accent/20" onClick={() => navigate("/auth")}>
                  {t("landing.postTaskBtn", "Post a Task")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="ghost" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold text-primary-foreground/80 border border-white/20 hover:bg-white/5 hover:text-primary-foreground" onClick={() => navigate("/auth")}>
                  {t("landing.becomeTaskerBtn", "Become a Tasker")}
                </Button>
              </div>

              {/* Mobile task feed */}
              <div className="lg:hidden pt-8">
                <AnimatedTaskFeed />
              </div>
            </motion.div>

            {/* Right — Animated Task Feed */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="hidden lg:block"
            >
              <AnimatedTaskFeed />
            </motion.div>
          </div>
        </section>

        {/* Featured Services: Bento Grid (Figma Port) */}
        <section className="py-24 bg-muted border-t border-border/40 relative z-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="max-w-xl">
                <h2 className="text-4xl font-black text-foreground tracking-tighter mb-4 uppercase">{t("landing.featuredServices", "Featured Services")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("landing.featuredDesc", "Curated professional tiers designed for the most demanding standards.")}</p>
              </div>
              <div className="h-[2px] flex-grow mx-12 bg-border opacity-30 hidden md:block"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Premium Cleaning */}
              <div className="md:col-span-2 group relative overflow-hidden rounded-xl aspect-[16/9] md:aspect-auto md:h-[500px] bg-card transition-all hover:shadow-2xl cursor-pointer" onClick={() => navigate("/auth")}>
                <img alt="Professional cleaning service" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="/images/feat-cleaning.png"/>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 sm:p-10 w-full">
                  <h3 className="text-3xl font-bold text-primary-foreground mb-2">{t("landing.featCleaning", "Premium Cleaning")}</h3>
                  <p className="text-primary-foreground/80 max-w-sm mb-6">{t("landing.featCleaningDesc", "Meticulous residential and commercial maintenance following international hygiene protocols.")}</p>
                  <span className="text-accent font-bold tracking-widest uppercase text-sm flex items-center gap-2">
                      {t("landing.exploreService", "Explore Service")} <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Educational Childcare */}
              <div className="group relative overflow-hidden rounded-xl bg-card hover:shadow-2xl transition-all cursor-pointer border border-border/50" onClick={() => navigate("/auth")}>
                <div className="p-8 sm:p-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-8">
                      <GraduationCap className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">{t("landing.featChildcare", "Educational Childcare")}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-8">{t("landing.featChildcareDesc", "Heritage-based learning environments combined with modern pedagogical excellence.")}</p>
                  </div>
                  <img alt="Childcare education" className="w-full h-48 object-cover rounded-lg" src="/images/feat-childcare.png"/>
                </div>
              </div>

              {/* Technical Maintenance */}
              <div className="group relative overflow-hidden rounded-xl bg-primary text-primary-foreground hover:shadow-2xl transition-all cursor-pointer" onClick={() => navigate("/auth")}>
                <div className="p-8 sm:p-10">
                  <Wrench className="w-10 h-10 mb-6 text-accent" />
                  <h3 className="text-2xl font-bold mb-4">{t("landing.featTechnical", "Technical Maintenance")}</h3>
                  <p className="text-primary-foreground/80 text-sm leading-relaxed mb-10">{t("landing.featTechnicalDesc", "Certified technicians specializing in HVAC, plumbing, and precision infrastructure care.")}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-primary-deep rounded-full text-[10px] font-bold uppercase tracking-wider">{t("landing.tagHVAC", "HVAC Certified")}</span>
                    <span className="px-3 py-1 bg-primary-deep rounded-full text-[10px] font-bold uppercase tracking-wider">{t("landing.tagElectrical", "Electrical Tier 1")}</span>
                  </div>
                </div>
              </div>

              {/* Cultural Logistics */}
              <div className="md:col-span-2 group relative overflow-hidden rounded-xl bg-card border border-border/50 text-foreground hover:shadow-2xl transition-all cursor-pointer" onClick={() => navigate("/auth")}>
                <div className="p-8 sm:p-10 grid md:grid-cols-2 gap-8 items-center h-full">
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter uppercase mb-4">{t("landing.featLogistics", "Cultural Logistics")}</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">{t("landing.featLogisticsDesc", "Specialized relocation and event management that honors Mongolian traditions with modern efficiency.")}</p>
                    <Button className="px-6 py-5 bg-secondary text-secondary-foreground font-bold rounded-md hover:bg-secondary/90" onClick={(e) => { e.stopPropagation(); navigate("/auth"); }}>
                      {t("landing.requestConsultation", "Request Consultation")}
                    </Button>
                  </div>
                  <div className="relative h-full flex items-center">
                    <div className="absolute -inset-4 bg-secondary/5 blur-3xl rounded-full"></div>
                    <img alt="Logistics management" className="relative z-10 w-full h-48 md:h-56 object-cover rounded-lg grayscale hover:grayscale-0 transition-all duration-500" src="/images/feat-logistics.png"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="px-6 py-24 bg-gradient-to-b from-transparent to-muted/20 border-t border-border/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 relative">
              <div className="absolute md:-top-8 md:right-[20%] w-8 h-8 rounded-full bg-trust/20 blur-sm animate-bounce" style={{ animationDuration: '3s' }} />
              <div className="absolute -bottom-8 md:left-[20%] w-4 h-4 rounded-sm bg-primary/20 rotate-45" />
              <h2 className="text-3xl sm:text-5xl font-display font-bold mb-6 tracking-tight relative inline-block">
                {t("landing.howItWorksTitle", "How Tasky Works")}
                <div className="absolute -right-6 -top-2 w-3 h-3 rounded-full bg-accent" />
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">{t("landing.howItWorksSub", "A simple, secure, and transparent ecosystem designed to bridge trust between customers and vetted professionals.")}</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
              {/* Customer Flow */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-xl shadow-primary/5 border border-primary/10 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-0" />
                <div className="relative z-10 space-y-3 mb-8">
                  <h3 className="text-3xl font-display font-bold text-primary-deep">{t("landing.forCustomers", "For Customers")}</h3>
                  <p className="text-muted-foreground text-lg">{t("landing.customerDesc", "Get your to-do list done securely.")}</p>
                </div>

                <div className="relative z-10">
                  <CustomerAdvantageVisual />
                </div>

                <div className="space-y-8 relative z-10">
                  <div className="flex gap-5 group">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white shadow-sm">1</div>
                    <div className="pt-1">
                      <h4 className="text-xl font-bold mb-2 font-display">{t("landing.cStep1Title", "Post your requirements")}</h4>
                      <p className="text-muted-foreground leading-relaxed">{t("landing.cStep1Desc", "Describe what you need done, set your budget, and choose a time & location.")}</p>
                    </div>
                  </div>
                  <div className="flex gap-5 group">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white shadow-sm">2</div>
                    <div className="pt-1">
                      <h4 className="text-xl font-bold mb-2 font-display">{t("landing.cStep2Title", "Choose the best fit")}</h4>
                      <p className="text-muted-foreground leading-relaxed">{t("landing.cStep2Desc", "Review profiles, ratings, and past work of interested Taskers before hiring.")}</p>
                    </div>
                  </div>
                  <div className="flex gap-5 group">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white shadow-sm">3</div>
                    <div className="pt-1">
                      <h4 className="text-xl font-bold mb-2 font-display">{t("landing.cStep3Title", "Pay securely")}</h4>
                      <p className="text-muted-foreground leading-relaxed">{t("landing.cStep3Desc", "Your money is held safely in escrow until the job is completed to your satisfaction.")}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tasker Flow */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-xl shadow-secondary/5 border border-secondary/20 relative overflow-hidden lg:mt-12"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-bl-[100px] -z-0" />
                <div className="relative z-10 space-y-3 mb-8">
                  <h3 className="text-3xl font-display font-bold text-secondary">{t("landing.forTaskers", "For Taskers")}</h3>
                  <p className="text-muted-foreground text-lg">{t("landing.taskerDesc", "Find flexible work and earn securely.")}</p>
                </div>

                <div className="relative z-10">
                  <TaskerAdvantageVisual />
                </div>

                <div className="space-y-8 relative z-10">
                  <div className="flex gap-5 group">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-secondary group-hover:text-white shadow-sm">1</div>
                    <div className="pt-1">
                      <h4 className="text-xl font-bold mb-2 font-display">{t("landing.tStep1Title", "Find local jobs")}</h4>
                      <p className="text-muted-foreground leading-relaxed">{t("landing.tStep1Desc", "Browse a live feed of tasks near you that match your skills.")}</p>
                    </div>
                  </div>
                  <div className="flex gap-5 group">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-secondary group-hover:text-white shadow-sm">2</div>
                    <div className="pt-1">
                      <h4 className="text-xl font-bold mb-2 font-display">{t("landing.tStep2Title", "Send proposals")}</h4>
                      <p className="text-muted-foreground leading-relaxed">{t("landing.tStep2Desc", "Apply to tasks you want to do with a quick message to the customer.")}</p>
                    </div>
                  </div>
                  <div className="flex gap-5 group">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-secondary group-hover:text-white shadow-sm">3</div>
                    <div className="pt-1">
                      <h4 className="text-xl font-bold mb-2 font-display">{t("landing.tStep3Title", "Guaranteed payment")}</h4>
                      <p className="text-muted-foreground leading-relaxed">{t("landing.tStep3Desc", "Focus on the work knowing that the customer has already funded the task.")}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trust & Safety Section */}
        <section className="px-6 py-24 bg-card border-t border-border/30 relative overflow-hidden">
          {/* Decorative flair */}
          <div className="absolute top-20 left-10 w-48 h-48 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-primary/5 rounded-[3rem] rotate-12 blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16 relative">
              <div className="relative inline-block">
                <ShieldCheck className="w-16 h-16 mx-auto mb-6 text-trust relative z-10" />
                <div className="absolute top-2 left-1/2 -translate-x-4 w-12 h-12 bg-trust/20 rounded-full blur-md" />
                <div className="absolute -bottom-2 -right-4 w-4 h-4 bg-primary/30 rounded-full" />
              </div>
              <h2 className="text-3xl sm:text-5xl font-display font-bold mb-4">{t("landing.trustTitle", "Built on Trust & Local Safety")}</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t("landing.trustDesc", "We've reinvented the domestic service experience so you never have to guess who is showing up at your door.")}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Identity Verified */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <BadgeCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold font-display">{t("landing.trustId", "Identity Verified")}</h3>
                <p className="text-muted-foreground">{t("landing.trustIdDesc", "Every Tasker passes a strict manual ID & Selfie verification before they can accept tasks.")}</p>
              </div>

              {/* Zero Hidden Fees */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent">
                  <Banknote className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold font-display">{t("landing.trustFees", "Zero Platform Fees")}</h3>
                <p className="text-muted-foreground">{t("landing.trustFeesDesc", "You pay your Tasker directly. No hidden service charges or surprise middleman fees.")}</p>
              </div>

              {/* Reputation & Support */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary-deep/10 rounded-full flex items-center justify-center mx-auto text-primary-deep">
                  <Star className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold font-display">{t("landing.trustSupport", "Guaranteed Accountability")}</h3>
                <p className="text-muted-foreground">{t("landing.trustSupportDesc", "Mandatory bilateral reviews ensure genuine platform-exclusive reputation.")}</p>
              </div>
            </div>
            <div className="mt-16 text-center">
              <Button size="lg" className="h-14 px-10 text-lg font-bold shadow-xl shadow-primary/20 bg-gradient-to-r from-primary-deep to-primary" onClick={() => navigate("/auth")}>
                 {t("landing.joinTrust", "Join the Trusted Network")}
                 <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* App Download Banner */}
        <section className="px-6 py-24 bg-gradient-to-b from-transparent to-primary/5">
          <div className="max-w-5xl mx-auto bg-primary-deep text-primary-foreground rounded-[2.5rem] p-10 sm:p-16 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] bg-primary rounded-full blur-[100px] opacity-70 z-0" />

            <div className="relative z-10 text-center md:text-left flex-1 space-y-6">
              <h2 className="text-3xl sm:text-5xl font-display font-bold leading-tight">
                {t("landing.appTitle", "Take back your free time, anywhere.")}
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-md mx-auto md:mx-0">
                {t("landing.appDesc", "Download the Tasky mobile app to post jobs, track Taskers, and handle everything on the go.")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
                <Button variant="secondary" size="lg" className="h-14 px-6 border border-white/20 text-white hover:bg-white/10 hover:text-white bg-black/40 backdrop-blur-sm gap-3">
                  <Smartphone className="w-6 h-6" />
                  <div className="text-left leading-tight">
                    <div className="text-[10px] text-white/70">Download on the</div>
                    <div className="font-bold">App Store</div>
                  </div>
                </Button>
                <Button variant="secondary" size="lg" className="h-14 px-6 border border-white/20 text-white hover:bg-white/10 hover:text-white bg-black/40 backdrop-blur-sm gap-3">
                  <Download className="w-6 h-6" />
                  <div className="text-left leading-tight">
                    <div className="text-[10px] text-white/70">GET IT ON</div>
                    <div className="font-bold">Google Play</div>
                  </div>
                </Button>
              </div>
            </div>

            <div className="relative z-10 w-full max-w-[280px] hidden md:block">
              {/* Abstract App Mockup Graphic */}
              <div className="bg-background rounded-[2rem] border-[8px] border-foreground/10 p-4 shadow-2xl rotate-[-5deg] hover:rotate-0 transition-transform duration-500">
                <div className="bg-muted rounded-xl h-[400px] flex flex-col p-4 space-y-4">
                  <div className="h-12 bg-primary/20 rounded-lg animate-pulse" />
                  <div className="h-24 bg-card rounded-lg border border-border shadow-sm p-3">
                     <div className="w-10 h-10 bg-secondary/20 rounded-full mb-2" />
                     <div className="h-3 w-1/2 bg-muted-foreground/20 rounded-full mb-1" />
                     <div className="h-3 w-3/4 bg-muted-foreground/20 rounded-full" />
                  </div>
                  <div className="h-24 bg-card rounded-lg border border-border shadow-sm p-3">
                     <div className="w-10 h-10 bg-primary/20 rounded-full mb-2" />
                     <div className="h-3 w-1/2 bg-muted-foreground/20 rounded-full mb-1" />
                     <div className="h-3 w-3/4 bg-muted-foreground/20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/10 bg-zinc-950 text-zinc-400 py-16 px-6 sm:py-24 relative overflow-hidden mt-auto">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 relative z-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 text-white">
              <Shield className="w-8 h-8 text-primary" />
              <span className="font-display font-bold text-2xl tracking-tight">Tasky</span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm">
              {t("landing.footerDesc", "Mongolia's premier platform for trusted domestic services. Connecting verified professionals with homes that need them, safely and efficiently.")}
            </p>
            <div className="flex gap-4 pt-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Services Column */}
          <div className="space-y-4">
            <h4 className="text-white font-bold font-display tracking-wide uppercase text-sm">{t("landing.footerServices", "Services")}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="#" className="hover:text-primary transition-colors">{t("landing.catCleaning", "Deep Cleaning")}</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">{t("landing.catHandyman", "Handyman Repairs")}</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">{t("landing.catMoving", "Movers & Help")}</Link></li>
              <li><Link to="#" className="text-zinc-600 cursor-not-allowed">{t("landing.catPlumbing", "Plumbing")} (Soon)</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-4">
            <h4 className="text-white font-bold font-display tracking-wide uppercase text-sm">{t("landing.footerCompany", "Company")}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="#" className="hover:text-primary transition-colors">{t("landing.about", "About Us")}</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">{t("landing.careers", "Careers")}</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">{t("landing.blog", "Blog")}</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">{t("landing.contact", "Contact")}</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h4 className="text-white font-bold font-display tracking-wide uppercase text-sm">{t("landing.footerLegal", "Legal")}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="#" className="hover:text-primary transition-colors">{t("landing.terms", "Terms of Service")}</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">{t("landing.privacy", "Privacy Policy")}</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">{t("landing.trustSupport", "Trust & Safety")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>{t("auth.copyright", "© 2026 Tasky Network. All rights reserved.")}</p>
          <div className="flex items-center gap-2">
            <span>{t("landing.madeWith", "Crafted with")}</span>
            <span className="text-accent animate-pulse">❤</span>
            <span>{t("landing.inUlaanbaatar", "in Ulaanbaatar")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
