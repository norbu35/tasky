import { Home, Briefcase, MessageSquare, User, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { useAppContext } from '../context/AppContext';

const CUSTOMER_TABS = [
  { to: '/customer/dashboard', icon: Home, label: 'nav.home' },
  { to: '/customer/tasks', icon: Briefcase, label: 'nav.tasks' },
  { to: '/communication', icon: MessageSquare, label: 'nav.inbox' },
  { to: '/profile', icon: User, label: 'nav.profile' },
];

const TASKER_TABS = [
  { to: '/tasker/feed', icon: Search, label: 'nav.findWork' },
  { to: '/tasker/jobs', icon: Briefcase, label: 'nav.myJobs' },
  { to: '/communication', icon: MessageSquare, label: 'nav.inbox' },
  { to: '/profile', icon: User, label: 'nav.profile' },
];

export function BottomNavBar() {
  const { profile } = useAppContext();
  const { t } = useTranslation();

  if (!profile) return null;
  if (profile.role !== 'CUSTOMER' && profile.role !== 'TASKER') return null;
  const tabs = profile.role === 'CUSTOMER' ? CUSTOMER_TABS : TASKER_TABS;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-sticky border-t border-border bg-background md:hidden shadow-nav"
      aria-label={t('nav.bottomNavigation')}
    >
      <div className="mx-auto flex w-full max-w-lg items-center justify-around px-2 py-2">
        {tabs.map(({ to, icon: Icon, label }) => (
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
                <Icon className="w-icon-sm h-icon-sm" />
                <span
                  className={`text-nav tracking-normal truncate font-sans ${isActive ? 'font-semibold' : 'font-medium'}`}
                >
                  {t(label)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
