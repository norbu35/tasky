import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  ShieldCheck,
  Star,
  Wrench,
  Download,
  Smartphone,
  BadgeCheck,
  Banknote,
  Globe,
  MessageCircle,
  Camera,
  User,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import {
  CustomerAdvantageVisual,
  TaskerAdvantageVisual,
} from '../components/feature/landing/ComparisonVisuals';
import { Button } from '../components/ui/button';
import { LanguageSwitcher } from '../layout/LanguageSwitcher';

interface SampleTask {
  title: string;
  price: string;
  district: string;
  category: 'cleaning' | 'repair' | 'moving' | 'electric' | 'childcare';
}

const CATEGORY_COLORS: Record<SampleTask['category'], string> = {
  cleaning: 'bg-accent',
  repair: 'bg-secondary',
  moving: 'bg-trust',
  electric: 'bg-primary',
  childcare: 'bg-verified',
};

function AnimatedTaskFeed() {
  const { t } = useTranslation();
  const [visibleStart, setVisibleStart] = useState(0);

  const sampleTasks: SampleTask[] = [
    {
      title: t('landing.task1', 'Deep clean 2-bedroom apartment'),
      price: '₮65,000',
      district: t('landing.distBayangol', 'Bayangol'),
      category: 'cleaning',
    },
    {
      title: t('landing.task2', 'Fix bathroom pipe leak'),
      price: '₮40,000',
      district: t('landing.distSukhbaatar', 'Sukhbaatar'),
      category: 'repair',
    },
    {
      title: t('landing.task3', 'Move studio to 1-bedroom'),
      price: '₮85,000',
      district: t('landing.distChingeltei', 'Chingeltei'),
      category: 'moving',
    },
    {
      title: t('landing.task4', 'Install ceiling light fixtures'),
      price: '₮30,000',
      district: t('landing.distKhanUul', 'Khan-Uul'),
      category: 'electric',
    },
    {
      title: t('landing.task5', 'Weekly apartment cleaning'),
      price: '₮45,000',
      district: t('landing.distBayanzurkh', 'Bayanzurkh'),
      category: 'cleaning',
    },
    {
      title: t('landing.task6', 'Assemble IKEA furniture'),
      price: '₮25,000',
      district: t('landing.distSukhbaatar', 'Sukhbaatar'),
      category: 'repair',
    },
    {
      title: t('landing.task7', 'Move office — 3 rooms'),
      price: '₮120,000',
      district: t('landing.distSonginokhairkhan', 'Songinokhairkhan'),
      category: 'moving',
    },
    {
      title: t('landing.task8', 'Babysitter for 2 children (4hrs)'),
      price: '₮35,000',
      district: t('landing.distKhanUul', 'Khan-Uul'),
      category: 'childcare',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleStart((prev) => (prev + 1) % sampleTasks.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [sampleTasks.length]);

  const visibleTasks = Array.from({ length: 3 }, (_, i) => {
    const index = (visibleStart + i) % sampleTasks.length;
    return { ...sampleTasks[index], index };
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
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex items-center gap-4 rounded-xl border border-white/20 bg-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md px-5 py-4 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 ${CATEGORY_COLORS[task.category]}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{task.title}</p>
              <p className="text-xs text-white/80 mt-0.5">
                {task.price} · {task.district}
              </p>
            </div>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0 backdrop-blur-md">
              <BadgeCheck className="w-3.5 h-3.5" />
              {t('landing.verified', 'Verified')}
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
      {/* Header — floating glassmorphic nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/[0.02] shadow-sm px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-accent" />
            <span className="text-2xl font-display font-bold tracking-tight text-primary-foreground">
              Tasky
            </span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher className="bg-black/20 text-white hover:bg-black/40 border border-white/10 backdrop-blur-md shadow-sm" />
            <Button
              className="font-semibold bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
              onClick={() => navigate('/auth')}
            >
              <User className="w-4 h-4" />
              {t('auth.login', 'Login')}
            </Button>
          </div>
        </div>
      </header>

      <main className="pb-20">
        {/* Hero Section — Dynamic Premium Gradient Mesh */}
        <section className="relative min-h-screen flex items-center bg-[#071318] overflow-hidden">
          {/* Animated Background Mesh */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary rounded-full blur-[120px] mix-blend-screen opacity-40 animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent rounded-full blur-[150px] mix-blend-screen opacity-20" />
            <div className="absolute top-[20%] right-[15%] w-[30%] h-[30%] bg-secondary rounded-full blur-[100px] mix-blend-screen opacity-20" />
          </div>
          {/* Metallic Gradient Streak Overlay */}
          <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(105deg,transparent_20%,rgba(255,255,255,0.15)_35%,rgba(255,255,255,0.15)_40%,transparent_55%)] mix-blend-overlay opacity-50"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 lg:py-0 w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="space-y-8 text-center lg:text-left"
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tighter leading-[1.05] text-white drop-shadow-sm">
                {t('landing.heroTitle1', 'Trusted help,')}
                <br />
                {t('landing.heroTitle2', 'fixed price.')}
              </h1>

              <p className="text-lg sm:text-xl text-white/80 font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
                {t(
                  'landing.heroSubtitle',
                  'ID-verified workers. Upfront budgets. Local support when you need it.',
                )}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl shadow-accent/20 transition-all hover:scale-105 active:scale-95 group"
                  onClick={() => navigate('/auth')}
                >
                  {t('landing.postTaskBtn', 'Post a Task')}
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full sm:w-auto h-14 px-8 text-lg font-semibold text-primary-foreground/90 border border-white/20 hover:bg-white/10 backdrop-blur-sm transition-all hover:scale-105 active:scale-95 hover:border-white/40 hover:text-white"
                  onClick={() => navigate('/auth')}
                >
                  {t('landing.becomeTaskerBtn', 'Become a Tasker')}
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
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
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
                <h2 className="text-4xl font-black text-foreground tracking-tighter mb-4 uppercase">
                  {t('landing.featuredServices', 'What do you need done?')}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    'landing.featuredDesc',
                    'Post a task in any category. Set your budget. Get matched with verified Taskers nearby.',
                  )}
                </p>
              </div>
              <div className="h-[2px] flex-grow mx-12 bg-border opacity-30 hidden md:block"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Deep Cleaning */}
              <div
                className="md:col-span-2 group relative overflow-hidden rounded-xl aspect-[16/9] md:aspect-auto md:h-[500px] bg-card transition-all hover:shadow-[0_20px_50px_rgba(59,155,122,0.15)] hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate('/auth')}
              >
                <img
                  alt={t('landing.featCleaningAlt', 'Apartment cleaning service')}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src="/images/feat-cleaning.png"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 sm:p-10 w-full">
                  <h3 className="text-3xl font-bold text-primary-foreground mb-2">
                    {t('landing.featCleaning', 'Deep Cleaning')}
                  </h3>
                  <p className="text-primary-foreground/80 max-w-sm mb-6">
                    {t(
                      'landing.featCleaningDesc',
                      'Apartments, offices, move-out cleans. Set your budget, pick a time, get matched.',
                    )}
                  </p>
                  <span className="text-accent font-bold tracking-widest uppercase text-sm flex items-center gap-2">
                    {t('landing.postTask', 'Post a Task')}{' '}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                  </span>
                </div>
              </div>

              {/* Handyman & Repairs */}
              <div
                className="group relative overflow-hidden rounded-xl bg-card hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1 cursor-pointer border border-border/50"
                onClick={() => navigate('/auth')}
              >
                <div className="p-8 sm:p-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-8">
                      <Wrench className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      {t('landing.featRepair', 'Handyman & Repairs')}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                      {t(
                        'landing.featRepairDesc',
                        'Plumbing, furniture assembly, appliance fixes. All Taskers are ID-verified.',
                      )}
                    </p>
                  </div>
                  <img
                    alt={t('landing.featRepairAlt', 'Handyman repair work')}
                    className="w-full h-48 object-cover rounded-lg"
                    src="/images/feat-repair.png"
                  />
                </div>
              </div>

              {/* Electrician */}
              <div
                className="group relative overflow-hidden rounded-xl bg-card border border-border/50 text-foreground hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate('/auth')}
              >
                <div className="p-8 sm:p-10">
                  <Wrench className="w-10 h-10 mb-6 text-accent" />
                  <h3 className="text-2xl font-bold mb-4">
                    {t('landing.featElectric', 'Electrician')}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-10">
                    {t(
                      'landing.featElectricDesc',
                      'Light fixtures, wiring, panel work. Fixed price upfront — no hourly surprises.',
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {t('landing.tagVerified', 'ID Verified')}
                    </span>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {t('landing.tagFixed', 'Fixed Price')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Movers & Help */}
              <div
                className="md:col-span-2 group relative overflow-hidden rounded-xl bg-primary text-primary-foreground hover:shadow-[0_20px_50px_rgba(59,155,122,0.2)] transition-all hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate('/auth')}
              >
                <div className="p-8 sm:p-10 grid md:grid-cols-2 gap-8 items-center h-full">
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter uppercase mb-4">
                      {t('landing.featMoving', 'Movers & Help')}
                    </h3>
                    <p className="text-primary-foreground/80 mb-6 leading-relaxed">
                      {t(
                        'landing.featMovingDesc',
                        'Studio to apartment, office relocations, heavy lifting. Post your move, set the budget, and pick from verified Taskers.',
                      )}
                    </p>
                    <Button
                      className="px-6 py-5 bg-accent text-accent-foreground font-bold rounded-md hover:bg-accent/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/auth');
                      }}
                    >
                      {t('landing.postTask', 'Post a Task')}
                    </Button>
                  </div>
                  <div className="relative h-full flex items-center">
                    <img
                      alt={t('landing.featMovingAlt', 'Moving service')}
                      className="relative z-10 w-full h-48 md:h-56 object-cover rounded-lg"
                      src="/images/feat-moving.png"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="px-6 py-24 bg-background border-t border-border/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl sm:text-5xl font-display font-bold mb-6 tracking-tight">
                {t('landing.howItWorksTitle', 'How Tasky Works')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
                {t(
                  'landing.howItWorksSub',
                  'A simple, secure, and transparent ecosystem designed to bridge trust between customers and vetted professionals.',
                )}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
              {/* Customer Flow */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-[0_30px_60px_rgba(59,155,122,0.1)] ring-1 ring-inset ring-primary/10 relative overflow-hidden transition-shadow hover:shadow-[0_30px_60px_rgba(59,155,122,0.15)]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-0" />
                <div className="relative z-10 space-y-3 mb-8">
                  <h3 className="text-3xl font-display font-bold text-primary-deep">
                    {t('landing.forCustomers', 'For Customers')}
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    {t('landing.customerDesc', 'Get your to-do list done securely.')}
                  </p>
                </div>

                <div className="relative z-10">
                  <CustomerAdvantageVisual />
                </div>

                <div className="space-y-8 relative z-10">
                  {[
                    {
                      num: 1,
                      title: t('landing.cStep1Title', 'Post your requirements'),
                      desc: t(
                        'landing.cStep1Desc',
                        'Describe what you need done, set your budget, and choose a time & location.',
                      ),
                      bg: 'bg-primary/10',
                      text: 'text-primary',
                      hoverBg: 'group-hover:bg-primary',
                    },
                    {
                      num: 2,
                      title: t('landing.cStep2Title', 'Choose the best fit'),
                      desc: t(
                        'landing.cStep2Desc',
                        'Review profiles, ratings, and past work of interested Taskers before hiring.',
                      ),
                      bg: 'bg-trust/10',
                      text: 'text-trust',
                      hoverBg: 'group-hover:bg-trust',
                    },
                    {
                      num: 3,
                      title: t('landing.cStep3Title', 'Book with confidence'),
                      desc: t(
                        'landing.cStep3Desc',
                        'Confirm the right Tasker, keep the exact address private until booking, and use dispute support if something goes wrong.',
                      ),
                      bg: 'bg-verified/10',
                      text: 'text-verified',
                      hoverBg: 'group-hover:bg-verified',
                    },
                  ].map((step) => (
                    <motion.div
                      key={step.num}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-50px' }}
                      transition={{ duration: 0.5, delay: step.num * 0.15, ease: 'easeOut' }}
                      className="flex gap-5 group"
                    >
                      <div
                        className={`flex-shrink-0 w-14 h-14 rounded-2xl ${step.bg} flex items-center justify-center ${step.text} font-bold text-xl transition-all duration-300 group-hover:scale-[1.15] ${step.hoverBg} group-hover:text-white shadow-sm ring-4 ring-white relative z-10 group-hover:shadow-lg`}
                      >
                        {step.num}
                      </div>
                      <div className="pt-1">
                        <h4 className="text-xl font-bold mb-2 font-display">{step.title}</h4>
                        <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Tasker Flow */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-[0_30px_60px_rgba(242,166,90,0.1)] ring-1 ring-inset ring-secondary/20 relative overflow-hidden lg:mt-12 transition-shadow hover:shadow-[0_30px_60px_rgba(242,166,90,0.15)]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-bl-[100px] -z-0" />
                <div className="relative z-10 space-y-3 mb-8">
                  <h3 className="text-3xl font-display font-bold text-secondary">
                    {t('landing.forTaskers', 'For Taskers')}
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    {t('landing.taskerDesc', 'Find flexible work and earn securely.')}
                  </p>
                </div>

                <div className="relative z-10">
                  <TaskerAdvantageVisual />
                </div>

                <div className="space-y-8 relative z-10">
                  {[
                    {
                      num: 1,
                      title: t('landing.tStep1Title', 'Find local jobs'),
                      desc: t(
                        'landing.tStep1Desc',
                        'Browse a live feed of tasks near you that match your skills.',
                      ),
                      bg: 'bg-secondary/10',
                      text: 'text-secondary',
                      hoverBg: 'group-hover:bg-secondary',
                    },
                    {
                      num: 2,
                      title: t('landing.tStep2Title', 'Send proposals'),
                      desc: t(
                        'landing.tStep2Desc',
                        'Apply to tasks you want to do with a quick message to the customer.',
                      ),
                      bg: 'bg-accent/10',
                      text: 'text-accent',
                      hoverBg: 'group-hover:bg-accent',
                    },
                    {
                      num: 3,
                      title: t('landing.tStep3Title', 'Build trust and repeat work'),
                      desc: t(
                        'landing.tStep3Desc',
                        'Complete jobs well, collect reviews, and grow your reputation during the launch period.',
                      ),
                      bg: 'bg-verified/10',
                      text: 'text-verified',
                      hoverBg: 'group-hover:bg-verified',
                    },
                  ].map((step) => (
                    <motion.div
                      key={step.num}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-50px' }}
                      transition={{ duration: 0.5, delay: step.num * 0.15, ease: 'easeOut' }}
                      className="flex gap-5 group"
                    >
                      <div
                        className={`flex-shrink-0 w-14 h-14 rounded-2xl ${step.bg} flex items-center justify-center ${step.text} font-bold text-xl transition-all duration-300 group-hover:scale-[1.15] ${step.hoverBg} group-hover:text-white shadow-sm ring-4 ring-white relative z-10 group-hover:shadow-lg`}
                      >
                        {step.num}
                      </div>
                      <div className="pt-1">
                        <h4 className="text-xl font-bold mb-2 font-display">{step.title}</h4>
                        <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trust & Safety Section — Split Screen */}
        <section className="w-full border-t border-border/30 bg-gradient-to-br from-[#0A1A1F] via-primary-deep to-primary-deep relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_20%,rgba(255,255,255,0.05)_35%,rgba(255,255,255,0.05)_40%,transparent_55%)] pointer-events-none" />
          <div className="grid md:grid-cols-2 min-h-[500px] relative z-10">
            {/* Left — The Pain */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-primary-foreground flex flex-col justify-center px-8 py-20 sm:px-12 lg:px-20 xl:px-28"
            >
              <div className="relative z-10">
                <p className="text-sm font-bold uppercase tracking-widest text-accent mb-8">
                  {t('landing.trustReality', 'The reality')}
                </p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold leading-[1.1] tracking-tight mb-6 text-white">
                  {t(
                    'landing.trustPainLine',
                    '10 phone calls. 3 no-shows. 1 stranger at your door.',
                  )}
                </h2>
                <p className="text-lg text-primary-foreground/50 max-w-md">
                  {t('landing.trustPainDesc', "That's the Facebook group experience.")}
                </p>
              </div>
            </motion.div>

            {/* Right — The Relief */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="bg-background text-foreground flex flex-col justify-center px-8 py-20 sm:px-12 lg:px-20 xl:px-28 relative z-10 lg:-ml-6 shadow-[-20px_0_40px_rgba(0,0,0,0.1)] rounded-l-3xl lg:rounded-l-[3rem]"
            >
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold leading-[1.1] tracking-tight mb-10">
                {t('landing.trustRelief', 'Or just use Tasky.')}
              </h3>

              <div className="space-y-6 mb-12">
                {[
                  {
                    icon: <BadgeCheck className="w-5 h-5" />,
                    color: 'text-verified bg-verified/10',
                    text: t(
                      'landing.trustProof1',
                      'Every Tasker is ID-verified before their first job',
                    ),
                  },
                  {
                    icon: <Banknote className="w-5 h-5" />,
                    color: 'text-accent bg-accent/10',
                    text: t(
                      'landing.trustProof2',
                      'Fixed price upfront. No haggling, no surprises.',
                    ),
                  },
                  {
                    icon: <Star className="w-5 h-5" />,
                    color: 'text-secondary bg-secondary/10',
                    text: t(
                      'landing.trustProof3',
                      'Mandatory reviews build real, portable reputation',
                    ),
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
                    className="flex items-start gap-4"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}
                    >
                      {item.icon}
                    </div>
                    <p className="text-base font-medium pt-2">{item.text}</p>
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                className="w-fit h-14 px-10 text-lg font-bold shadow-xl shadow-primary/20 bg-gradient-to-r from-primary-deep to-primary"
                onClick={() => navigate('/auth')}
              >
                {t('landing.joinTrust', 'Join the Trusted Network')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* The Tasky Promise Section */}
        <section className="px-6 py-24 bg-muted/30 border-t border-border/30 overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Image (Now forced to the Right) */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6 }}
              className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl border border-border/50 order-2"
            >
              <img
                src="/images/promise-handshake.png"
                alt={t('landing.promiseImageAlt', 'Customer and tasker shaking hands')}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Right Pillars (Now forced to the Left) */}
            <div className="order-1">
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl sm:text-5xl font-display font-bold mb-5 tracking-tight">
                  {t('landing.promiseTitle', 'The Tasky Promise')}
                </h2>
                <p className="text-lg text-muted-foreground font-medium">
                  {t(
                    'landing.promiseSub',
                    'We built Tasky because finding help shouldn’t feel like a gamble. Accountability is built into our foundation.',
                  )}
                </p>
              </div>

              <div className="space-y-4 relative z-10">
                {/* Pillar 1: Identity */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5 }}
                  className="flex gap-4 sm:gap-5 bg-card/60 rounded-2xl p-5 sm:p-6 border border-border/50 hover:bg-card hover:shadow-sm transition-all items-start"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-verified/10 text-verified rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-display font-bold mb-1">
                      {t('landing.pillar1Title', '100% ID Verified')}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {t(
                        'landing.pillar1Desc',
                        'Every single Tasker must pass a strict identity check before joining. No anonymous profiles. Zero burner accounts.',
                      )}
                    </p>
                  </div>
                </motion.div>

                {/* Pillar 2: Reputation */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="flex gap-4 sm:gap-5 bg-card/60 rounded-2xl p-5 sm:p-6 border border-border/50 hover:bg-card hover:shadow-sm transition-all items-start"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-display font-bold mb-1">
                      {t('landing.pillar2Title', 'Power of the Rating')}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {t(
                        'landing.pillar2Desc',
                        'Taskers are financially incentivized to do a great job. A high rating is their livelihood—they have every reason to be punctual and polite.',
                      )}
                    </p>
                  </div>
                </motion.div>

                {/* Pillar 3: Support */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex gap-4 sm:gap-5 bg-card/60 rounded-2xl p-5 sm:p-6 border border-border/50 hover:bg-card hover:shadow-sm transition-all items-start"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-display font-bold mb-1">
                      {t('landing.pillar3Title', 'Ulaanbaatar-Based Support')}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {t(
                        'landing.pillar3Desc',
                        "If a Tasker no-shows or work isn't up to standard, our local Ulaanbaatar support team is here to mediate and resolve the issue.",
                      )}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* App Download Banner */}
        <section className="relative w-full bg-gradient-to-br from-primary-deep via-primary to-primary-deep text-primary-foreground overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary rounded-full blur-[120px] opacity-50 z-0 pointer-events-none" />

          <div className="w-full flex flex-col md:flex-row items-center">
            {/* Image Side */}
            <div className="w-full md:w-1/2 relative h-[400px] sm:h-[500px] md:h-[600px]">
              <div className="absolute inset-0 bg-primary-deep/20 mix-blend-multiply z-10" />
              <img
                src="/images/download_app.png"
                alt={t('landing.appLifestyleAlt', 'Tasky app lifestyle')}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content Side */}
            <div className="w-full md:w-1/2 px-8 py-20 lg:px-24 xl:px-32 relative z-10 space-y-8 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-accent font-semibold text-sm">
                <Smartphone className="w-4 h-4" />
                <span>{t('landing.mobileApp', 'Mobile App')}</span>
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight">
                {t('landing.appTitle', 'Take back your free time, anywhere.')}
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-lg mx-auto md:mx-0">
                {t(
                  'landing.appDesc',
                  'Download the Tasky mobile app to post jobs, track Taskers, and handle everything on the go.',
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-14 px-6 border border-white/20 text-white hover:bg-white/10 hover:text-white bg-black/40 backdrop-blur-sm gap-3"
                >
                  <Smartphone className="w-6 h-6" />
                  <div className="text-left leading-tight">
                    <div className="text-[10px] text-white/70">Download on the</div>
                    <div className="font-bold">App Store</div>
                  </div>
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-14 px-6 border border-white/20 text-white hover:bg-white/10 hover:text-white bg-black/40 backdrop-blur-sm gap-3"
                >
                  <Download className="w-6 h-6" />
                  <div className="text-left leading-tight">
                    <div className="text-[10px] text-white/70">GET IT ON</div>
                    <div className="font-bold">Google Play</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background text-muted-foreground border-t border-border/40 py-16 px-6 sm:py-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 text-foreground">
              <Shield className="w-8 h-8 text-primary" />
              <span className="font-display font-bold text-2xl tracking-tight">Tasky</span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm">
              {t(
                'landing.footerDesc',
                "Mongolia's premier platform for trusted domestic services. Connecting verified professionals with homes that need them, safely and efficiently.",
              )}
            </p>
            <div className="flex gap-3 pt-4">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Camera className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Services Column */}
          <div className="space-y-4">
            <h4 className="text-foreground font-bold font-display tracking-wide uppercase text-sm">
              {t('landing.footerServices', 'Services')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="#" className="hover:text-foreground transition-colors">
                  {t('landing.catCleaning', 'Deep Cleaning')}
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-foreground transition-colors">
                  {t('landing.catHandyman', 'Handyman Repairs')}
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-foreground transition-colors">
                  {t('landing.catMoving', 'Movers & Help')}
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/40 cursor-not-allowed">
                  {t('landing.catPlumbing', 'Plumbing')} (Soon)
                </span>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-4">
            <h4 className="text-foreground font-bold font-display tracking-wide uppercase text-sm">
              {t('landing.footerCompany', 'Company')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="#" className="hover:text-foreground transition-colors">
                  {t('landing.about', 'About Us')}
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-foreground transition-colors">
                  {t('landing.careers', 'Careers')}
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-foreground transition-colors">
                  {t('landing.blog', 'Blog')}
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-foreground transition-colors">
                  {t('landing.contact', 'Contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h4 className="text-foreground font-bold font-display tracking-wide uppercase text-sm">
              {t('landing.footerLegal', 'Legal')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="#" className="hover:text-foreground transition-colors">
                  {t('landing.terms', 'Terms of Service')}
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-foreground transition-colors">
                  {t('landing.privacy', 'Privacy Policy')}
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-foreground transition-colors">
                  {t('landing.trustSupport', 'Trust & Safety')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>{t('auth.copyright', '© 2026 Tasky Network. All rights reserved.')}</p>
          <div className="flex items-center gap-2">
            <span>{t('landing.madeWith', 'Crafted with')}</span>
            <span className="text-accent">❤</span>
            <span>{t('landing.inUlaanbaatar', 'in Ulaanbaatar')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
