import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../components/parity';
import { Card, CardContent } from '../../components/ui/card';

export function TermsPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell title={t('sharedPages.terms.title', 'Terms of service')} description={t('sharedPages.terms.description', 'Core expectations for customers, taskers, and bookings.')}>
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('sharedPages.terms.content1', 'Bookings require honest task descriptions, respectful communication, and accurate arrival timing.')}</p>
          <p>{t('sharedPages.terms.content2', 'Disputes should be raised quickly with factual details and supporting context.')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
