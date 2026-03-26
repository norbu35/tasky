import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../components/parity';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';

export function ChatDetailPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('sharedPages.chatDetail.title', 'Chat detail')}
      description={t('sharedPages.chatDetail.description', 'Keep booking communication in one thread.')}
      backLabel={t('sharedPages.chatDetail.backLabel', 'Back')}
      detailRail={
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {t('sharedPages.chatDetail.railContent', 'Booking details and quick actions will live in this rail.')}
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="rounded-2xl bg-muted px-3 py-2 text-sm">{t('sharedPages.chatDetail.sampleMessage', 'I can arrive by 10:00 tomorrow.')}</div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          <Textarea aria-label={t('sharedPages.chatDetail.draftLabel', 'Message draft')} placeholder={t('sharedPages.chatDetail.replyPlaceholder', 'Type your reply')} />
          <Button aria-label={t('sharedPages.chatDetail.sendLabel', 'Send message')} type="button">
            {t('sharedPages.chatDetail.sendLabel', 'Send message')}
          </Button>
        </div>
      </div>
    </ResponsiveDetailShell>
  );
}
