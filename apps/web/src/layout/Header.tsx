import { Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CUSTOMER_NAV = [
  { to: '/customer/dashboard', label: 'nav.home', fallback: 'Home' },
  { to: '/customer/tasks', label: 'nav.tasks', fallback: 'Tasks' },
  { to: '/communication', label: 'nav.inbox', fallback: 'Inbox' },
  { to: '/profile', label: 'nav.profile', fallback: 'Profile' },
];

const TASKER_NAV = [
  { to: '/tasker/feed', label: 'nav.findWork', fallback: 'Find Work' },
  { to: '/tasker/jobs', label: 'nav.myJobs', fallback: 'My Jobs' },
  { to: '/communication', label: 'nav.inbox', fallback: 'Inbox' },
  { to: '/profile', label: 'nav.profile', fallback: 'Profile' },
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
      className="fixed top-0 left-0 right-0 z-50 rounded-b-xl border border-border/40 bg-background/70 backdrop-blur-xl shadow-lg shadow-black/5 md:hidden"
    >
      <div className="flex items-center justify-between px-4 md:px-6 h-14 md:h-16">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-deep to-primary flex items-center justify-center text-primary-foreground shadow-sm group-hover:shadow-md transition-all">
            <Shield className="w-4 h-4" strokeWidth={3} />
          </div>
          <span className="text-xl font-extrabold font-display tracking-tight text-foreground">
            Tasky
          </span>
        </div>

        {/* Desktop nav links */}
        {navLinks && (
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {navLinks.map(({ to, label, fallback }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive
                    ? 'text-primary font-semibold text-sm'
                    : 'text-muted-foreground hover:text-foreground text-sm'
                }
              >
                {t(label, fallback)}
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
              {t('nav.logout', 'Sign out')}
            </Button>
          ) : (
            <Button
              className="text-sm font-semibold h-9 px-5 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-sm"
              onClick={() => navigate('/auth')}
            >
              {t('auth.login', 'Login')}
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
