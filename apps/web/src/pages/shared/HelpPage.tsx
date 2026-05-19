import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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
          <p className="mb-3 text-badge-text font-bold font-display uppercase tracking-caps text-muted-foreground">
            {t('sharedPages.help.sectionGeneral')}
          </p>
          <Card className="group">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <HelpCircle className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base font-display leading-snug">
                  {t('sharedPages.help.faq1Question')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="text-body-sm text-muted-foreground leading-relaxed">
                {t('sharedPages.help.faq1Answer')}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </ResponsiveFeedShell>
  );
}
