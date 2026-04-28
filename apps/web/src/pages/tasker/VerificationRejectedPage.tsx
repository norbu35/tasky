import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';

export function VerificationRejectedPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('verification.rejected.title')}
      description={t('verification.rejected.description')}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('verification.rejected.content')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
