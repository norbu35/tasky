import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../components/parity';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell title={t('sharedPages.settings.title', 'Settings')} description={t('sharedPages.settings.description', 'Account, safety, and session controls.')}>
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <Button type="button" variant="outline">
            {t('sharedPages.settings.notificationsAction', 'Notification preferences')}
          </Button>
          <Button type="button" variant="secondary">
            {t('sharedPages.settings.signOutAction', 'Sign out')}
          </Button>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
