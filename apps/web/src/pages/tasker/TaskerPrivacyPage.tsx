import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';

export function TaskerPrivacyPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('taskerPages.privacy.title')}
      description={t('taskerPages.privacy.description')}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('taskerPages.privacy.content')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
