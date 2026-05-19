import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Save } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import {
  createTaskSchema,
  generateIntakeScopeSummary,
  normalizeCategoryIntakeSchema,
} from '@tasky/core';

import { IntakeFormRenderer } from '../../components/feature/task-creation/IntakeFormRenderer';
import { LocationPicker } from '../../components/feature/task-creation/LocationPicker';
import { PhotoUploadManager } from '../../components/feature/task-creation/PhotoUploadManager';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useAppContext } from '../../context/AppContext';
import { ResponsiveWizardShell, StatePanel } from '../../layout/parity';
import type { Category, Task } from '../../lib/apiClient';
import { parseError } from '../../lib/errorHandling';

const PRICING_MODES = ['BUDGET', 'QUOTE'] as const;
type PricingMode = (typeof PRICING_MODES)[number];

export function CustomerTaskWizardPage() {
  const { t, i18n } = useTranslation();
  const { apiClient, session, trackClientEvent } = useAppContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, unknown>>({});
  const [summaryManuallyEdited, setSummaryManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [pricingMode, setPricingMode] = useState<PricingMode>('BUDGET');
  const [budget, setBudget] = useState('50000');
  const [locationText, setLocationText] = useState('');
  const [locationLat, setLocationLat] = useState(47.9184);
  const [locationLng, setLocationLng] = useState(106.9177);
  const [scheduledAt, setScheduledAt] = useState('');
  const [photoKeys, setPhotoKeys] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdTask, setCreatedTask] = useState<Task | null>(null);

  const { data: categoriesPage } = useQuery({
    queryKey: ['customerTaskWizardCategories', session, apiClient],
    queryFn: async () => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      return apiClient.listCategories(session.accessToken);
    },
    enabled: Boolean(session),
  });

  const { data: recentLocations } = useQuery({
    queryKey: ['recentLocations', session, apiClient],
    queryFn: async () => {
      if (!session) return [];
      return apiClient.listMyRecentLocations(session.accessToken);
    },
    enabled: Boolean(session),
  });

  useEffect(() => {
    if (categoriesPage?.data) {
      setCategories(categoriesPage.data);
      setCategoryId((current) => current || categoriesPage.data[0]?.id || '');
    }
  }, [categoriesPage]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId],
  );

  const intakeSchema = useMemo(
    () => (selectedCategory ? normalizeCategoryIntakeSchema(selectedCategory) : null),
    [selectedCategory],
  );

  useEffect(() => {
    setIntakeAnswers({});
    setSummaryManuallyEdited(false);
    if (intakeSchema) {
      setDescription('');
    }
  }, [categoryId, intakeSchema]);

  const handleIntakeChange = (fieldName: string, value: unknown) => {
    setIntakeAnswers((current) => {
      const next = { ...current, [fieldName]: value };
      if (!summaryManuallyEdited && intakeSchema) {
        setDescription(
          generateIntakeScopeSummary(intakeSchema, next, {
            locale: i18n.language === 'mn' ? 'mn' : 'en',
            yesLabel: t('common.yes'),
            noLabel: t('common.no'),
          }),
        );
      }
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) {
      return;
    }

    setWorking(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const parsedBudget = pricingMode === 'BUDGET' ? Number(budget) : null;

      const payload = createTaskSchema.parse({
        category_id: categoryId,
        description: description.trim(),
        budget: parsedBudget,
        location_lat: locationLat,
        location_lng: locationLng,
        location_text: locationText.trim(),
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : '',
        photo_keys: photoKeys,
      });

      const created = await apiClient.createTask(session.accessToken, {
        ...payload,
        pricing_mode: pricingMode,
        budget: parsedBudget,
        intake_answers: intakeSchema ? intakeAnswers : {},
        intake_schema_version: intakeSchema?.version ?? 1,
        scope_summary: intakeSchema ? description.trim() : null,
      });

      setCreatedTask(created);
      setSuccessMessage(t('customerPages.taskWizard.successMessage'));
      trackClientEvent('TASK_POSTED', { taskId: created.id });
    } catch (error) {
      setErrorMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  return (
    <ResponsiveWizardShell
      title={t('customerPages.taskWizard.title')}
      description={t('customerPages.taskWizard.description')}
      stepLabel={t('customerPages.taskWizard.stepLabel')}
      footer={
        <div className="flex flex-wrap gap-3">
          <Button type="submit" form="customer-task-form" disabled={working} size="lg">
            {working ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )}
            {t('customerPages.taskWizard.createAction')}
          </Button>
          <Button type="button" variant="outline" size="lg">
            <Plus className="mr-2 h-5 w-5" />
            {t('customerPages.taskWizard.saveDraft')}
          </Button>
        </div>
      }
    >
      <form id="customer-task-form" className="space-y-6" onSubmit={handleSubmit}>
        {errorMessage ? (
          <StatePanel
            title={t('customerPages.taskWizard.errorTitle')}
            description={errorMessage}
            tone="destructive"
          />
        ) : null}

        {successMessage ? (
          <StatePanel
            title={t('customerPages.taskWizard.successTitle')}
            description={successMessage}
            tone="muted"
          />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>{t('customerPages.taskWizard.basicsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <p className="text-body-sm text-muted-foreground">
              {t('customerPages.taskWizard.basicsDesc')}
            </p>
            <div className="grid gap-2">
              <Label htmlFor="task-category">{t('customerPages.taskWizard.categoryLabel')}</Label>
              <select
                id="task-category"
                className="flex h-12 w-full rounded-lg border-[1.5px] border-border/60 bg-muted/20 px-4 py-3 text-body font-sans text-foreground transition-all duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:border-border hover:bg-muted/30 focus-visible:outline-none focus-visible:bg-background focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">{t('customerPages.taskWizard.selectCategory')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {intakeSchema ? (
              <div className="grid gap-4 rounded-xl bg-muted/15 p-5 ring-1 ring-inset ring-border/30">
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold uppercase tracking-caps text-muted-foreground">
                    {t('customerPages.taskWizard.intakeTitle')}
                  </h3>
                  <p className="text-body-sm text-muted-foreground">
                    {t('customerPages.taskWizard.intakeDesc')}
                  </p>
                </div>
                <IntakeFormRenderer
                  schema={intakeSchema}
                  values={intakeAnswers}
                  onChange={handleIntakeChange}
                  locale={i18n.language === 'mn' ? 'mn' : 'en'}
                />
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="task-description">{t('customerPages.taskWizard.taskDetails')}</Label>
              <Textarea
                id="task-description"
                placeholder={t('customerPages.taskWizard.detailsPlaceholder')}
                value={description}
                onChange={(event) => {
                  setSummaryManuallyEdited(true);
                  setDescription(event.target.value);
                }}
                className="bg-muted/20 hover:bg-muted/30 focus-visible:bg-background focus-visible:border-foreground/40"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('customerPages.taskWizard.scheduleTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t('customerPages.taskWizard.pricingModeLabel')}</Label>
              <div className="flex gap-2">
                {PRICING_MODES.map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={pricingMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPricingMode(mode)}
                    className={
                      pricingMode === mode ? 'shadow-fab' : 'ring-1 ring-inset ring-border/40'
                    }
                  >
                    {mode === 'BUDGET'
                      ? t('customerPages.taskWizard.budgetMode')
                      : t('customerPages.taskWizard.quoteMode')}
                  </Button>
                ))}
              </div>
            </div>

            {pricingMode === 'BUDGET' ? (
              <div className="grid gap-2">
                <Label htmlFor="task-budget">{t('customerPages.taskWizard.budgetLabel')}</Label>
                <Input
                  id="task-budget"
                  type="number"
                  min="20000"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                />
              </div>
            ) : (
              <div className="flex items-center">
                <div className="grid gap-1.5 rounded-lg bg-muted/20 p-4 ring-1 ring-inset ring-border/30">
                  <Label>{t('customerPages.taskWizard.quoteModeHint')}</Label>
                  <p className="text-body-sm text-muted-foreground">
                    {t('customerPages.taskWizard.quoteModeDesc')}
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="task-scheduled-at">
                {t('customerPages.taskWizard.scheduledAtLabel')}
              </Label>
              <Input
                id="task-scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </div>

            <div className="grid gap-2.5 md:col-span-2">
              <Label htmlFor="task-location-text">
                {t('customerPages.taskWizard.addressLabel')}
              </Label>
              {recentLocations && recentLocations.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-badge-text text-muted-foreground">
                    {t('customerPages.taskWizard.recentLocations')}
                  </span>
                  {recentLocations.map((loc, i) => (
                    <button
                      key={i}
                      type="button"
                      className="rounded-full bg-muted/30 px-3 py-1 text-badge-text font-medium text-primary ring-1 ring-inset ring-border/30 transition-colors hover:bg-primary/10 hover:ring-primary/20"
                      onClick={() => {
                        setLocationText(loc.location_text);
                        setLocationLat(loc.location_lat);
                        setLocationLng(loc.location_lng);
                      }}
                    >
                      {loc.location_text}
                    </button>
                  ))}
                </div>
              )}
              <Input
                id="task-location-text"
                placeholder={t('customerPages.taskWizard.addressPlaceholder')}
                value={locationText}
                onChange={(event) => setLocationText(event.target.value)}
              />
            </div>

            <div className="grid gap-4 md:col-span-2">
              <LocationPicker
                lat={locationLat}
                lng={locationLng}
                onChange={(lat, lng) => {
                  setLocationLat(lat);
                  setLocationLng(lng);
                }}
              />
              <PhotoUploadManager photoKeys={photoKeys} onPhotoKeysChange={setPhotoKeys} />
            </div>
          </CardContent>
        </Card>

        {createdTask ? (
          <StatePanel
            title={t('customerPages.taskWizard.draftSaved')}
            description={t('customerPages.taskWizard.taskId', {
              id: createdTask.id,
            })}
            tone="muted"
          />
        ) : null}
      </form>
    </ResponsiveWizardShell>
  );
}
