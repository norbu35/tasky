import { MessageSquareText, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ActionRail, ResponsiveDetailShell } from '../../layout/parity';

export function CustomerTaskerProfilePage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('customerPages.taskerProfile.title')}
      description={t('customerPages.taskerProfile.description')}
      primaryAction={
        <Button type="button" variant="secondary">
          {t('customerPages.taskerProfile.openProfile')}
        </Button>
      }
      detailRail={
        <ActionRail
          title={t('customerPages.taskerProfile.railTitle')}
          primaryAction={
            <Button type="button" className="w-full">
              {t('customerPages.taskerProfile.messageTasker')}
            </Button>
          }
          secondaryActions={
            <Button type="button" variant="outline" className="w-full">
              {t('customerPages.taskerProfile.openChat')}
            </Button>
          }
        />
      }
    >
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-background shadow-card">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              VT
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {t('customerPages.taskerProfile.verifiedTasker')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('customerPages.taskerProfile.trustedDesc')}
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2">
            <Star className="h-4 w-4 text-sun-light" />
            <span>{t('customerPages.taskerProfile.ratingText')}</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2">
            <MessageSquareText className="h-4 w-4 text-primary" />
            <span>{t('customerPages.taskerProfile.respondsQuickly')}</span>
          </div>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
