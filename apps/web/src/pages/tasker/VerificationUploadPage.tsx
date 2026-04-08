import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function VerificationUploadPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell title={t('verification.upload.title', 'Upload verification documents')} description={t('verification.upload.description', 'Upload the front and back of your ID card, plus a selfie.')}>
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('verification.upload.content', 'Phase 1 keeps the upload step simple and reviewable.')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
