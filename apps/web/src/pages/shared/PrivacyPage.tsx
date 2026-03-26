import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../components/parity';
import { Card, CardContent } from '../../components/ui/card';

export function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell title={t('sharedPages.privacy.title', 'Privacy policy')} description={t('sharedPages.privacy.description', 'How Tasky handles profile data, booking records, and messages.')}>
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('sharedPages.privacy.content1', 'We minimize public address exposure and keep exact location details limited to active booking participants.')}</p>
          <p>{t('sharedPages.privacy.content2', 'Operational logs and moderation records are retained for trust and safety review.')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
