import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Star, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ActionRail, ResponsiveDetailShell, StatePanel } from '../../layout/parity';

function formatMnt(amount: number): string {
  return `${amount.toLocaleString()} MNT`;
}

export function CustomerApplicantsPage() {
  const { apiClient, session } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();

  const { data: tasksPage, isLoading: tasksLoading } = useQuery({
    queryKey: ['customerTasks', session, apiClient],
    queryFn: async () => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      return apiClient.listMyTasks(session.accessToken);
    },
    enabled: !!session && !!taskId,
  });

  const task = tasksPage?.data.find((item) => item.id === taskId);

  const {
    data: applicationsPage,
    isLoading: applicationsLoading,
    error: applicationsError,
  } = useQuery({
    queryKey: ['taskApplications', taskId, session, apiClient],
    queryFn: async () => {
      if (!session || !taskId) {
        throw new Error('Missing task route');
      }

      return apiClient.listTaskApplications(session.accessToken, taskId);
    },
    enabled: !!session && !!taskId && !!task,
  });

  const loading = tasksLoading || applicationsLoading;

  return (
    <ResponsiveDetailShell
      title={t('customerPages.applicants.liveTitle')}
      description={t('customerPages.applicants.liveDescription')}
      primaryAction={
        <Button
          type="button"
          variant="secondary"
          onClick={() => taskId && navigate(`/customer/tasks/${taskId}`)}
        >
          {t('customerPages.applicants.backToTask')}
        </Button>
      }
      detailRail={
        <ActionRail
          title={t('customerPages.applicants.nextStep')}
          primaryAction={
            <Button
              type="button"
              className="w-full"
              onClick={() => taskId && navigate(`/customer/tasks/${taskId}`)}
            >
              {t('customerPages.applicants.reviewTask')}
            </Button>
          }
          footnote={
            task
              ? t('customerPages.applicants.taskContext', {
                  description: task.description,
                })
              : undefined
          }
        />
      }
    >
      <div className="space-y-4">
        {!taskId ? (
          <StatePanel
            icon={<Users className="h-5 w-5 text-primary" />}
            title={t('customerPages.applicants.invalidTitle')}
            description={t('customerPages.applicants.invalidDesc')}
            tone="destructive"
          />
        ) : loading ? (
          <StatePanel
            icon={<Users className="h-5 w-5 text-primary" />}
            title={t('customerPages.applicants.loading')}
            description={t('customerPages.applicants.loadingDesc')}
            tone="muted"
          />
        ) : !task ? (
          <StatePanel
            icon={<Users className="h-5 w-5 text-primary" />}
            title={t('customerPages.applicants.notFoundTitle')}
            description={t('customerPages.applicants.notFoundDesc')}
            tone="destructive"
          />
        ) : applicationsError ? (
          <StatePanel
            icon={<Users className="h-5 w-5 text-primary" />}
            title={t('customerPages.applicants.errorTitle')}
            description={applicationsError.message ?? t('customerPages.applicants.errorDesc')}
            tone="destructive"
          />
        ) : !applicationsPage?.data.length ? (
          <StatePanel
            icon={<Users className="h-5 w-5 text-primary" />}
            title={t('customerPages.applicants.emptyTitle')}
            description={t('customerPages.applicants.emptyDesc')}
            tone="muted"
            actions={
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/customer/tasks/${task.id}/no-applicants`)}
              >
                {t('customerPages.applicants.openRescue')}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>{task.description}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {t('customerPages.applicants.summary', {
                  count: applicationsPage.data.length,
                })}
              </CardContent>
            </Card>

            {applicationsPage.data.map((application) => (
              <Card key={application.id} className="border-border/60 shadow-sm">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 border">
                      {application.tasker.avatar_url ? (
                        <AvatarImage src={application.tasker.avatar_url} />
                      ) : null}
                      <AvatarFallback>
                        {application.tasker.full_name?.charAt(0) ?? 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{application.tasker.full_name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          {application.tasker.rating_avg.toFixed(1)}
                        </span>
                        <span>
                          {t('customerPages.applicants.completedTasks', {
                            count: application.tasker.completed_tasks,
                          })}
                        </span>
                        <Badge variant="secondary">
                          {t('customerPages.applicants.idVerifiedTasker')}
                        </Badge>
                        <Badge variant="outline">
                          {task.pricing_mode === 'QUOTE'
                            ? application.quote_price != null
                              ? t('customerPages.applicants.quotePrice', {
                                  amount: formatMnt(application.quote_price),
                                })
                              : t('customerPages.applicants.quoteMissing')
                            : t('customerPages.applicants.postedBudget', {
                                amount: formatMnt(task.budget ?? 0),
                              })}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:w-52">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/customer/taskers/${application.tasker.id}`)}
                    >
                      {t('customerPages.applicants.viewProfile')}
                    </Button>
                    <Button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/customer/booking-confirmation?taskId=${task.id}&applicationId=${application.id}`,
                        )
                      }
                    >
                      {t('customerPages.applicants.reviewAccept')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {application.message}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ResponsiveDetailShell>
  );
}
