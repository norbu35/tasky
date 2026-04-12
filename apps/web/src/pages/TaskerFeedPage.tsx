import { useState } from 'react';
import type { PublicTask } from '../lib/apiClient';
import { useCategoriesQuery, useTasksQuery } from '@tasky/core';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAppContext } from '../context/AppContext';
import { ScreenFrame } from '../layout/ScreenFrame';
import { parseError } from '../lib/errorHandling';
import { Coins, Loader2, MapPin, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const [working, setWorking] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [sentTaskId, setSentTaskId] = useState<string | null>(null);

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
      setActionMessage(
        t('taskerFeed.msgMinLength', 'Application message must be at least 10 characters.'),
      );
      return;
    }

    setWorking(true);
    setActionMessage(null);
    try {
      await apiClient.applyToTask(session.accessToken, taskId, draft);
      setApplyDrafts((prev) => ({ ...prev, [taskId]: '' }));
      setSentTaskId(taskId);
      trackClientEvent('APPLICATION_SUBMITTED', { taskId });
      setActionMessage(null);
      void refetchTasks();
    } catch (error) {
      setActionMessage(parseError(error));
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
            {t('taskerFeed.title', 'Open task feed')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              'taskerFeed.subtitle',
              'Find nearby opportunities in Ulaanbaatar based on your skills.',
            )}
          </p>
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
              {t('taskerFeed.allCategories', 'All')}
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
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('taskerFeed.distance', 'Distance')}:
            </span>
            <select
              title="Search radius"
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
        {actionMessage && (
          <p className="text-sm text-primary font-medium p-4 bg-primary/10 rounded-xl">
            {actionMessage}
          </p>
        )}

        {sentTaskId ? (
          <Card className="border-primary/30 bg-primary/5 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-semibold">
                {t('taskerPages.applicationSent.title', 'Application sent')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t(
                  'taskerPages.applicationSent.description',
                  'Your application has been sent to the customer and is waiting for review.',
                )}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                {t('taskerPages.applicationSent.sentDesc', 'Application sent.')}
              </p>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSentTaskId(null);
                  setActionMessage(null);
                }}
              >
                {t('taskerPages.applicationSent.backToFeed', 'Back to feed')}
              </Button>
            </CardFooter>
          </Card>
        ) : null}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingTasks && (
            <div className="flex py-12 items-center justify-center text-muted-foreground flex-col gap-4">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium">
                {t('taskerFeed.scanningMsg', 'Scanning for available tasks...')}
              </p>
            </div>
          )}

          {!loadingTasks && taskCards.length === 0 && !tasksError && (
            <div className="flex py-12 items-center justify-center text-muted-foreground flex-col gap-4 bg-muted/20 rounded-xl border border-dashed border-border">
              <Search className="w-10 h-10 opacity-20" />
              <p className="text-sm font-medium opacity-60">
                {t('taskerFeed.noTasksFound', 'No open tasks found in this area.')}
              </p>
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
                        {task.category?.name || t('taskerFeed.categoryFallback', 'Task')}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-emerald-500 border-emerald-500/30 bg-emerald-500/5 px-2.5 py-0.5 font-semibold"
                      >
                        {t('taskerFeed.statusOpen', 'Open')}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl leading-snug font-medium line-clamp-2">
                      {task.description}
                    </CardTitle>
                    <div className="text-2xl font-display font-bold text-foreground mt-1">
                      {task.budget.toLocaleString(locale)}{' '}
                      <span className="text-sm font-normal text-muted-foreground">MNT</span>
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
                    <span>{t('taskerFeed.fixedPrice', 'Fixed price')}</span>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t border-border/40 p-4 mt-auto">
                  <div className="flex flex-col gap-3 w-full">
                    <Label
                      htmlFor={`apply-${task.id}`}
                      className="text-xs uppercase font-bold text-primary tracking-wider"
                    >
                      {t('taskerFeed.appMessageLabel', 'Application message')}
                    </Label>
                    <Textarea
                      id={`apply-${task.id}`}
                      className="resize-none min-h-[80px] rounded-xl bg-background border-border/60 focus:bg-background transition-colors text-sm shadow-inner"
                      value={applyDrafts[task.id] ?? ''}
                      onChange={(e) =>
                        setApplyDrafts((prev) => ({ ...prev, [task.id]: e.target.value }))
                      }
                      placeholder={t(
                        'taskerFeed.appMessagePlaceholder',
                        'Explain why you are the best fit for this task...',
                      )}
                    />
                    <Button
                      disabled={working || (applyDrafts[task.id] ?? '').trim().length < 10}
                      onClick={() => void applyToTask(task.id)}
                      className="w-full rounded-xl font-bold py-3 text-base shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all border border-primary/20"
                    >
                      {working ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                      {t('taskerFeed.applySubmit', 'Apply to task')}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
        </div>
      </div>
    </ScreenFrame>
  );
}
