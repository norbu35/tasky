import { Pencil, Clock, Share2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell, StatePanel } from '../../layout/parity';

export function CustomerNoApplicantRescuePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('taskId');

  return (
    <ResponsiveDetailShell
      title={t('customerPages.noApplicantRescue.title')}
      description={t('customerPages.noApplicantRescue.description')}
      primaryAction={
        <Button
          type="button"
          variant="default"
          onClick={() => navigate(taskId ? `/customer/tasks/${taskId}/edit` : '/customer/tasks')}
        >
          <Pencil className="w-4 h-4 mr-2" />
          {t('customerPages.noApplicantRescue.editTask')}
        </Button>
      }
    >
      <div className="space-y-4">
        <StatePanel
          icon={<Users className="h-5 w-5 text-primary" />}
          title={t('customerPages.noApplicantRescue.recoveryTitle')}
          description={t('customerPages.noApplicantRescue.recoveryDesc')}
          tone="muted"
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('customerPages.noApplicantRescue.rescueTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
              <Pencil className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                {t('customerPages.noApplicantRescue.tipEdit')}
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
              <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                {t('customerPages.noApplicantRescue.tipExtend')}
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
              <Share2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                {t('customerPages.noApplicantRescue.tipShare')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveDetailShell>
  );
}
