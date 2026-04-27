import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { ResponsiveDetailShell } from '../../layout/parity';

export function ChatDetailPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('sharedPages.chatDetail.title')}
      description={t('sharedPages.chatDetail.description')}
      backLabel={t('sharedPages.chatDetail.backLabel')}
      detailRail={
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {t('sharedPages.chatDetail.railContent')}
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-end gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                T
              </div>
              <div className="max-w-[75%] space-y-1">
                <div className="rounded-2xl rounded-bl-sm bg-card px-3 py-2 text-sm text-foreground">
                  {t('sharedPages.chatDetail.sampleMessage')}
                </div>
                <span className="block text-right text-caption text-text-tertiary">10:15</span>
              </div>
            </div>
            <div className="flex items-end justify-end gap-2">
              <div className="max-w-[75%] space-y-1">
                <div className="rounded-2xl rounded-br-sm bg-foreground px-3 py-2 text-sm text-card">
                  {t('sharedPages.chatDetail.sampleReply')}
                </div>
                <span className="block text-right text-caption text-text-tertiary">10:16</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-3 border-t border-border pt-3">
          <Textarea
            aria-label={t('sharedPages.chatDetail.draftLabel')}
            placeholder={t('sharedPages.chatDetail.replyPlaceholder')}
          />
          <Button aria-label={t('sharedPages.chatDetail.sendLabel')} type="button">
            {t('sharedPages.chatDetail.sendLabel')}
          </Button>
        </div>
      </div>
    </ResponsiveDetailShell>
  );
}
