import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { ResponsiveFeedShell } from '../../layout/parity';

export function InboxPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveFeedShell
      title={t('sharedPages.inbox.title')}
      description={t('sharedPages.inbox.description')}
      sideRail={
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {t('sharedPages.inbox.sideRail')}
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-4">
        <Input
          aria-label={t('sharedPages.inbox.searchPlaceholder')}
          placeholder={t('sharedPages.inbox.searchPlaceholder')}
        />
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">
                  {t('sharedPages.inbox.sampleThreadTitle')}
                </span>
                <span className="shrink-0 text-[11px] text-text-tertiary">10:30</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {t('sharedPages.inbox.sampleThreadPreview')}
              </div>
            </div>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-card">
              2
            </span>
          </CardContent>
        </Card>
      </div>
    </ResponsiveFeedShell>
  );
}
