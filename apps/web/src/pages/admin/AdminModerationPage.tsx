import { Scale } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';
import { Switch } from '../../components/ui/switch';
import { useAppContext } from '../../context/AppContext';
import { useAdminApiClient } from '../../lib/adminApiClient';
import type { StrikePolicy, StrikePolicyUpdateRequest } from '../../lib/apiClient';
import { formatDateTime } from '../../lib/formatDate';

export function AdminModerationPage() {
  const { t } = useTranslation();
  const { session } = useAppContext();
  const adminApiClient = useAdminApiClient();

  const [policy, setPolicy] = useState<StrikePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<StrikePolicyUpdateRequest | null>(null);
  const [saving, setSaving] = useState(false);

  const accessToken = session?.accessToken ?? null;

  const fetchPolicy = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.adminGetStrikePolicy(accessToken);
      setPolicy(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policy');
    } finally {
      setLoading(false);
    }
  }, [adminApiClient, accessToken]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  const handleEdit = () => {
    if (!policy) return;
    setDraft({
      strikeWindowDays: policy.strikeWindowDays,
      strikeThreshold: policy.strikeThreshold,
      firstSuspensionDays: policy.firstSuspensionDays,
      repeatSuspensionDays: policy.repeatSuspensionDays,
      repeatOffenseWindowDays: policy.repeatOffenseWindowDays,
      autoUnsuspendEnabled: policy.autoUnsuspendEnabled,
    });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft(null);
  };

  const handleSave = async () => {
    if (!draft || !accessToken) return;
    setSaving(true);
    try {
      const updated = await adminApiClient.adminUpdateStrikePolicy(accessToken, draft);
      setPolicy(updated);
      setEditing(false);
      setDraft(null);
      toast.success(t('admin.moderation.saved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight flex items-center gap-3">
          <Scale className="h-6 w-6 text-muted-foreground" />
          {t('admin.moderation.title')}
        </h1>
        <Card data-testid="moderation-loading">
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight flex items-center gap-3">
          <Scale className="h-6 w-6 text-muted-foreground" />
          {t('admin.moderation.title')}
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <p className="text-body-sm text-destructive">{t('admin.moderation.loadError')}</p>
            <Button variant="outline" size="sm" onClick={fetchPolicy}>
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fields: Array<{
    key: keyof StrikePolicyUpdateRequest;
    label: string;
    type: 'number' | 'boolean';
    min?: number;
    max?: number;
  }> = [
    {
      key: 'strikeWindowDays',
      label: t('admin.moderation.strikeWindowDays'),
      type: 'number',
      min: 1,
      max: 365,
    },
    {
      key: 'strikeThreshold',
      label: t('admin.moderation.strikeThreshold'),
      type: 'number',
      min: 1,
      max: 10,
    },
    {
      key: 'firstSuspensionDays',
      label: t('admin.moderation.firstSuspensionDays'),
      type: 'number',
      min: 1,
      max: 365,
    },
    {
      key: 'repeatSuspensionDays',
      label: t('admin.moderation.repeatSuspensionDays'),
      type: 'number',
      min: 1,
      max: 365,
    },
    {
      key: 'repeatOffenseWindowDays',
      label: t('admin.moderation.repeatOffenseWindowDays'),
      type: 'number',
      min: 1,
      max: 730,
    },
    {
      key: 'autoUnsuspendEnabled',
      label: t('admin.moderation.autoUnsuspend'),
      type: 'boolean',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight flex items-center gap-3">
          <Scale className="h-6 w-6 text-muted-foreground" />
          {t('admin.moderation.title')}
        </h1>
        {!editing && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            {t('common.edit')}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-section-heading">{t('admin.moderation.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {fields.map(({ key, label, type, min, max }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-lg px-4 py-3 hover:bg-muted/20 transition-colors"
            >
              <Label className="text-body-sm font-medium min-w-0 flex-1">{label}</Label>
              {editing && draft ? (
                type === 'boolean' ? (
                  <Switch
                    checked={draft[key] as boolean}
                    onCheckedChange={(checked) =>
                      setDraft((prev) => prev && { ...prev, [key]: checked })
                    }
                  />
                ) : (
                  <Input
                    type="number"
                    className="w-28 text-right text-body-sm"
                    min={min}
                    max={max}
                    value={draft[key] as number}
                    onChange={(e) =>
                      setDraft(
                        (prev) => prev && { ...prev, [key]: parseInt(e.target.value, 10) || 0 },
                      )
                    }
                  />
                )
              ) : (
                <span className="text-body-sm font-semibold text-foreground tabular-nums">
                  {type === 'boolean'
                    ? policy[key as keyof StrikePolicy]
                      ? 'Yes'
                      : 'No'
                    : String(policy[key as keyof StrikePolicy])}
                </span>
              )}
            </div>
          ))}
        </CardContent>
        {(editing || policy.updatedAt) && (
          <CardFooter className="flex items-center justify-between">
            {policy.updatedAt && (
              <p className="text-badge-text text-muted-foreground">
                {t('admin.moderation.updatedAt')}: {formatDateTime(policy.updatedAt)}
              </p>
            )}
            {editing && (
              <div className="flex gap-2 ml-auto">
                <Button variant="secondary" size="sm" onClick={handleCancel} disabled={saving}>
                  {t('common.cancel')}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {t('common.save')}
                </Button>
              </div>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
