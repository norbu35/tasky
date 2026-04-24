import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';

export function VerificationSubmittedPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('verification.submitted.title')}
      description={t('verification.submitted.description')}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('verification.submitted.content')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
