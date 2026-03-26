import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function VerificationConsentPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell title={t('verification.consent.title', 'Verification consent')} description={t('verification.consent.description', 'Confirm the verification policy before uploading documents.')}>
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('verification.consent.content', 'By continuing, you confirm that the uploaded documents belong to you.')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
