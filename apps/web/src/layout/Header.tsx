import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
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
      className="fixed top-0 left-0 right-0 z-sticky rounded-b-xl border-b border-border bg-background md:hidden shadow-nav"
    >
      <div className="flex items-center justify-between px-4 md:px-6 h-14 md:h-16">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-card group-hover:shadow-elevated transition-all">
            <Shield className="w-icon-xs h-icon-xs" strokeWidth={3} />
          </div>
          <span className="text-xl font-extrabold font-display tracking-normal text-foreground">
            Tasky
          </span>
        </div>

        {/* Desktop nav links */}
        {navLinks && (
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive
                    ? 'text-primary font-semibold text-sm'
                    : 'text-muted-foreground hover:text-foreground text-sm'
                }
              >
                {t(label)}
              </NavLink>
            ))}
          </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          <div className="w-[1px] h-6 bg-border/50 hidden md:block mx-1"></div>

          {profile ? (
            <Button
              variant="secondary"
              size="sm"
              className="text-sm font-semibold h-9 px-4 rounded-xl"
              onClick={signOut}
            >
              {t('nav.logout')}
            </Button>
          ) : (
            <Button
              className="text-sm font-bold h-9 px-4 rounded-xl"
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
