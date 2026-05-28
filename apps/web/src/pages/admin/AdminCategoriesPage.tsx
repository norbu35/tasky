import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { useAppContext } from '../../context/AppContext';
import { useAdminApiClient } from '../../lib/adminApiClient';
import type { Category, CategorySchemaVersion, AdminCategoryPayload } from '../../lib/apiClient';

interface CategoryFormValues {
  name: string;
  name_mn: string;
  icon_url: string;
  sort_order: number;
  intake_enabled: boolean;
  assisted_distribution_enabled: boolean;
}

function CategoryFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  isEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: CategoryFormValues | null;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  isEdit: boolean;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CategoryFormValues>({
    name: '',
    name_mn: '',
    icon_url: '',
    sort_order: 0,
    intake_enabled: true,
    assisted_distribution_enabled: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && initial) {
      setForm(initial);
    } else if (open && !initial) {
      setForm({
        name: '',
        name_mn: '',
        icon_url: '',
        sort_order: 0,
        intake_enabled: true,
        assisted_distribution_enabled: false,
      });
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('admin.categories.editTitle') : t('admin.categories.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('admin.categories.editDesc') : t('admin.categories.createDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-name-mn">name_mn</Label>
            <Input
              id="cat-name-mn"
              value={form.name_mn}
              onChange={(e) => setForm((f) => ({ ...f, name_mn: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-icon">Icon URL</Label>
            <Input
              id="cat-icon"
              value={form.icon_url}
              onChange={(e) => setForm((f) => ({ ...f, icon_url: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-sort-order">Sort Order</Label>
            <Input
              id="cat-sort-order"
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
            <Label htmlFor="cat-intake-enabled">{t('admin.categories.intake')}</Label>
            <Switch
              id="cat-intake-enabled"
              checked={form.intake_enabled}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, intake_enabled: checked }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
            <Label htmlFor="cat-assisted-distribution">
              {t('admin.categories.assistedDistribution')}
            </Label>
            <Switch
              id="cat-assisted-distribution"
              checked={form.assisted_distribution_enabled}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, assisted_distribution_enabled: checked }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SchemaFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (schemaJson: Record<string, unknown>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [jsonText, setJsonText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setJsonText('');
      setParseError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;
      setParseError(null);
      setSubmitting(true);
      try {
        await onSubmit(parsed);
        onOpenChange(false);
      } finally {
        setSubmitting(false);
      }
    } catch {
      setParseError(t('admin.categories.invalidJson'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.categories.createSchemaTitle')}</DialogTitle>
          <DialogDescription>{t('admin.categories.createSchemaDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="schema-json">Schema JSON</Label>
            <Textarea
              id="schema-json"
              rows={12}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="font-mono text-body-sm"
              placeholder={`[
  {
    "key": "example",
    "label": "Example field",
    "label_mn": "Жишээ талбар",
    "type": "single_select",
    "required": true,
    "options": [
      { "value": "opt1", "label": "Option 1", "label_mn": "Сонголт 1" }
    ]
  }
]`}
            />
            {parseError && <p className="text-body-sm text-destructive">{parseError}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'DRAFT':
      return 'secondary';
    case 'CANARY':
      return 'outline';
    case 'ROLLED_BACK':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function SchemaVersionsPanel({ categoryId }: { categoryId: string }) {
  const { t } = useTranslation();
  const { session } = useAppContext();
  const adminApiClient = useAdminApiClient();
  const [versions, setVersions] = useState<CategorySchemaVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);

  const fetchSchemas = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const result = await adminApiClient.adminListCategorySchemas(session.accessToken, categoryId);
      setVersions(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.categories.loadSchemasError'));
    } finally {
      setLoading(false);
    }
  }, [adminApiClient, session, categoryId, t]);

  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  const handleCreateSchema = async (schemaJson: Record<string, unknown>) => {
    if (!session) return;
    try {
      const created = await adminApiClient.adminCreateCategorySchema(
        session.accessToken,
        categoryId,
        schemaJson,
        undefined,
      );
      setVersions((prev) => [...prev, created]);
      toast.success(t('admin.categories.schemaCreated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.categories.createSchemaError'));
    }
  };

  const handleActivate = async (version: number) => {
    if (!session) return;
    try {
      const updated = await adminApiClient.adminActivateCategorySchema(
        session.accessToken,
        categoryId,
        version,
        'ACTIVE',
      );
      setVersions((prev) => prev.map((v) => (v.version === updated.version ? updated : v)));
      toast.success(t('admin.categories.schemaActivated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.categories.activateSchemaError'));
    }
  };

  const handleRollback = async (version: number) => {
    if (!session) return;
    try {
      const updated = await adminApiClient.adminActivateCategorySchema(
        session.accessToken,
        categoryId,
        version,
        'ROLLBACK_TO_LAST_KNOWN_GOOD',
      );
      setVersions((prev) => prev.map((v) => (v.version === updated.version ? updated : v)));
      toast.success(t('admin.categories.schemaRolledBack'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.categories.rollbackSchemaError'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 p-6">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="border-t border-border/30 px-6 py-4 space-y-3 bg-muted/10">
      <div className="flex items-center justify-between">
        <h4 className="text-label font-semibold">{t('admin.categories.schemaVersions')}</h4>
        <Button size="sm" variant="outline" onClick={() => setSchemaDialogOpen(true)}>
          {t('admin.categories.createSchema')}
        </Button>
      </div>

      {versions.length === 0 && (
        <p className="text-body-sm text-muted-foreground">{t('admin.categories.noSchemas')}</p>
      )}

      {versions.map((sv) => (
        <div
          key={sv.version}
          data-testid={`schema-row-${sv.version}`}
          className="flex items-center justify-between rounded-lg border border-border/40 bg-card px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-label font-semibold">v{sv.version}</span>
            <Badge variant={statusBadgeVariant(sv.status)}>{sv.status}</Badge>
            <span className="text-badge-text text-muted-foreground">{sv.created_at}</span>
          </div>
          <div className="flex gap-2">
            {(sv.status === 'DRAFT' || sv.status === 'CANARY') && (
              <Button size="sm" variant="default" onClick={() => handleActivate(sv.version)}>
                {t('admin.categories.activate')}
              </Button>
            )}
            {sv.status === 'ACTIVE' && (
              <Button size="sm" variant="destructive" onClick={() => handleRollback(sv.version)}>
                {t('admin.categories.rollback')}
              </Button>
            )}
          </div>
        </div>
      ))}

      <SchemaFormDialog
        open={schemaDialogOpen}
        onOpenChange={setSchemaDialogOpen}
        onSubmit={handleCreateSchema}
      />
    </div>
  );
}

export function AdminCategoriesPage() {
  const { t } = useTranslation();
  const { session } = useAppContext();
  const adminApiClient = useAdminApiClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const result = await adminApiClient.adminListCategories(session.accessToken);
      setCategories(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.categories.loadError'));
    } finally {
      setLoading(false);
    }
  }, [adminApiClient, session, t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = () => {
    setEditingCategory(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormDialogOpen(true);
  };

  const handleFormSubmit = async (values: CategoryFormValues) => {
    if (!session) return;

    const payload: AdminCategoryPayload = {
      name: values.name,
      name_mn: values.name_mn,
      icon_url: values.icon_url,
      sort_order: values.sort_order,
      intake_enabled: values.intake_enabled,
      assisted_distribution_enabled: values.assisted_distribution_enabled,
    };

    try {
      if (editingCategory) {
        const updated = await adminApiClient.adminUpdateCategory(
          session.accessToken,
          editingCategory.id,
          payload,
        );
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast.success(t('admin.categories.updated'));
      } else {
        const created = await adminApiClient.adminCreateCategory(session.accessToken, payload);
        setCategories((prev) => [...prev, created]);
        toast.success(t('admin.categories.created'));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.categories.saveError'));
    }
  };

  const handleToggleActive = async (category: Category) => {
    if (!session) return;
    try {
      const updated = await adminApiClient.adminUpdateCategory(session.accessToken, category.id, {
        is_active: !category.is_active,
      });
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success(
        updated.is_active ? t('admin.categories.activated') : t('admin.categories.deactivated'),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.categories.toggleStatusError'));
    }
  };

  const handleToggleSchemas = (categoryId: string) => {
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  if (loading) {
    return (
      <div data-testid="categories-loading" className="space-y-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t('admin.categories.title')}
        </h1>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t('admin.categories.title')}
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <p className="text-body-sm text-destructive">{t('admin.categories.loadError')}</p>
            <Button variant="outline" size="sm" onClick={fetchCategories}>
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t('admin.categories.title')}
        </h1>
        <Button onClick={handleCreate}>{t('admin.categories.create')}</Button>
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-body-sm text-muted-foreground">{t('admin.categories.empty')}</p>
          </CardContent>
        </Card>
      )}

      {categories.map((category) => (
        <Card
          key={category.id}
          data-testid={`category-row-${category.id}`}
          className="overflow-hidden"
        >
          <CardHeader className="p-0 border-b-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
              <div className="p-6 flex flex-1 items-start gap-4">
                {category.icon_url ? (
                  <div className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden ring-1 ring-inset ring-border/20 shadow-sm bg-muted/10 flex items-center justify-center transition-transform hover:scale-105">
                    <img
                      src={category.icon_url}
                      alt={category.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-inset ring-primary/20">
                    <span className="text-xl font-bold text-primary">
                      {category.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1 py-1">
                  <div className="flex items-center gap-3 mb-1">
                    <CardTitle className="text-xl sm:text-2xl font-bold truncate">
                      {category.name}
                    </CardTitle>
                    <Badge variant={category.is_active ? 'verified' : 'secondary'} size="sm" isCaps>
                      {category.is_active
                        ? t('admin.categories.active')
                        : t('admin.categories.inactive')}
                    </Badge>
                  </div>
                  <p className="text-body-sm font-medium text-muted-foreground">
                    {category.name_mn}
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 sm:py-0 sm:border-l border-border/10 flex items-center gap-3 bg-muted/5 sm:h-full">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={category.is_active}
                    onCheckedChange={() => handleToggleActive(category)}
                    aria-label={t('admin.categories.toggleCategoryAria', {
                      name: category.name,
                    })}
                  />
                  <div className="h-8 w-[1px] bg-border/20 hidden sm:block mx-1" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(category)}
                    className="rounded-xl"
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleSchemas(category.id)}
                    className="rounded-xl"
                  >
                    {t('admin.categories.schemas')}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 border-t border-border/10 pt-4">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-primary/40" />
                {t('admin.categories.sortOrder')}:{' '}
                <span className="text-foreground/70">{category.sort_order}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-primary/40" />
                {t('admin.categories.intake')}:{' '}
                <span className={category.intake_enabled ? 'text-verified' : 'text-destructive/70'}>
                  {category.intake_enabled ? t('common.enabled') : t('common.disabled')}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-primary/40" />
                {t('admin.categories.assistedDistribution')}:{' '}
                <span
                  className={
                    category.assisted_distribution_enabled ? 'text-verified' : 'text-destructive/70'
                  }
                >
                  {category.assisted_distribution_enabled
                    ? t('common.enabled')
                    : t('common.disabled')}
                </span>
              </span>
            </div>
          </CardContent>

          {expandedCategoryId === category.id && (
            <CardFooter className="block p-0 border-t border-border/10">
              <SchemaVersionsPanel categoryId={category.id} />
            </CardFooter>
          )}
        </Card>
      ))}

      <CategoryFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        initial={
          editingCategory
            ? {
                name: editingCategory.name,
                name_mn: editingCategory.name_mn,
                icon_url: editingCategory.icon_url,
                sort_order: editingCategory.sort_order,
                intake_enabled: editingCategory.intake_enabled,
                assisted_distribution_enabled: editingCategory.assisted_distribution_enabled,
              }
            : null
        }
        onSubmit={handleFormSubmit}
        isEdit={editingCategory !== null}
      />
    </div>
  );
}
