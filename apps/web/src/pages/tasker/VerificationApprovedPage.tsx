import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';

export function VerificationApprovedPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('verification.approved.title')}
      description={t('verification.approved.description')}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('verification.approved.content')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
