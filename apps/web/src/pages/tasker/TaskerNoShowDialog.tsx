import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function TaskerNoShowDialog() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell title={t('taskerPages.noShow.title', 'No-show reminder')} description={t('taskerPages.noShow.description', 'Record a no-show reminder before escalation.')}>
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('taskerPages.noShow.content', 'This keeps the manual verification and dispute process explicit for Phase 1.')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
