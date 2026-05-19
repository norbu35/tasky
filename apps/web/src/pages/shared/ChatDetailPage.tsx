import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
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
          <CardHeader className="pb-4">
            <p className="text-base font-display font-semibold tracking-tight">
              {t('sharedPages.chatDetail.railHeading')}
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="rounded-xl bg-muted/20 p-4 ring-1 ring-inset ring-border/30">
              <p className="text-body-sm text-muted-foreground leading-relaxed">
                {t('sharedPages.chatDetail.railContent')}
              </p>
            </div>
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4 p-5 pt-6">
            <div className="flex items-end gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-inset ring-border/30">
                T
              </div>
              <div className="max-w-[75%] space-y-1">
                <div className="rounded-2xl rounded-bl-sm bg-muted/30 px-4 py-2.5 text-body text-foreground ring-1 ring-inset ring-border/20">
                  {t('sharedPages.chatDetail.sampleMessage')}
                </div>
                <span className="block text-right text-badge-text text-muted-foreground">
                  10:15
                </span>
              </div>
            </div>
            <div className="flex items-end justify-end gap-3">
              <div className="max-w-[75%] space-y-1">
                <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-body font-medium text-primary-foreground shadow-card">
                  {t('sharedPages.chatDetail.sampleReply')}
                </div>
                <span className="block text-right text-badge-text text-muted-foreground">
                  10:16
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-3 rounded-xl bg-muted/10 p-4 ring-1 ring-inset ring-border/20">
          <Textarea
            aria-label={t('sharedPages.chatDetail.draftLabel')}
            placeholder={t('sharedPages.chatDetail.replyPlaceholder')}
          />
          <div className="flex justify-end">
            <Button aria-label={t('sharedPages.chatDetail.sendLabel')} type="button">
              <Send className="mr-2 h-4 w-4" />
              {t('sharedPages.chatDetail.sendLabel')}
            </Button>
          </div>
        </div>
      </div>
    </ResponsiveDetailShell>
  );
}
