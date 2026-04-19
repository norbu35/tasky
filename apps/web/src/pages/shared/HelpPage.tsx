import { useTranslation } from 'react-i18next';

import { ResponsiveFeedShell } from '../../layout/parity';

export function HelpPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveFeedShell
      title={t('sharedPages.help.title', 'Help & support')}
      description={t(
        'sharedPages.help.description',
        'FAQs and next-step guidance for common marketplace issues.',
      )}
    >
      <div className="space-y-6">
        <section>
          <p className="mb-2 text-[13px] font-bold font-display text-primary-deep uppercase tracking-[0.075em]">
            {t('sharedPages.help.sectionGeneral', 'General')}
          </p>
          <div className="rounded-md bg-card p-4 shadow-sm space-y-2">
            <div className="font-medium text-foreground">
              {t('sharedPages.help.faq1Question', 'How do I reschedule a booking?')}
            </div>
            <div className="text-sm text-text-secondary">
              {t(
                'sharedPages.help.faq1Answer',
                'Open the booking detail and choose the new time before the task starts.',
              )}
            </div>
          </div>
        </section>
      </div>
    </ResponsiveFeedShell>
  );
}
