import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';

export function VerificationGatePage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('verification.gate.title')}
      description={t('verification.gate.description')}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('verification.gate.content')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
