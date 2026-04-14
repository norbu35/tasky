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
      title={t('customerPages.noApplicantRescue.title', 'No applicants yet')}
      description={t(
        'customerPages.noApplicantRescue.description',
        'Nobody has applied to your task yet. Try one of the options below to attract Taskers.',
      )}
      primaryAction={
        <Button
          type="button"
          variant="default"
          onClick={() => navigate(taskId ? `/customer/tasks/${taskId}/edit` : '/customer/tasks')}
        >
          <Pencil className="w-4 h-4 mr-2" />
          {t('customerPages.noApplicantRescue.editTask', 'Edit task details')}
        </Button>
      }
    >
      <div className="space-y-4">
        <StatePanel
          icon={<Users className="h-5 w-5 text-primary" />}
          title={t('customerPages.noApplicantRescue.recoveryTitle', 'Recovery options')}
          description={t(
            'customerPages.noApplicantRescue.recoveryDesc',
            'Adjust the price, timing, or description to make your task more appealing.',
          )}
          tone="muted"
        />

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>
              {t('customerPages.noApplicantRescue.rescueTitle', 'What you can do')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Pencil className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                {t(
                  'customerPages.noApplicantRescue.tipEdit',
                  'Edit your task to raise the budget or add more detail.',
                )}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                {t(
                  'customerPages.noApplicantRescue.tipExtend',
                  'Extend the deadline so more Taskers can see it.',
                )}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Share2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                {t(
                  'customerPages.noApplicantRescue.tipShare',
                  'Share your task link with friends who might know a Tasker.',
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveDetailShell>
  );
}
