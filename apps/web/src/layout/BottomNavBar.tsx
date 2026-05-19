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
      className="fixed bottom-0 left-0 right-0 z-sticky md:hidden shadow-nav"
      aria-label={t('nav.bottomNavigation')}
    >
      <div className="bg-background/95 border-t border-border/50">
        <div className="mx-auto flex w-full max-w-lg items-center justify-around px-2 pt-2 pb-2">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-2xl min-w-0 min-h-touch-target-min justify-center',
                  'transition-all duration-200 ease-out',
                  isActive
                    ? 'bg-primary/10 text-foreground'
                    : 'text-nav-inactive hover:text-foreground active:scale-95',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={`transition-transform duration-200 ${isActive ? 'w-icon-md h-icon-md scale-105' : 'w-icon-sm h-icon-sm'}`}
                    />
                    {isActive && (
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                    )}
                  </div>
                  <span
                    className={`text-nav tracking-normal truncate font-sans leading-none transition-all duration-200 ${isActive ? 'font-semibold text-foreground' : 'font-medium'}`}
                  >
                    {t(label)}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  );
}
