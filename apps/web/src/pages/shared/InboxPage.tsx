import { MessageSquare, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ConversationCard } from '../../components/feature/ConversationCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-display">
              {t('sharedPages.inbox.sideRail')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="rounded-xl bg-muted/20 p-4 ring-1 ring-inset ring-border/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <p className="text-body-sm text-muted-foreground leading-relaxed">
                  {t('sharedPages.inbox.sideRail')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            aria-label={t('sharedPages.inbox.searchPlaceholder')}
            placeholder={t('sharedPages.inbox.searchPlaceholder')}
            className="pl-11"
          />
        </div>
        <ConversationCard
          title={t('sharedPages.inbox.sampleThreadTitle')}
          subtitle={t('sharedPages.inbox.sampleThreadPreview')}
          timestamp="10:30"
          unreadCount={2}
          onOpen={() => {}}
        />
      </div>
    </ResponsiveFeedShell>
  );
}
