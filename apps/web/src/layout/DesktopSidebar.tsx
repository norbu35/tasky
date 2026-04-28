import {
  LayoutDashboard,
  ClipboardList,
  Search,
  Briefcase,
  MessageSquare,
  User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { useAppContext } from '../context/AppContext';

import { LanguageSwitcher } from './LanguageSwitcher';

const CUSTOMER_NAV = [
  { to: '/customer/dashboard', label: 'nav.home', icon: LayoutDashboard },
  { to: '/customer/tasks', label: 'nav.tasks', icon: ClipboardList },
  { to: '/communication', label: 'nav.inbox', icon: MessageSquare },
  { to: '/profile', label: 'nav.profile', icon: User },
];

const TASKER_NAV = [
  { to: '/tasker/feed', label: 'nav.findWork', icon: Search },
  { to: '/tasker/jobs', label: 'nav.myJobs', icon: Briefcase },
  { to: '/communication', label: 'nav.inbox', icon: MessageSquare },
  { to: '/profile', label: 'nav.profile', icon: User },
];

export function DesktopSidebar() {
  const { profile, signOut } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const navLinks =
    profile?.role === 'CUSTOMER' ? CUSTOMER_NAV : profile?.role === 'TASKER' ? TASKER_NAV : null;

  return (
    <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 border-r border-border bg-card min-h-screen sticky top-0 h-screen">
      {/* Logo */}
      <div
        className="flex h-16 cursor-pointer items-center border-b border-border px-4"
        onClick={() => navigate('/')}
        aria-label={t('nav.home')}
      >
        <img src="/logo.png" alt="" className="h-10 w-10 rounded-xl shadow-card" />
      </div>

      {/* Nav links */}
      {navLinks && (
        <nav className="flex flex-col gap-1 p-3 flex-1" aria-label="Main navigation">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium font-sans transition-colors',
                  isActive
                    ? 'bg-primary/[0.08] text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                ].join(' ')
              }
            >
              <Icon className="h-icon-xs w-icon-xs shrink-0" />
              {t(label)}
            </NavLink>
          ))}
        </nav>
      )}

      {/* Footer */}
      <div className="flex flex-col gap-2 p-3 border-t border-border">
        <LanguageSwitcher className="w-full justify-start" />
        {profile && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            {t('nav.logout')}
          </Button>
        )}
      </div>
    </aside>
  );
}
