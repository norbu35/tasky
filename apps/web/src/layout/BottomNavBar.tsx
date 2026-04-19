import { Home, Briefcase, MessageSquare, User, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { useAppContext } from '../context/AppContext';

const CUSTOMER_TABS = [
  { to: '/customer/dashboard', icon: Home, label: 'nav.home', fallback: 'Home' },
  { to: '/customer/tasks', icon: Briefcase, label: 'nav.tasks', fallback: 'Tasks' },
  { to: '/communication', icon: MessageSquare, label: 'nav.inbox', fallback: 'Inbox' },
  { to: '/profile', icon: User, label: 'nav.profile', fallback: 'Profile' },
];

const TASKER_TABS = [
  { to: '/tasker/feed', icon: Search, label: 'nav.findWork', fallback: 'Find Work' },
  { to: '/tasker/jobs', icon: Briefcase, label: 'nav.myJobs', fallback: 'My Jobs' },
  { to: '/communication', icon: MessageSquare, label: 'nav.inbox', fallback: 'Inbox' },
  { to: '/profile', icon: User, label: 'nav.profile', fallback: 'Profile' },
];

export function BottomNavBar() {
  const { profile } = useAppContext();
  const { t } = useTranslation();

  if (!profile) return null;
  if (profile.role !== 'CUSTOMER' && profile.role !== 'TASKER') return null;
  const tabs = profile.role === 'CUSTOMER' ? CUSTOMER_TABS : TASKER_TABS;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/60 backdrop-blur-lg md:hidden"
      style={{ boxShadow: 'var(--shadow-nav)' }}
      aria-label={t('nav.bottomNavigation', 'Bottom navigation')}
    >
      <div className="mx-auto flex w-full max-w-lg items-center justify-around px-2 py-2">
        {tabs.map(({ to, icon: Icon, label, fallback }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-0',
                isActive ? 'text-foreground' : 'text-nav-inactive hover:text-foreground',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5" />
                <span
                  className={`text-[11px] tracking-wide truncate font-sans ${isActive ? 'font-semibold' : 'font-medium'}`}
                >
                  {t(label, fallback)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
