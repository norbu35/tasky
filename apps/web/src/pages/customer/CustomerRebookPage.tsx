import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity';

export function CustomerRebookPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('customerPages.rebook.title')}
      description={t('customerPages.rebook.description')}
      primaryAction={
        <Button type="button" variant="secondary">
          {t('customerPages.rebook.continueAction')}
        </Button>
      }
    >
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-2">
            <RefreshCw className="h-7 w-7 text-primary" />
          </div>
          <CardTitle>{t('customerPages.rebook.cardTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground text-center">
          {t('customerPages.rebook.cardDesc')}
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
