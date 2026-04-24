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
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>{t('customerPages.rebook.cardTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t('customerPages.rebook.cardDesc')}
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
