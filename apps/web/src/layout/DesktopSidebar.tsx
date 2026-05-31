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

const ADMIN_NAV = [
  { to: '/admin/verifications', label: 'nav.adminDashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'nav.profile', icon: User },
];

export function DesktopSidebar() {
  const { profile, signOut } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const navLinks =
    profile?.role === 'CUSTOMER'
      ? CUSTOMER_NAV
      : profile?.role === 'TASKER'
        ? TASKER_NAV
        : profile?.role === 'ADMIN'
          ? ADMIN_NAV
          : null;

  const roleLabel =
    profile?.role === 'CUSTOMER'
      ? t('nav.customer')
      : profile?.role === 'TASKER'
        ? t('nav.tasker')
        : profile?.role === 'ADMIN'
          ? t('nav.admin')
          : null;

  return (
    <aside className="sticky top-0 hidden h-screen border-r border-border/40 bg-card md:flex md:w-64 md:shrink-0 md:flex-col">
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
        </div>
      </div>

      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      {navLinks && (
        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pt-5"
          aria-label={t('nav.mainNavigation')}
        >
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'group relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium font-sans transition-all duration-200',
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
                    className={`flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-200 ${
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

      <div className="mt-auto p-3 shrink-0">
        <div className="rounded-xl border border-border/30 bg-muted/20 p-3 flex flex-col gap-2.5 shadow-sm">
          {profile && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                  <User className="h-icon-xs w-icon-xs" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-body-sm font-semibold text-foreground truncate leading-snug">
                    {profile.full_name}
                  </span>
                  {roleLabel && (
                    <span className="text-caption text-muted-foreground truncate leading-none mt-0.5">
                      {roleLabel}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 rounded-[var(--radius-sm)] p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 flex items-center justify-center"
                onClick={signOut}
                aria-label={t('nav.logout')}
                title={t('nav.logout')}
              >
                <LogOut className="h-icon-xs w-icon-xs" />
              </Button>
            </div>
          )}

          {profile && <div className="h-px bg-border/40 w-full" />}

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-xs font-medium text-muted-foreground">{t('nav.language')}</span>
            <LanguageSwitcher className="hover:bg-muted/60 transition-colors" />
          </div>
        </div>
      </div>
    </aside>
  );
}
