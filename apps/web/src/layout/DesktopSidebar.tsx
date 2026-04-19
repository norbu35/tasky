import {
  LayoutDashboard,
  ClipboardList,
  Search,
  Briefcase,
  MessageSquare,
  User,
  Shield,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { useAppContext } from '../context/AppContext';

import { LanguageSwitcher } from './LanguageSwitcher';

const CUSTOMER_NAV = [
  { to: '/customer/dashboard', label: 'nav.home', fallback: 'Home', icon: LayoutDashboard },
  { to: '/customer/tasks', label: 'nav.tasks', fallback: 'Tasks', icon: ClipboardList },
  { to: '/communication', label: 'nav.inbox', fallback: 'Inbox', icon: MessageSquare },
  { to: '/profile', label: 'nav.profile', fallback: 'Profile', icon: User },
];

const TASKER_NAV = [
  { to: '/tasker/feed', label: 'nav.findWork', fallback: 'Find Work', icon: Search },
  { to: '/tasker/jobs', label: 'nav.myJobs', fallback: 'My Jobs', icon: Briefcase },
  { to: '/communication', label: 'nav.inbox', fallback: 'Inbox', icon: MessageSquare },
  { to: '/profile', label: 'nav.profile', fallback: 'Profile', icon: User },
];

export function DesktopSidebar() {
  const { profile, signOut } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const navLinks =
    profile?.role === 'CUSTOMER' ? CUSTOMER_NAV : profile?.role === 'TASKER' ? TASKER_NAV : null;

  return (
    <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 border-r border-border bg-surface min-h-screen sticky top-0 h-screen">
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 h-16 cursor-pointer group border-b border-border"
        onClick={() => navigate('/')}
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-deep to-primary flex items-center justify-center text-primary-foreground shadow-sm group-hover:shadow-md transition-all">
          <Shield className="w-4 h-4" strokeWidth={3} />
        </div>
        <span className="text-xl font-extrabold font-display tracking-tight text-foreground">
          Tasky
        </span>
      </div>

      {/* Nav links */}
      {navLinks && (
        <nav className="flex flex-col gap-1 p-3 flex-1" aria-label="Main navigation">
          {navLinks.map(({ to, label, fallback, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(label, fallback)}
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
            {t('nav.logout', 'Sign out')}
          </Button>
        )}
      </div>
    </aside>
  );
}
