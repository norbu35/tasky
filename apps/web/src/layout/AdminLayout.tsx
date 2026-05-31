import {
  AlertTriangle,
  FolderTree,
  Headset,
  LogOut,
  Scale,
  ShieldCheck,
  ToggleLeft,
  User,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { useAppContext } from '../context/AppContext';

import { LanguageSwitcher } from './LanguageSwitcher';

const NAV_ITEMS = [
  {
    to: '/admin/verifications',
    icon: ShieldCheck,
    label: 'admin.nav.verifications',
  },
  { to: '/admin/disputes', icon: AlertTriangle, label: 'admin.nav.disputes' },
  { to: '/admin/users', icon: Users, label: 'admin.nav.users' },
  {
    to: '/admin/categories',
    icon: FolderTree,
    label: 'admin.nav.categories',
  },
  { to: '/admin/features', icon: ToggleLeft, label: 'admin.nav.features' },
  { to: '/admin/concierge', icon: Headset, label: 'admin.nav.concierge' },
  { to: '/admin/moderation', icon: Scale, label: 'admin.nav.moderation' },
] as const;

export function AdminLayout() {
  const { profile, signOut } = useAppContext();
  const { t } = useTranslation();

  const roleLabel = profile?.role === 'ADMIN' ? t('nav.admin') : null;

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border/40 bg-card/95 backdrop-blur-xl md:flex md:flex-col">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border/30 px-5">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-semibold tracking-normal text-foreground">
            {t('admin.title')}
          </span>
        </div>
        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3 pt-5"
          aria-label={t('admin.nav.label')}
        >
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'group relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/[0.08] text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-full bg-primary transition-all duration-200 ${
                      isActive ? 'h-5 opacity-100' : 'h-0 opacity-0'
                    }`}
                  />
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                  <span className="truncate">{t(label)}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

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

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,hsl(var(--color-background))_0%,hsl(var(--color-muted)/0.18)_46%,hsl(var(--color-background))_100%)]">
        {/* Top header */}
        <header className="flex h-14 items-center justify-between gap-3 border-b border-border/40 bg-background/90 px-4 shadow-nav backdrop-blur-xl md:hidden">
          <span className="truncate font-display text-xl font-semibold tracking-normal text-foreground">
            {t('admin.title')}
          </span>
          <div className="shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-[var(--radius-sm)] p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={signOut}
              aria-label={t('nav.logout')}
              title={t('nav.logout')}
            >
              <LogOut className="h-icon-xs w-icon-xs" />
            </Button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav
          className="flex max-w-full gap-1 overflow-x-auto border-b border-border/40 bg-background/80 px-4 py-2 md:hidden"
          aria-label={t('admin.nav.mobileLabel')}
        >
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" />
              {t(label)}
            </NavLink>
          ))}
        </nav>

        {/* Page content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
