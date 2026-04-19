import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { ResponsiveFeedShell } from '../../layout/parity';

export function InboxPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveFeedShell
      title={t('sharedPages.inbox.title', 'Inbox')}
      description={t(
        'sharedPages.inbox.description',
        'Stay on top of customer and tasker conversations.',
      )}
      sideRail={
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {t('sharedPages.inbox.sideRail', 'Pinned threads and booking updates appear here.')}
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-4">
        <Input
          aria-label={t('sharedPages.inbox.searchPlaceholder', 'Search conversations')}
          placeholder={t('sharedPages.inbox.searchPlaceholder', 'Search conversations')}
        />
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">
                  {t('sharedPages.inbox.sampleThreadTitle', 'Apartment cleaning')}
                </span>
                <span className="shrink-0 text-[11px] text-text-tertiary">10:30</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {t('sharedPages.inbox.sampleThreadPreview', 'Tasker confirmed the Saturday slot.')}
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
