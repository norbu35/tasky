import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function VerificationSubmittedPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell title={t('verification.submitted.title', 'Verification submitted')} description={t('verification.submitted.description', 'Your verification documents are in the queue.')}>
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('verification.submitted.content', 'Submission is recorded and waiting for the reviewer queue.')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
