import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';

export function VerificationUploadPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('verification.upload.title')}
      description={t('verification.upload.description')}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('verification.upload.content')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
