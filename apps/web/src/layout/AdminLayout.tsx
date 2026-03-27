import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  FolderTree,
  ToggleLeft,
  Headset,
  Scale,
  Banknote,
  Tag,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAppContext } from '../context/AppContext';

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
  { to: '/admin/payouts', icon: Banknote, label: 'admin.nav.payouts', fallback: 'Payouts' },
  { to: '/admin/pricing', icon: Tag, label: 'admin.nav.pricing', fallback: 'Pricing' },
] as const;

export function AdminLayout() {
  const { signOut } = useAppContext();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border/40 bg-muted/30 md:block">
        <div className="flex h-16 items-center gap-2 border-b border-border/40 px-6">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="text-lg font-extrabold tracking-tight text-primary">
            {t('admin.title', 'Tasky Admin')}
          </span>
        </div>
        <nav className="flex flex-col gap-1 p-4" aria-label="Admin navigation">
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
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-6 backdrop-blur-md">
          <span className="text-lg font-extrabold tracking-tight text-primary md:hidden">
            {t('admin.title', 'Tasky Admin')}
          </span>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" className="text-xs font-semibold" onClick={signOut}>
              {t('nav.logout', 'Sign out')}
            </Button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav
          className="flex gap-1 overflow-x-auto border-b border-border/40 px-4 py-2 md:hidden"
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
              <Icon className="h-3.5 w-3.5" />
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
