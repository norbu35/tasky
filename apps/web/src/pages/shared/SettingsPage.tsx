import { Bell, ChevronRight, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ResponsiveDetailShell } from '../../layout/parity';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[13px] font-bold font-display text-primary-deep uppercase tracking-[0.075em]">
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
      className="flex w-full items-center gap-3 rounded-md bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        {icon}
      </span>
      <span className="flex-1 text-left text-sm font-medium text-foreground">{label}</span>
      <ChevronRight className="h-4 w-4 text-text-tertiary" />
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
      <div className="space-y-6">
        <section>
          <SectionTitle>{t('sharedPages.settings.preferences')}</SectionTitle>
          <ActionRow
            icon={<Bell className="h-5 w-5 text-primary" />}
            label={t('sharedPages.settings.notificationsAction')}
          />
        </section>
        <section>
          <SectionTitle>{t('sharedPages.settings.account')}</SectionTitle>
          <ActionRow
            icon={<LogOut className="h-5 w-5 text-primary" />}
            label={t('sharedPages.settings.signOutAction')}
          />
        </section>
      </div>
    </ResponsiveDetailShell>
  );
}
