import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function TaskerPrivacyPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell title={t('taskerPages.privacy.title', 'Privacy policy')} description={t('taskerPages.privacy.description', 'How tasker data is handled in Phase 1.')}>
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('taskerPages.privacy.content', 'We only show the minimum task details needed to complete assigned jobs safely.')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
