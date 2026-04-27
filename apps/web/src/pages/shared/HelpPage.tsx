import { useTranslation } from 'react-i18next';

import { ResponsiveFeedShell } from '../../layout/parity';

export function HelpPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveFeedShell
      title={t('sharedPages.help.title')}
      description={t('sharedPages.help.description')}
    >
      <div className="space-y-6">
        <section>
          <p className="mb-2 text-overline font-bold font-display text-primary-deep uppercase">
            {t('sharedPages.help.sectionGeneral')}
          </p>
          <div className="rounded-md bg-card p-4 shadow-sm space-y-2">
            <div className="font-medium text-foreground">{t('sharedPages.help.faq1Question')}</div>
            <div className="text-sm text-text-secondary">{t('sharedPages.help.faq1Answer')}</div>
          </div>
        </section>
      </div>
    </ResponsiveFeedShell>
  );
}
