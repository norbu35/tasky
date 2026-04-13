import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function TaskerProfilePolishPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('taskerPages.profilePolish.title', 'AI profile polish')}
      description={t(
        'taskerPages.profilePolish.description',
        'Refine your tasker profile copy before publishing.',
      )}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>
            {t(
              'taskerPages.profilePolish.content',
              'Phase 1 uses a simple review-and-apply loop for profile improvements.',
            )}
          </p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
