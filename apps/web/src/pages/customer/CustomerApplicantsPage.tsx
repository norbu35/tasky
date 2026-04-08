import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Star, Users } from 'lucide-react';

import { ActionRail, ResponsiveDetailShell, StatePanel } from '../../components/parity';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAppContext } from '../../context/AppContext';

export function CustomerApplicantsPage() {
  const { apiClient, session } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();

  const { data: tasksPage, isLoading: tasksLoading } = useQuery({
    queryKey: ['customerTasks', session?.accessToken],
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
    queryKey: ['taskApplications', taskId, session?.accessToken],
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
      title={t('customerPages.applicants.liveTitle', 'Applicants')}
      description={t(
        'customerPages.applicants.liveDescription',
        'Review the taskers who are interested in this task and continue to acceptance when ready.',
      )}
      primaryAction={
        <Button
          type="button"
          variant="secondary"
          onClick={() => taskId && navigate(`/customer/tasks/${taskId}`)}
        >
          {t('customerPages.applicants.backToTask', 'Back to task')}
        </Button>
      }
      detailRail={
        <ActionRail
          title={t('customerPages.applicants.nextStep', 'Next step')}
          primaryAction={
            <Button
              type="button"
              className="w-full"
              onClick={() => taskId && navigate(`/customer/tasks/${taskId}`)}
            >
              {t('customerPages.applicants.reviewTask', 'Review task')}
            </Button>
          }
          footnote={
            task
              ? t('customerPages.applicants.taskContext', 'Task: {{description}}', {
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
            title={t('customerPages.applicants.invalidTitle', 'Applicants')}
            description={t(
              'customerPages.applicants.invalidDesc',
              'Task ID is missing from the route.',
            )}
            tone="destructive"
          />
        ) : loading ? (
          <StatePanel
            icon={<Users className="h-5 w-5 text-primary" />}
            title={t('customerPages.applicants.loading', 'Loading applicants...')}
            description={t(
              'customerPages.applicants.loadingDesc',
              'Loading the current applicant queue for this task.',
            )}
            tone="muted"
          />
        ) : !task ? (
          <StatePanel
            icon={<Users className="h-5 w-5 text-primary" />}
            title={t('customerPages.applicants.notFoundTitle', 'Task not found')}
            description={t(
              'customerPages.applicants.notFoundDesc',
              'This task could not be found in your customer tasks.',
            )}
            tone="destructive"
          />
        ) : applicationsError ? (
          <StatePanel
            icon={<Users className="h-5 w-5 text-primary" />}
            title={t('customerPages.applicants.errorTitle', 'Applicants unavailable')}
            description={
              applicationsError.message ??
              t(
                'customerPages.applicants.errorDesc',
                'The applicant queue could not be loaded right now.',
              )
            }
            tone="destructive"
          />
        ) : !applicationsPage?.data.length ? (
          <StatePanel
            icon={<Users className="h-5 w-5 text-primary" />}
            title={t('customerPages.applicants.emptyTitle', 'No applicants yet')}
            description={t(
              'customerPages.applicants.emptyDesc',
              'Taskers have not applied to this task yet.',
            )}
            tone="muted"
            actions={
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/customer/tasks/${task.id}/no-applicants`)}
              >
                {t('customerPages.applicants.openRescue', 'Open follow-up options')}
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
                {t('customerPages.applicants.summary', '{{count}} applicant(s) ready for review.', {
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
                          {t(
                            'customerPages.applicants.completedTasks',
                            '{{count}} completed tasks',
                            {
                              count: application.tasker.completed_tasks,
                            },
                          )}
                        </span>
                        {application.tasker.is_pro ? <Badge variant="secondary">PRO</Badge> : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:w-52">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/customer/taskers/${application.tasker.id}`)}
                    >
                      {t('customerPages.applicants.viewProfile', 'View profile')}
                    </Button>
                    <Button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/customer/booking-confirmation?taskId=${task.id}&applicationId=${application.id}`,
                        )
                      }
                    >
                      {t('customerPages.applicants.reviewAccept', 'Review & Accept')}
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
