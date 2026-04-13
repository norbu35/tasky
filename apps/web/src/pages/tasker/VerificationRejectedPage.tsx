import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function VerificationRejectedPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('verification.rejected.title', 'Verification rejected')}
      description={t(
        'verification.rejected.description',
        'Review the rejection reason and try again.',
      )}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>
            {t(
              'verification.rejected.content',
              'Fix the issues noted by the reviewer before resubmitting.',
            )}
          </p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
