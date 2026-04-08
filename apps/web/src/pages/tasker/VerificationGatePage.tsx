import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function VerificationGatePage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('verification.gate.title', 'Identity verification')}
      description={t('verification.gate.description', 'Start your tasker verification flow.')}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>
            {t(
              'verification.gate.content',
              'Manual review is required before a tasker can accept jobs.',
            )}
          </p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
