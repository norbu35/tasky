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
    fallback: 'Verifications',
  },
  { to: '/admin/disputes', icon: AlertTriangle, label: 'admin.nav.disputes', fallback: 'Disputes' },
  { to: '/admin/users', icon: Users, label: 'admin.nav.users', fallback: 'Users' },
  {
    to: '/admin/categories',
    icon: FolderTree,
    label: 'admin.nav.categories',
    fallback: 'Categories',
  },
  { to: '/admin/features', icon: ToggleLeft, label: 'admin.nav.features', fallback: 'Features' },
  { to: '/admin/concierge', icon: Headset, label: 'admin.nav.concierge', fallback: 'Concierge' },
  { to: '/admin/moderation', icon: Scale, label: 'admin.nav.moderation', fallback: 'Moderation' },
] as const;

export function AdminLayout() {
  const { profile, signOut } = useAppContext();
  const { t } = useTranslation();

  const roleLabel = profile?.role === 'ADMIN' ? t('nav.admin') : null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-surface md:flex md:flex-col sticky top-0 h-screen">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6 shrink-0">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="text-lg font-extrabold tracking-tight text-primary">
            {t('admin.title')}
          </span>
        </div>
        <nav
          className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto"
          aria-label="Admin navigation"
        >
          {NAV_ITEMS.map(({ to, icon: Icon, label, fallback }) => (
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
              <Icon className="h-4 w-4" />
              {t(label, fallback)}
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
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 rounded-lg shrink-0 flex items-center justify-center"
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
      <div className="flex flex-1 flex-col">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/70 backdrop-blur-md px-6">
          <span className="text-lg font-extrabold tracking-tight text-primary md:hidden">
            {t('admin.title')}
          </span>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" className="text-xs font-semibold" onClick={signOut}>
              {t('nav.logout')}
            </Button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav
          className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2 md:hidden"
          aria-label="Admin navigation mobile"
        >
          {NAV_ITEMS.map(({ to, icon: Icon, label, fallback }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" />
              {t(label, fallback)}
            </NavLink>
          ))}
        </nav>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
