import { useQuery } from '@tanstack/react-query';
import { Calendar, ImageIcon, Loader2, MapPin, Search, Sparkles, Star } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCategoriesQuery, useTasksQuery } from '@tasky/core';

import { TaskCard } from '../components/feature/TaskCard';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAppContext } from '../context/AppContext';
import { ScreenFrame } from '../layout/ScreenFrame';
import type { PublicTask, TaskFeedItem } from '../lib/apiClient';
import { parseError } from '../lib/errorHandling';
import { formatDateTime } from '../lib/formatDate';

export function TaskerFeedPage() {
  const { apiClient, session, trackClientEvent } = useAppContext();
  const { t, i18n } = useTranslation();
  const isMongolian = (i18n.resolvedLanguage ?? i18n.language).toLowerCase().startsWith('mn');

  const [filters, setFilters] = useState<{
    categoryId: string;
    lat: string;
    lng: string;
    radiusKm: string;
  }>({
    categoryId: '',
    lat: '47.9184',
    lng: '106.9177',
    radiusKm: '10',
  });

  const [applyDrafts, setApplyDrafts] = useState<Record<string, string>>({});
  const [quotePrices, setQuotePrices] = useState<Record<string, string>>({});
  const [working, setWorking] = useState(false);
  const [sentTaskId, setSentTaskId] = useState<string | null>(null);
  const [sentApplicationId, setSentApplicationId] = useState<string | null>(null);
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);

  const { data: categoriesPage } = useCategoriesQuery(apiClient, session?.accessToken);
  const categories = categoriesPage?.data || [];

  const {
    data: tasksPage,
    isLoading: loadingTasks,
    refetch: refetchTasks,
    error: tasksError,
  } = useTasksQuery(apiClient, session?.accessToken, {
    categoryId: filters.categoryId || undefined,
    lat: Number(filters.lat),
    lng: Number(filters.lng),
    radiusKm: Number(filters.radiusKm),
  });
  const taskCards = tasksPage?.data || [];

  const {
    data: selectedTaskDetail,
    isLoading: isLoadingTaskDetail,
    isError: isTaskDetailError,
    refetch: refetchTaskDetail,
  } = useQuery({
    queryKey: ['taskDetail', session, apiClient, openDialogId],
    queryFn: async () => {
      if (!session || !openDialogId) throw new Error('Missing task detail context');
      return apiClient.getTask(session.accessToken, openDialogId);
    },
    enabled: !!session?.accessToken && !!openDialogId,
  });

  const applyToTask = async (taskId: string): Promise<void> => {
    if (!session) return;

    const draft = (applyDrafts[taskId] ?? '').trim();
    if (draft.length < 10) {
      toast.error(t('taskerFeed.msgMinLength'));
      return;
    }

    const task =
      selectedTaskDetail?.id === taskId
        ? selectedTaskDetail
        : taskCards.find((tc) => tc.id === taskId);
    const rawQuote = quotePrices[taskId]?.trim();
    if (task?.pricing_mode === 'QUOTE' && (!rawQuote || Number(rawQuote) < 20000)) {
      toast.error(t('taskerFeed.quotePriceRequired'));
      return;
    }

    setWorking(true);
    try {
      const quotePrice = task?.pricing_mode === 'QUOTE' && rawQuote ? Number(rawQuote) : null;
      const application = await apiClient.applyToTask(
        session.accessToken,
        taskId,
        draft,
        quotePrice,
      );
      setApplyDrafts((prev) => ({ ...prev, [taskId]: '' }));
      setQuotePrices((prev) => ({ ...prev, [taskId]: '' }));
      setOpenDialogId(null);
      setSentTaskId(taskId);
      setSentApplicationId(application.id);
      trackClientEvent('APPLICATION_SUBMITTED', { taskId });
      void refetchTasks();
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const withdrawApplication = async (): Promise<void> => {
    if (!session || !sentTaskId || !sentApplicationId) return;

    setWorking(true);
    try {
      await apiClient.withdrawApplication(session.accessToken, sentTaskId, sentApplicationId);
      toast.success(t('taskerFeed.withdrawSuccess'));
      setSentTaskId(null);
      setSentApplicationId(null);
      void refetchTasks();
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScreenFrame maxWidth="wide">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* ── Page header ── */}
        <div className="border-b border-border/40 pb-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary/10 ring-1 ring-inset ring-primary/15">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-semibold tracking-normal sm:text-3xl">
                {t('taskerFeed.title')}
              </h1>
            </div>
            <p className="max-w-2xl text-body-sm text-muted-foreground sm:pl-[3.25rem] sm:text-body">
              {t('taskerFeed.subtitle')}
            </p>
          </div>
        </div>

        {/* ── Category filter chips & Radius Selector ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
            <button
              type="button"
              aria-pressed={!filters.categoryId}
              onClick={() => setFilters((prev) => ({ ...prev, categoryId: '' }))}
              className={`min-h-10 flex-shrink-0 rounded-[var(--radius-sm)] border px-4 py-2 text-badge-text font-semibold transition-all duration-card-expand ease-card-expand ${
                !filters.categoryId
                  ? 'bg-primary text-primary-foreground border-primary shadow-card'
                  : 'bg-card text-muted-foreground border-border/40 hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {t('taskerFeed.allCategories')}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={filters.categoryId === c.id}
                onClick={() => setFilters((prev) => ({ ...prev, categoryId: c.id }))}
                className={`min-h-10 flex-shrink-0 rounded-[var(--radius-sm)] border px-4 py-2 text-badge-text font-semibold transition-all duration-card-expand ease-card-expand ${
                  filters.categoryId === c.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-card'
                    : 'bg-card text-muted-foreground border-border/40 hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {isMongolian ? c.name_mn : c.name}
              </button>
            ))}
          </div>

          {/* Distance Filter */}
          <div className="flex min-h-10 shrink-0 items-center gap-2.5 rounded-[var(--radius-sm)] bg-card px-4 py-2 shadow-card ring-1 ring-inset ring-border/40">
            <MapPin className="w-4 h-4 text-primary/70" />
            <span className="text-badge-text font-semibold text-muted-foreground uppercase tracking-caps">
              {t('taskerFeed.distance')}:
            </span>
            <select
              title={t('taskerFeed.searchRadiusTitle')}
              className="bg-transparent text-body-sm font-bold text-foreground focus:outline-none cursor-pointer border-none"
              value={filters.radiusKm}
              onChange={(e) => setFilters((prev) => ({ ...prev, radiusKm: e.target.value }))}
            >
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="20">20 km</option>
              <option value="50">50 km</option>
            </select>
          </div>
        </div>

        {/* ── Error state ── */}
        {tasksError && (
          <div className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-destructive/5 p-4 text-sm font-medium text-destructive ring-1 ring-inset ring-destructive/20">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-destructive/10">
              <Search className="h-4 w-4 text-destructive" />
            </div>
            {parseError(tasksError)}
          </div>
        )}

        {/* ── Application sent confirmation ── */}
        {sentTaskId ? (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent shadow-elevated">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-verified/10">
                  <Sparkles className="h-5 w-5 text-verified" />
                </div>
                <CardTitle className="text-section-heading font-display">
                  {t('taskerPages.applicationSent.title')}
                </CardTitle>
              </div>
              <p className="text-body-sm text-muted-foreground pl-[3.25rem]">
                {t('taskerPages.applicationSent.description')}
              </p>
            </CardHeader>
            <CardContent className="pt-0 pl-[3.25rem]">
              <p className="text-body-sm text-muted-foreground">
                {t('taskerPages.applicationSent.sentDesc')}
              </p>
            </CardContent>
            <CardFooter className="pl-[3.25rem] gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={working}
                onClick={() => void withdrawApplication()}
              >
                {working ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
                {t('taskerFeed.withdrawAction')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSentTaskId(null);
                  setSentApplicationId(null);
                }}
              >
                {t('taskerPages.applicationSent.backToFeed')}
              </Button>
            </CardFooter>
          </Card>
        ) : null}

        {/* ── Task cards grid ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loadingTasks && (
            <div className="col-span-full flex py-20 items-center justify-center flex-col gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-20" />
                <Loader2 className="relative w-8 h-8 text-primary animate-spin" />
              </div>
              <p className="text-body font-medium text-muted-foreground">
                {t('taskerFeed.scanningMsg')}
              </p>
            </div>
          )}

          {!loadingTasks && taskCards.length === 0 && !tasksError && (
            <div className="col-span-full flex flex-col items-center justify-center gap-5 rounded-[var(--radius-sm)] border-dashed bg-muted/10 py-20 ring-1 ring-inset ring-border/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-sm)] bg-muted/30">
                <Search className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="text-body font-medium text-muted-foreground/60">
                {t('taskerFeed.noTasksFound')}
              </p>
            </div>
          )}

          {!loadingTasks &&
            taskCards.map((task: TaskFeedItem) => {
              const detailTask: PublicTask | undefined =
                openDialogId === task.id && selectedTaskDetail?.id === task.id
                  ? selectedTaskDetail
                  : undefined;
              const showDetailLoading = openDialogId === task.id && isLoadingTaskDetail;
              const showDetailError = openDialogId === task.id && isTaskDetailError;

              return (
                <Dialog
                  key={task.id}
                  open={openDialogId === task.id}
                  onOpenChange={(open) => setOpenDialogId(open ? task.id : null)}
                >
                  <DialogTrigger asChild>
                    <TaskCard
                      task={task}
                      onOpen={() => setOpenDialogId(task.id)}
                      actionLabel={t('taskerFeed.viewAndApply')}
                    />
                  </DialogTrigger>
                  <DialogContent className="hidden-scrollbar flex max-h-[90vh] max-w-[95vw] flex-col overflow-y-auto rounded-[var(--radius-sm)] p-0 shadow-modal ring-1 ring-inset ring-border/30 sm:max-w-[600px]">
                    <div className="p-6 pb-2">
                      <DialogHeader className="mb-6">
                        <DialogTitle className="text-section-heading font-display font-semibold">
                          {t('taskerFeed.applyToTask')}
                        </DialogTitle>
                        <DialogDescription className="text-body-sm">
                          {t('taskerFeed.applyDescription')}
                        </DialogDescription>
                      </DialogHeader>

                      {showDetailLoading ? (
                        <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <span className="text-body-sm font-medium">{t('common.loading')}</span>
                        </div>
                      ) : null}

                      {showDetailError ? (
                        <div className="flex flex-col items-center gap-4 py-16 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] bg-destructive/10">
                            <Search className="w-6 h-6 text-destructive" />
                          </div>
                          <p className="text-body-sm font-medium text-destructive">
                            {t('common.error')}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void refetchTaskDetail()}
                          >
                            {t('common.retry')}
                          </Button>
                        </div>
                      ) : null}

                      {detailTask ? (
                        <div className="grid gap-5">
                          <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-muted/10 p-4 ring-1 ring-inset ring-border/30">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-11 w-11 ring-1 ring-inset ring-border/30">
                                <AvatarImage
                                  src={detailTask.customer?.avatar_url || ''}
                                  alt={detailTask.customer?.full_name || t('common.customer')}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-body-sm">
                                  {detailTask.customer?.full_name?.charAt(0) || 'C'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-sm leading-tight">
                                  {detailTask.customer?.full_name || t('common.customer')}
                                </h3>
                                <div className="flex items-center text-body-sm text-secondary font-medium mt-0.5">
                                  <Star className="w-3.5 h-3.5 fill-current mr-1" />
                                  <span>
                                    {detailTask.customer?.rating_avg?.toFixed(1) ||
                                      t('taskerFeed.newCustomerRating')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {detailTask.pricing_mode === 'QUOTE' ? (
                                <div>
                                  <div className="text-body font-semibold text-primary font-display">
                                    {t('taskerFeed.acceptingQuotes')}
                                  </div>
                                  <div className="text-badge-text font-semibold text-muted-foreground uppercase tracking-caps">
                                    {t('taskerFeed.quoteOnly')}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="text-price-display font-bold text-primary font-display">
                                    {(detailTask.budget ?? 0).toLocaleString()}
                                  </div>
                                  <div className="text-badge-text font-semibold text-muted-foreground uppercase tracking-caps">
                                    MNT
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5 rounded-[var(--radius-sm)] bg-muted/5 p-3 ring-1 ring-inset ring-border/20">
                              <div className="flex items-center text-badge-text font-semibold text-muted-foreground uppercase tracking-caps">
                                <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary/60" />
                                {t('taskerFeed.locationLabel')}
                              </div>
                              <span
                                className="font-medium text-body-sm line-clamp-1"
                                title={detailTask.approximate_location}
                              >
                                {detailTask.approximate_location}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1.5 rounded-[var(--radius-sm)] bg-muted/5 p-3 ring-1 ring-inset ring-border/20">
                              <div className="flex items-center text-badge-text font-semibold text-muted-foreground uppercase tracking-caps">
                                <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary/60" />
                                {t('taskerFeed.dateLabel')}
                              </div>
                              <span className="font-medium text-body-sm line-clamp-1">
                                {formatDateTime(detailTask.scheduled_at)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <h4 className="text-xs uppercase tracking-caps font-semibold text-muted-foreground">
                              {t('taskerFeed.descriptionLabel')}
                            </h4>
                            <div className="whitespace-pre-wrap rounded-[var(--radius-sm)] bg-background p-4 text-body-sm font-medium leading-relaxed text-foreground ring-1 ring-inset ring-border/30">
                              {detailTask.description}
                            </div>
                          </div>

                          {detailTask.photo_urls && detailTask.photo_urls.length > 0 && (
                            <div className="space-y-2.5">
                              <h4 className="text-xs uppercase tracking-caps font-semibold text-muted-foreground flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5" />
                                {t('taskerFeed.photosLabel')}
                              </h4>
                              <div className="flex flex-wrap gap-2.5">
                                {detailTask.photo_urls.map((url, idx) => (
                                  <div
                                    key={idx}
                                    className="h-24 w-24 shrink-0 overflow-hidden rounded-[var(--radius-sm)] ring-1 ring-inset ring-border/30 sm:h-28 sm:w-28"
                                  >
                                    <img
                                      src={url}
                                      alt={t('taskerFeed.taskMediaAlt', { count: idx + 1 })}
                                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-card-expand ease-card-expand"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {detailTask ? (
                      <div className="bg-muted/20 border-t border-border/30 p-6 mt-4 shrink-0">
                        <div className="flex flex-col gap-3">
                          <Label
                            htmlFor={`apply-${task.id}`}
                            className="text-badge-text font-bold text-primary uppercase tracking-caps"
                          >
                            {t('taskerFeed.appMessageLabel')}
                          </Label>
                          <Textarea
                            id={`apply-${task.id}`}
                            className="min-h-[100px] resize-none rounded-[var(--radius-sm)] bg-background text-body-sm ring-1 ring-inset ring-border/30 transition-shadow focus:ring-primary/40"
                            value={applyDrafts[task.id] ?? ''}
                            onChange={(e) =>
                              setApplyDrafts((prev) => ({
                                ...prev,
                                [task.id]: e.target.value,
                              }))
                            }
                            placeholder={t('taskerFeed.appMessagePlaceholder')}
                          />
                        </div>

                        {detailTask.pricing_mode === 'QUOTE' ? (
                          <div className="flex flex-col gap-2 mt-4">
                            <Label
                              htmlFor={`quote-${task.id}`}
                              className="text-badge-text font-semibold text-muted-foreground"
                            >
                              {t('taskerFeed.yourQuoteLabel')}
                            </Label>
                            <Input
                              id={`quote-${task.id}`}
                              type="number"
                              min="20000"
                              placeholder={t('taskerFeed.quotePlaceholder')}
                              value={quotePrices[task.id] ?? ''}
                              onChange={(e) =>
                                setQuotePrices((prev) => ({
                                  ...prev,
                                  [task.id]: e.target.value,
                                }))
                              }
                            />
                            <p className="text-caption text-muted-foreground">
                              {t('taskerFeed.quoteRequiredHint')}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-4 text-body-sm text-muted-foreground">
                            {t('taskerFeed.budgetAcceptHint')}
                          </p>
                        )}

                        <div className="mt-5">
                          <Button
                            disabled={working || (applyDrafts[task.id] ?? '').trim().length < 10}
                            onClick={() => void applyToTask(task.id)}
                            className="w-full rounded-[var(--radius-sm)] py-6 text-button-label font-bold shadow-fab transition-shadow hover:shadow-deep"
                          >
                            {working ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                            {t('taskerFeed.applySubmit')}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </DialogContent>
                </Dialog>
              );
            })}
        </div>
      </div>
    </ScreenFrame>
  );
}
