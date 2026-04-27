import { Coins, Loader2, MapPin, Search, Calendar, ImageIcon, Star } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCategoriesQuery, useTasksQuery } from '@tasky/core';

import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
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
import type { PublicTask } from '../lib/apiClient';
import { parseError } from '../lib/errorHandling';

export function TaskerFeedPage() {
  const { apiClient, session, trackClientEvent } = useAppContext();
  const { t, i18n } = useTranslation();
  const isMongolian = (i18n.resolvedLanguage ?? i18n.language).toLowerCase().startsWith('mn');
  const locale = isMongolian ? 'mn-MN' : 'en-US';

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

  const applyToTask = async (taskId: string): Promise<void> => {
    if (!session) return;

    const draft = (applyDrafts[taskId] ?? '').trim();
    if (draft.length < 10) {
      toast.error(t('taskerFeed.msgMinLength'));
      return;
    }

    const task = taskCards.find((tc) => tc.id === taskId);
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
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Page header */}
        <div className="mb-4">
          <h1 className="text-2xl font-display font-bold tracking-tight">
            {t('taskerFeed.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('taskerFeed.subtitle')}</p>
        </div>

        {/* Category filter chips & Radius Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
            <button
              type="button"
              aria-pressed={!filters.categoryId}
              onClick={() => setFilters((prev) => ({ ...prev, categoryId: '' }))}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors ${
                !filters.categoryId
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/50'
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
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors ${
                  filters.categoryId === c.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {isMongolian ? c.name_mn : c.name}
              </button>
            ))}
          </div>

          {/* Distance Filter */}
          <div className="flex items-center gap-2 shrink-0 bg-card border border-border/60 px-4 py-1.5 rounded-full shadow-sm">
            <MapPin className="w-4 h-4 text-primary/70" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.075em]">
              {t('taskerFeed.distance')}:
            </span>
            <select
              title={t('taskerFeed.searchRadiusTitle')}
              className="bg-transparent text-sm font-bold text-foreground focus:outline-none cursor-pointer border-none"
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

        {tasksError && (
          <p className="text-sm text-destructive font-medium p-4 bg-destructive/10 rounded-xl">
            {parseError(tasksError)}
          </p>
        )}

        {sentTaskId ? (
          <Card className="border-primary/30 bg-primary/5 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-display font-semibold">
                {t('taskerPages.applicationSent.title')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('taskerPages.applicationSent.description')}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                {t('taskerPages.applicationSent.sentDesc')}
              </p>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={working}
                onClick={() => void withdrawApplication()}
              >
                {working ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {t('taskerFeed.withdrawAction')}
              </Button>
              <Button
                type="button"
                variant="secondary"
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingTasks && (
            <div className="flex py-12 items-center justify-center text-muted-foreground flex-col gap-4">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm font-medium">{t('taskerFeed.scanningMsg')}</p>
            </div>
          )}

          {!loadingTasks && taskCards.length === 0 && !tasksError && (
            <div className="flex py-12 items-center justify-center text-muted-foreground flex-col gap-4 bg-muted/20 rounded-xl border border-dashed border-border">
              <Search className="w-6 h-6 opacity-20" />
              <p className="text-sm font-medium opacity-60">{t('taskerFeed.noTasksFound')}</p>
            </div>
          )}

          {!loadingTasks &&
            taskCards.map((task: PublicTask) => (
              <Card
                key={task.id}
                className="overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group border-border/80 flex flex-col h-full bg-card"
              >
                <CardHeader className="bg-muted/10 pb-4 border-b border-border/20">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="hover:bg-secondary/80 px-2.5 py-0.5">
                        {task.category?.name || t('taskerFeed.categoryFallback')}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-verified border-verified/30 bg-verified/5 px-2.5 py-0.5 font-semibold"
                      >
                        {t('taskerFeed.statusOpen')}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl leading-snug font-medium line-clamp-2">
                      {task.description}
                    </CardTitle>
                    <div className="text-2xl font-display font-bold text-foreground mt-1">
                      {task.pricing_mode === 'QUOTE' ? (
                        <span className="text-base font-medium text-muted-foreground">
                          {t('taskerFeed.acceptingQuotes')}
                        </span>
                      ) : (
                        <>
                          {(task.budget ?? 0).toLocaleString(locale)}{' '}
                          <span className="text-sm font-normal text-muted-foreground">MNT</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 pb-5 flex-1 grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-2.5 text-foreground font-medium bg-muted/20 p-2.5 rounded-lg border border-border/30 shadow-sm">
                    <MapPin className="w-4 h-4 shrink-0 text-primary/70" />
                    <span>{task.approximate_location}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground font-medium bg-muted/20 p-2.5 rounded-lg border border-border/30 shadow-sm">
                    <Coins className="w-4 h-4 shrink-0 text-primary/70" />
                    <span>
                      {task.pricing_mode === 'QUOTE'
                        ? t('taskerFeed.quoteRequest')
                        : task.budget
                          ? t('taskerFeed.budgetLabel', {
                              amount: task.budget.toLocaleString(locale),
                            })
                          : t('taskerFeed.fixedPrice')}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t border-border/40 p-4 mt-auto">
                  <Dialog
                    open={openDialogId === task.id}
                    onOpenChange={(open) => setOpenDialogId(open ? task.id : null)}
                  >
                    <DialogTrigger asChild>
                      <Button className="w-full rounded-xl shadow-md hover:-translate-y-[1px] transition-all font-semibold active:translate-y-0">
                        {t('taskerFeed.viewAndApply')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-[600px] rounded-2xl border-border/60 shadow-2xl overflow-y-auto max-h-[90vh] p-0 flex flex-col hidden-scrollbar">
                      <div className="p-6 pb-2">
                        <DialogHeader className="mb-6">
                          <DialogTitle className="text-2xl font-display font-semibold">
                            {t('taskerFeed.applyToTask')}
                          </DialogTitle>
                          <DialogDescription className="text-sm">
                            {t('taskerFeed.applyDescription')}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-6">
                          {/* Customer Row */}
                          <div className="flex items-center justify-between bg-muted/20 p-4 rounded-xl border border-border/40 shadow-sm">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-12 h-12 border border-border shadow-sm">
                                <AvatarImage
                                  src={task.customer?.avatar_url || ''}
                                  alt={task.customer?.full_name || t('common.customer')}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                  {task.customer?.full_name?.charAt(0) || 'C'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-base leading-tight">
                                  {task.customer?.full_name || t('common.customer')}
                                </h3>
                                <div className="flex items-center text-sm text-secondary font-medium mt-0.5">
                                  <Star className="w-4 h-4 fill-current mr-1" />
                                  <span>
                                    {task.customer?.rating_avg?.toFixed(1) ||
                                      t('taskerFeed.newCustomerRating')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {task.pricing_mode === 'QUOTE' ? (
                                <div>
                                  <div className="text-base font-semibold text-primary font-display">
                                    {t('taskerFeed.acceptingQuotes')}
                                  </div>
                                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.075em]">
                                    {t('taskerFeed.quoteOnly')}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="text-2xl font-bold text-primary font-display">
                                    {(task.budget ?? 0).toLocaleString(locale)}
                                  </div>
                                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.075em]">
                                    MNT
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Metrics Header */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5 p-3 bg-muted/10 rounded-xl border border-border/30">
                              <div className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-[0.075em]">
                                <MapPin className="w-4 h-4 mr-1.5 text-primary/70" />
                                {t('taskerFeed.locationLabel')}
                              </div>
                              <span
                                className="font-medium text-sm line-clamp-1"
                                title={task.approximate_location}
                              >
                                {task.approximate_location}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1.5 p-3 bg-muted/10 rounded-xl border border-border/30">
                              <div className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-[0.075em]">
                                <Calendar className="w-4 h-4 mr-1.5 text-primary/70" />
                                {t('taskerFeed.dateLabel')}
                              </div>
                              <span className="font-medium text-sm line-clamp-1">
                                {new Date(task.scheduled_at).toLocaleDateString(locale, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Task Description */}
                          <div className="space-y-3">
                            <h4 className="text-xs uppercase tracking-[0.075em] font-semibold text-muted-foreground">
                              {t('taskerFeed.descriptionLabel')}
                            </h4>
                            <div className="text-sm font-medium leading-relaxed text-foreground bg-background p-4 rounded-xl border border-border/40 shadow-sm whitespace-pre-wrap">
                              {task.description}
                            </div>
                          </div>

                          {/* Photo Gallery */}
                          {task.photo_urls && task.photo_urls.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-xs uppercase tracking-[0.075em] font-semibold text-muted-foreground flex items-center gap-1.5">
                                <ImageIcon className="w-4 h-4" />
                                {t('taskerFeed.photosLabel')}
                              </h4>
                              <div className="flex flex-wrap gap-3">
                                {task.photo_urls.map((url, idx) => (
                                  <div
                                    key={idx}
                                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border border-border/40 shadow-sm shrink-0"
                                  >
                                    <img
                                      src={url}
                                      alt={t('taskerFeed.taskMediaAlt', { count: idx + 1 })}
                                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Application Form at bottom */}
                      <div className="bg-muted/40 border-t border-border/60 p-6 mt-4 shrink-0">
                        <div className="flex flex-col gap-3">
                          <Label
                            htmlFor={`apply-${task.id}`}
                            className="text-xs uppercase font-bold text-primary tracking-[0.075em]"
                          >
                            {t('taskerFeed.appMessageLabel')}
                          </Label>
                          <Textarea
                            id={`apply-${task.id}`}
                            className="resize-none min-h-[100px] rounded-xl bg-background border-border/60 focus:bg-background transition-colors text-sm shadow-inner"
                            value={applyDrafts[task.id] ?? ''}
                            onChange={(e) =>
                              setApplyDrafts((prev) => ({ ...prev, [task.id]: e.target.value }))
                            }
                            placeholder={t('taskerFeed.appMessagePlaceholder')}
                          />
                        </div>

                        {task.pricing_mode === 'QUOTE' ? (
                          <div className="flex flex-col gap-2 mt-4">
                            <Label htmlFor={`quote-${task.id}`}>
                              {t('taskerFeed.yourQuoteLabel')}
                            </Label>
                            <Input
                              id={`quote-${task.id}`}
                              type="number"
                              min="20000"
                              placeholder={t('taskerFeed.quotePlaceholder')}
                              value={quotePrices[task.id] ?? ''}
                              onChange={(e) =>
                                setQuotePrices((prev) => ({ ...prev, [task.id]: e.target.value }))
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              {t('taskerFeed.quoteRequiredHint')}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-4 text-sm text-muted-foreground">
                            {t('taskerFeed.budgetAcceptHint')}
                          </p>
                        )}

                        <div className="mt-5">
                          <Button
                            disabled={working || (applyDrafts[task.id] ?? '').trim().length < 10}
                            onClick={() => void applyToTask(task.id)}
                            className="w-full rounded-xl font-bold py-6 text-base shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all border border-primary/20"
                          >
                            {working ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                            {t('taskerFeed.applySubmit')}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
        </div>
      </div>
    </ScreenFrame>
  );
}
