import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';

export function VerificationPendingPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('verification.pending.title', 'Verification pending')}
      description={t(
        'verification.pending.description',
        'Your submission is awaiting manual review.',
      )}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>
            {t(
              'verification.pending.content',
              'We will notify you when your verification is reviewed.',
            )}
          </p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
