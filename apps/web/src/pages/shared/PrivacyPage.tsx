import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity';

export function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('sharedPages.privacy.title')}
      description={t('sharedPages.privacy.description')}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('sharedPages.privacy.content1')}</p>
          <p>{t('sharedPages.privacy.content2')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
