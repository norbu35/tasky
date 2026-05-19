import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { useAppContext } from '../context/AppContext';

import { LanguageSwitcher } from './LanguageSwitcher';

const CUSTOMER_NAV = [
  { to: '/customer/dashboard', label: 'nav.home' },
  { to: '/customer/tasks', label: 'nav.tasks' },
  { to: '/communication', label: 'nav.inbox' },
  { to: '/profile', label: 'nav.profile' },
];

const TASKER_NAV = [
  { to: '/tasker/feed', label: 'nav.findWork' },
  { to: '/tasker/jobs', label: 'nav.myJobs' },
  { to: '/communication', label: 'nav.inbox' },
  { to: '/profile', label: 'nav.profile' },
];

export function Header() {
  const { profile, signOut } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const navLinks =
    profile?.role === 'CUSTOMER' ? CUSTOMER_NAV : profile?.role === 'TASKER' ? TASKER_NAV : null;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-sticky border-b border-border/30 bg-background/95 md:hidden shadow-nav"
    >
      <div className="flex items-center justify-between px-4 md:px-6 h-14 md:h-16">
        <div
          className="flex cursor-pointer items-center gap-2"
          onClick={() => navigate('/')}
          aria-label={t('nav.home')}
        >
          <img src="/logo.png" alt="" className="h-9 w-9 rounded-lg shadow-card" />
          <span className="text-heading-3 font-display font-semibold text-foreground">Tasky</span>
        </div>

        {navLinks && (
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive
                    ? 'text-primary font-semibold text-sm'
                    : 'text-muted-foreground hover:text-foreground text-sm transition-colors duration-200'
                }
              >
                {t(label)}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          <div className="w-px h-5 bg-border/40 hidden md:block" />

          {profile ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-sm font-semibold h-9 px-3 rounded-lg text-muted-foreground hover:text-foreground transition-colors duration-200"
              onClick={signOut}
            >
              {t('nav.logout')}
            </Button>
          ) : (
            <Button
              className="text-sm font-bold h-9 px-4 rounded-lg"
              onClick={() => navigate('/auth')}
            >
              {t('auth.login')}
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
