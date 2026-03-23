import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppContext } from "../../context/AppContext";
import type { Category, CategorySchemaVersion, AdminCategoryPayload } from "../../../lib/apiClient";
import { Card, CardContent } from "../../../components/ui/card";
import { Switch } from "../../../components/ui/switch";
import { Skeleton } from "../../../components/ui/skeleton";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

// ── Category Form Dialog ─────────────────────────────────────────────

interface CategoryFormValues {
  name: string;
  name_mn: string;
  icon_url: string;
  sort_order: number;
  intake_enabled: boolean;
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
    name: "",
    name_mn: "",
    icon_url: "",
    sort_order: 0,
    intake_enabled: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && initial) {
      setForm(initial);
    } else if (open && !initial) {
      setForm({ name: "", name_mn: "", icon_url: "", sort_order: 0, intake_enabled: true });
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
            {isEdit
              ? t("admin.categories.editTitle", "Edit Category")
              : t("admin.categories.createTitle", "Create Category")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("admin.categories.editDesc", "Update category details.")
              : t("admin.categories.createDesc", "Add a new service category.")}
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
              onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Schema Form Dialog ───────────────────────────────────────────────

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
  const [jsonText, setJsonText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setJsonText("");
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
      setParseError("Invalid JSON");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin.categories.createSchemaTitle", "Create Schema Version")}</DialogTitle>
          <DialogDescription>
            {t("admin.categories.createSchemaDesc", "Paste the JSON schema for this category.")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="schema-json">Schema JSON</Label>
            <Textarea
              id="schema-json"
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{"type":"object","properties":{}}'
            />
            {parseError && <p className="text-sm text-destructive">{parseError}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Schema status badge variant helper ───────────────────────────────

function statusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "DRAFT":
      return "secondary";
    case "CANARY":
      return "outline";
    case "ROLLED_BACK":
      return "destructive";
    default:
      return "secondary";
  }
}

// ── Schema Versions Panel ────────────────────────────────────────────

function SchemaVersionsPanel({
  categoryId,
}: {
  categoryId: string;
}) {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();
  const [versions, setVersions] = useState<CategorySchemaVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);

  const fetchSchemas = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const result = await apiClient.adminListCategorySchemas(session.accessToken, categoryId);
      setVersions(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load schemas");
    } finally {
      setLoading(false);
    }
  }, [apiClient, session, categoryId]);

  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  const handleCreateSchema = async (schemaJson: Record<string, unknown>) => {
    if (!session) return;
    try {
      const created = await apiClient.adminCreateCategorySchema(
        session.accessToken,
        categoryId,
        schemaJson,
        undefined
      );
      setVersions((prev) => [...prev, created]);
      toast.success(t("admin.categories.schemaCreated", "Schema version created"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create schema");
      throw err;
    }
  };

  const handleActivate = async (version: number) => {
    if (!session) return;
    try {
      const updated = await apiClient.adminActivateCategorySchema(
        session.accessToken,
        categoryId,
        version,
        "ACTIVE"
      );
      setVersions((prev) =>
        prev.map((v) => (v.version === updated.version ? updated : v))
      );
      toast.success(t("admin.categories.schemaActivated", "Schema version activated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to activate schema");
    }
  };

  const handleRollback = async (version: number) => {
    if (!session) return;
    try {
      const updated = await apiClient.adminActivateCategorySchema(
        session.accessToken,
        categoryId,
        version,
        "rollback"
      );
      setVersions((prev) =>
        prev.map((v) => (v.version === updated.version ? updated : v))
      );
      toast.success(t("admin.categories.schemaRolledBack", "Schema version rolled back"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rollback schema");
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          {t("admin.categories.schemaVersions", "Schema Versions")}
        </h4>
        <Button size="sm" variant="outline" onClick={() => setSchemaDialogOpen(true)}>
          {t("admin.categories.createSchema", "Create Schema")}
        </Button>
      </div>

      {versions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t("admin.categories.noSchemas", "No schema versions yet.")}
        </p>
      )}

      {versions.map((sv) => (
        <div
          key={sv.version}
          data-testid={`schema-row-${sv.version}`}
          className="flex items-center justify-between rounded-md border p-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">v{sv.version}</span>
            <Badge variant={statusBadgeVariant(sv.status)}>{sv.status}</Badge>
            <span className="text-xs text-muted-foreground">{sv.created_at}</span>
          </div>
          <div className="flex gap-2">
            {(sv.status === "DRAFT" || sv.status === "CANARY") && (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleActivate(sv.version)}
              >
                {t("admin.categories.activate", "Activate")}
              </Button>
            )}
            {sv.status === "ACTIVE" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRollback(sv.version)}
              >
                {t("admin.categories.rollback", "Rollback")}
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

// ── Main Page ────────────────────────────────────────────────────────

export function AdminCategoriesPage() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Expanded schema section
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.adminListCategories(session.accessToken);
      setCategories(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [apiClient, session]);

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
    };

    try {
      if (editingCategory) {
        const updated = await apiClient.adminUpdateCategory(
          session.accessToken,
          editingCategory.id,
          payload
        );
        setCategories((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        toast.success(t("admin.categories.updated", "Category updated"));
      } else {
        const created = await apiClient.adminCreateCategory(session.accessToken, payload);
        setCategories((prev) => [...prev, created]);
        toast.success(t("admin.categories.created", "Category created"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save category");
      throw err;
    }
  };

  const handleToggleActive = async (category: Category) => {
    if (!session) return;
    try {
      const updated = await apiClient.adminUpdateCategory(
        session.accessToken,
        category.id,
        { isActive: !category.is_active }
      );
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      toast.success(
        updated.is_active
          ? t("admin.categories.activated", "Category activated")
          : t("admin.categories.deactivated", "Category deactivated")
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle category status");
    }
  };

  const handleToggleSchemas = (categoryId: string) => {
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  // Loading state
  if (loading) {
    return (
      <div data-testid="categories-loading" className="space-y-4">
        <h1 className="text-2xl font-bold">{t("admin.categories.title", "Categories")}</h1>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t("admin.categories.title", "Categories")}</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <p className="text-destructive">
              {t("admin.categories.loadError", "Failed to load categories")}
            </p>
            <Button onClick={fetchCategories}>
              {t("common.retry", "Retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("admin.categories.title", "Categories")}</h1>
        <Button onClick={handleCreate}>
          {t("admin.categories.create", "Create Category")}
        </Button>
      </div>

      {/* Empty state */}
      {categories.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <p className="text-muted-foreground">
              {t("admin.categories.empty", "No categories found.")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Category list */}
      {categories.map((category) => (
        <Card key={category.id} data-testid={`category-row-${category.id}`}>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                {category.icon_url && (
                  <img
                    src={category.icon_url}
                    alt={category.name}
                    className="h-8 w-8 rounded"
                  />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-medium">{category.name}</p>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active
                        ? t("admin.categories.active", "Active")
                        : t("admin.categories.inactive", "Inactive")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{category.name_mn}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>
                      {t("admin.categories.sortOrder", "Sort")}: {category.sort_order}
                    </span>
                    <span>
                      {t("admin.categories.intake", "Intake")}:{" "}
                      {category.intake_enabled
                        ? t("common.enabled", "Enabled")
                        : t("common.disabled", "Disabled")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={category.is_active}
                  onCheckedChange={() => handleToggleActive(category)}
                  aria-label={`Toggle ${category.name}`}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(category)}
                >
                  {t("common.edit", "Edit")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleSchemas(category.id)}
                >
                  {t("admin.categories.schemas", "Schemas")}
                </Button>
              </div>
            </div>

            {/* Expandable schema section */}
            {expandedCategoryId === category.id && (
              <SchemaVersionsPanel categoryId={category.id} />
            )}
          </CardContent>
        </Card>
      ))}

      {/* Category form dialog */}
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
              }
            : null
        }
        onSubmit={handleFormSubmit}
        isEdit={editingCategory !== null}
      />
    </div>
  );
}
