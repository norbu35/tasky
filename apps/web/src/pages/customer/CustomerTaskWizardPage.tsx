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
            yesLabel: t('common.yes', 'Yes'),
            noLabel: t('common.no', 'No'),
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
      setSuccessMessage(t('customerPages.taskWizard.successMessage', 'Task created successfully.'));
      trackClientEvent('TASK_POSTED', { taskId: created.id });
    } catch (error) {
      setErrorMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  return (
    <ResponsiveWizardShell
      title={t('customerPages.taskWizard.title', 'Create task')}
      description={t(
        'customerPages.taskWizard.description',
        'Choose a category, capture the scope, and post it for taskers.',
      )}
      stepLabel={t('customerPages.taskWizard.stepLabel', 'Phase 1 customer posting')}
      footer={
        <div className="flex flex-wrap gap-3">
          <Button type="submit" form="customer-task-form" disabled={working}>
            {working ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('customerPages.taskWizard.createAction', 'Create task')}
          </Button>
          <Button type="button" variant="secondary">
            <Plus className="mr-2 h-4 w-4" />
            {t('customerPages.taskWizard.saveDraft', 'Save draft')}
          </Button>
        </div>
      }
    >
      <form id="customer-task-form" className="space-y-6" onSubmit={handleSubmit}>
        {errorMessage ? (
          <StatePanel
            title={t('customerPages.taskWizard.errorTitle', 'Unable to create task')}
            description={errorMessage}
            tone="destructive"
          />
        ) : null}

        {successMessage ? (
          <StatePanel
            title={t('customerPages.taskWizard.successTitle', 'Task posted successfully')}
            description={successMessage}
            tone="muted"
          />
        ) : null}

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>{t('customerPages.taskWizard.basicsTitle', 'Task basics')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-sm text-muted-foreground">
              {t(
                'customerPages.taskWizard.basicsDesc',
                'Add photos and place the map pin so taskers can find the job. Browser prompts for location and uploads may appear while you complete this form.',
              )}
            </p>
            <div className="grid gap-2">
              <Label htmlFor="task-category">
                {t('customerPages.taskWizard.categoryLabel', 'Category')}
              </Label>
              <select
                id="task-category"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">
                  {t('customerPages.taskWizard.selectCategory', 'Select category')}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {intakeSchema ? (
              <div className="grid gap-4 rounded-lg border border-border/60 p-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.075em] text-muted-foreground">
                    {t('customerPages.taskWizard.intakeTitle', 'Intake')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      'customerPages.taskWizard.intakeDesc',
                      'Use the answers below to auto-generate the task summary.',
                    )}
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
              <Label htmlFor="task-description">
                {t('customerPages.taskWizard.taskDetails', 'Task details')}
              </Label>
              <Textarea
                id="task-description"
                placeholder={t(
                  'customerPages.taskWizard.detailsPlaceholder',
                  'Auto-generated from your answers above',
                )}
                value={description}
                onChange={(event) => {
                  setSummaryManuallyEdited(true);
                  setDescription(event.target.value);
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>
              {t('customerPages.taskWizard.scheduleTitle', 'Schedule and pricing')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t('customerPages.taskWizard.pricingModeLabel', 'Pricing')}</Label>
              <div className="flex gap-2">
                {PRICING_MODES.map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={pricingMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPricingMode(mode)}
                  >
                    {mode === 'BUDGET'
                      ? t('customerPages.taskWizard.budgetMode', 'I have a budget')
                      : t('customerPages.taskWizard.quoteMode', 'I want quotes')}
                  </Button>
                ))}
              </div>
            </div>

            {pricingMode === 'BUDGET' ? (
              <div className="grid gap-2">
                <Label htmlFor="task-budget">
                  {t('customerPages.taskWizard.budgetLabel', 'Budget (MNT)')}
                </Label>
                <Input
                  id="task-budget"
                  type="number"
                  min="20000"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>
                  {t(
                    'customerPages.taskWizard.quoteModeHint',
                    'Taskers will send you price quotes',
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t(
                    'customerPages.taskWizard.quoteModeDesc',
                    "You don't set a price. Taskers will submit their quotes and you pick the best offer.",
                  )}
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="task-scheduled-at">
                {t('customerPages.taskWizard.scheduledAtLabel', 'Scheduled at')}
              </Label>
              <Input
                id="task-scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="task-location-text">
                {t('customerPages.taskWizard.addressLabel', 'Address description')}
              </Label>
              {recentLocations && recentLocations.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">
                    {t('customerPages.taskWizard.recentLocations', 'Recent:')}
                  </span>
                  {recentLocations.map((loc, i) => (
                    <button
                      key={i}
                      type="button"
                      className="text-xs text-primary underline underline-offset-2 hover:text-primary/80"
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
                placeholder={t(
                  'customerPages.taskWizard.addressPlaceholder',
                  'ХУД, 15-р хороо, Олимп хотхон',
                )}
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
            title={t('customerPages.taskWizard.draftSaved', 'Draft saved in-memory')}
            description={t('customerPages.taskWizard.taskId', 'Task ID: {{id}}', {
              id: createdTask.id,
            })}
            tone="muted"
          />
        ) : null}
      </form>
    </ResponsiveWizardShell>
  );
}
