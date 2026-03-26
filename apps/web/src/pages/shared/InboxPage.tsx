import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import { ResponsiveFeedShell } from '../../components/parity';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';

export function InboxPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveFeedShell
      title={t('sharedPages.inbox.title', 'Inbox')}
      description={t('sharedPages.inbox.description', 'Stay on top of customer and tasker conversations.')}
      sideRail={<Card><CardContent className="p-4 text-sm text-muted-foreground">{t('sharedPages.inbox.sideRail', 'Pinned threads and booking updates appear here.')}</CardContent></Card>}
    >
      <div className="space-y-4">
        <Input aria-label={t('sharedPages.inbox.searchPlaceholder', 'Search conversations')} placeholder={t('sharedPages.inbox.searchPlaceholder', 'Search conversations')} />
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <MessageSquare className="mt-0.5 h-4 w-4 text-primary" />
            <div className="space-y-1">
              <div className="font-semibold">{t('sharedPages.inbox.sampleThreadTitle', 'Apartment cleaning')}</div>
              <div className="text-sm text-muted-foreground">{t('sharedPages.inbox.sampleThreadPreview', 'Tasker confirmed the Saturday slot.')}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveFeedShell>
  );
}
