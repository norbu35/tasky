import {
  LayoutDashboard,
  ClipboardList,
  Search,
  Briefcase,
  MessageSquare,
  User,
  LogOut,
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

  const roleLabel =
    profile?.role === 'CUSTOMER'
      ? t('nav.customer')
      : profile?.role === 'TASKER'
        ? t('nav.tasker')
        : null;

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 border-r border-border/40 bg-card sticky top-0 h-screen">
      <div
        className="flex items-center gap-3 px-5 pt-6 pb-5 cursor-pointer"
        onClick={() => navigate('/')}
        aria-label={t('nav.home')}
      >
        <div className="relative">
          <img src="/logo.png" alt="" className="h-10 w-10 rounded-xl shadow-card" />
          <div className="absolute -inset-0.5 rounded-xl bg-primary/10 -z-10 blur-sm" />
        </div>
        <div className="flex flex-col">
          <span className="text-heading-3 font-display font-semibold text-foreground leading-none">
            Tasky
          </span>
          {roleLabel && (
            <span className="text-badge-text font-medium text-primary mt-0.5 tracking-caps uppercase">
              {roleLabel}
            </span>
          )}
        </div>
      </div>

      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      {navLinks && (
        <nav
          className="flex flex-col gap-0.5 px-3 pt-5 flex-1 overflow-y-auto"
          aria-label="Main navigation"
        >
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium font-sans transition-all duration-200',
                  isActive
                    ? 'bg-primary/[0.08] text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full bg-primary transition-all duration-200 ${
                      isActive ? 'h-5 opacity-100' : 'h-0 opacity-0'
                    }`}
                  />
                  <div
                    className={`flex items-center justify-center rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-icon-xs w-icon-xs shrink-0" />
                  </div>
                  <span>{t(label)}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}

      <div className="mt-auto">
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {profile && (
          <div className="mx-3 mt-3 flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-icon-xs w-icon-xs" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-body-sm font-medium text-foreground truncate">
                {profile.full_name}
              </span>
              {roleLabel && <span className="text-caption text-muted-foreground">{roleLabel}</span>}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 px-3 py-3">
          <LanguageSwitcher className="flex-1 justify-start" />
          {profile && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-2 px-2"
              onClick={signOut}
              aria-label={t('nav.logout')}
            >
              <LogOut className="h-icon-xs w-icon-xs" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
