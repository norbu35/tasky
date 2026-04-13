import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function VerificationApprovedPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('verification.approved.title', 'Verification approved')}
      description={t('verification.approved.description', 'Your identity has been approved.')}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>
            {t(
              'verification.approved.content',
              'You can now accept jobs with a verified tasker profile.',
            )}
          </p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
