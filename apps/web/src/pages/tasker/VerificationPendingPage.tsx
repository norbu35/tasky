import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';

export function VerificationPendingPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('verification.pending.title')}
      description={t('verification.pending.description')}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('verification.pending.content')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
