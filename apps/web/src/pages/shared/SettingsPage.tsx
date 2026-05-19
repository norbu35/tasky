import { Bell, ChevronRight, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-badge-text font-bold font-display uppercase tracking-caps text-muted-foreground">
      {children}
    </p>
  );
}

function ActionRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-xl bg-card px-5 py-4 shadow-elevated ring-1 ring-inset ring-border/40 transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:shadow-deep"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
        {icon}
      </span>
      <span className="flex-1 text-left text-label font-semibold text-foreground">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
    </button>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('sharedPages.settings.title')}
      description={t('sharedPages.settings.description')}
    >
      <div className="space-y-8">
        <section>
          <SectionTitle>{t('sharedPages.settings.preferences')}</SectionTitle>
          <ActionRow
            icon={<Bell className="h-5 w-5 text-primary" />}
            label={t('sharedPages.settings.notificationsAction')}
          />
        </section>
        <section>
          <SectionTitle>{t('sharedPages.settings.account')}</SectionTitle>
          <Card>
            <CardContent className="p-0">
              <ActionRow
                icon={<LogOut className="h-5 w-5 text-primary" />}
                label={t('sharedPages.settings.signOutAction')}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </ResponsiveDetailShell>
  );
}
