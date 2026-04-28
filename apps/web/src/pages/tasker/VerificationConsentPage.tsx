import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';

export function VerificationConsentPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('verification.consent.title')}
      description={t('verification.consent.description')}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('verification.consent.content')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
