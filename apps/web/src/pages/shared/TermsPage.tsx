import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity';

export function TermsPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('sharedPages.terms.title')}
      description={t('sharedPages.terms.description')}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('sharedPages.terms.content1')}</p>
          <p>{t('sharedPages.terms.content2')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
