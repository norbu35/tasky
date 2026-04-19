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
      title={t('customerPages.taskerProfile.title', 'Tasker profile')}
      description={t(
        'customerPages.taskerProfile.description',
        'Review the tasker before you confirm or message them.',
      )}
      primaryAction={
        <Button type="button" variant="secondary">
          {t('customerPages.taskerProfile.openProfile', 'Open profile')}
        </Button>
      }
      detailRail={
        <ActionRail
          title={t('customerPages.taskerProfile.railTitle', 'Primary actions')}
          primaryAction={
            <Button type="button" className="w-full">
              {t('customerPages.taskerProfile.messageTasker', 'Message tasker')}
            </Button>
          }
          secondaryActions={
            <Button type="button" variant="outline" className="w-full">
              {t('customerPages.taskerProfile.openChat', 'Open chat')}
            </Button>
          }
        />
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary/10 text-primary">VT</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle>
              {t('customerPages.taskerProfile.verifiedTasker', 'Verified Tasker')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t(
                'customerPages.taskerProfile.trustedDesc',
                'Trusted for Phase 1 customer bookings and direct settlement flows.',
              )}
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-sun-light" />
            {t('customerPages.taskerProfile.ratingText', '4.9 rating from 37 jobs')}
          </div>
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-primary" />
            {t(
              'customerPages.taskerProfile.respondsQuickly',
              'Responds quickly during business hours',
            )}
          </div>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
