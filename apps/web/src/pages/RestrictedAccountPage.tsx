import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useAppContext } from '../context/AppContext';

export function RestrictedAccountPage() {
  const { profile, signOut } = useAppContext();
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 px-4 py-8 sm:px-6">
      <section className="mx-auto grid w-full max-w-xl gap-6">
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>{t('restricted.title', 'Account restricted')}</CardTitle>
            <CardDescription>
              {t('restricted.description', {
                status: profile?.status?.toLowerCase() ?? 'restricted',
                defaultValue: 'This account is {{status}}. Contact support for review.',
              })}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={signOut}>{t('restricted.returnLogin', 'Return to login')}</Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
