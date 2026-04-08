import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAppContext } from '../../context/AppContext';
import type { FeatureToggle } from '../../lib/apiClient';
import { Card, CardContent } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

const FEATURE_LABELS: Record<string, string> = {
  lead_fee_enabled: 'Lead Fee',
  subscription_enabled: 'Subscriptions',
  escrow_enabled: 'Escrow Payments',
  ai_scope_summary_enabled: 'AI Scope Summary',
};

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  lead_fee_enabled: 'Charge taskers a fee for each lead they receive',
  subscription_enabled: 'Enable subscription-based plans for taskers',
  escrow_enabled: 'Hold payments in escrow until task completion',
  ai_scope_summary_enabled: 'Generate AI-powered scope summaries for tasks',
};

function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function AdminFeaturesPage() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();

  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Confirmation dialog state
  const [pendingToggle, setPendingToggle] = useState<{
    featureName: string;
    newValue: boolean;
  } | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchToggles = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.adminListFeatureToggles(session.accessToken);
      setToggles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feature toggles');
    } finally {
      setLoading(false);
    }
  }, [apiClient, session]);

  useEffect(() => {
    fetchToggles();
  }, [fetchToggles]);

  const handleSwitchClick = (featureName: string, currentValue: boolean) => {
    setPendingToggle({ featureName, newValue: !currentValue });
  };

  const handleConfirm = async () => {
    if (!pendingToggle || !session) return;
    setUpdating(true);
    try {
      const updated = await apiClient.adminUpdateFeatureToggle(
        session.accessToken,
        pendingToggle.featureName,
        pendingToggle.newValue,
      );
      setToggles((prev) =>
        prev.map((t) => (t.feature_name === updated.feature_name ? updated : t)),
      );
      toast.success(
        `${FEATURE_LABELS[pendingToggle.featureName] ?? pendingToggle.featureName} ${
          pendingToggle.newValue ? 'enabled' : 'disabled'
        }`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update toggle');
    } finally {
      setUpdating(false);
      setPendingToggle(null);
    }
  };

  const handleCancel = () => {
    setPendingToggle(null);
  };

  // Loading state
  if (loading) {
    return (
      <div data-testid="features-loading" className="space-y-4">
        <h1 className="text-2xl font-bold">{t('admin.features.title', 'Features')}</h1>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t('admin.features.title', 'Features')}</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <p className="text-destructive">
              {t('admin.features.loadError', 'Failed to load feature toggles')}
            </p>
            <Button onClick={fetchToggles}>{t('common.retry', 'Retry')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('admin.features.title', 'Features')}</h1>

      {toggles.map((toggle) => (
        <Card key={toggle.feature_name} data-testid={`toggle-row-${toggle.feature_name}`}>
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-base font-medium">
                {FEATURE_LABELS[toggle.feature_name] ?? toggle.feature_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {FEATURE_DESCRIPTIONS[toggle.feature_name] ?? ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {toggle.updated_by &&
                  t('admin.features.updatedBy', 'Updated by {{name}} — ', {
                    name: toggle.updated_by,
                  })}
                {formatTimestamp(toggle.updated_at)}
              </p>
            </div>
            <Switch
              checked={toggle.is_enabled}
              onCheckedChange={() => handleSwitchClick(toggle.feature_name, toggle.is_enabled)}
              aria-label={`Toggle ${FEATURE_LABELS[toggle.feature_name] ?? toggle.feature_name}`}
            />
          </CardContent>
        </Card>
      ))}

      {/* Confirmation Dialog */}
      <Dialog open={pendingToggle !== null} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.features.confirmTitle', 'Are you sure?')}</DialogTitle>
            <DialogDescription>
              {pendingToggle
                ? t(
                    'admin.features.confirmDesc',
                    'You are about to {{action}} "{{feature}}". This change will take effect immediately.',
                    {
                      action: pendingToggle.newValue
                        ? t('common.enable', 'enable')
                        : t('common.disable', 'disable'),
                      feature:
                        FEATURE_LABELS[pendingToggle.featureName] ?? pendingToggle.featureName,
                    },
                  )
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={handleCancel} disabled={updating}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleConfirm} disabled={updating}>
              {t('common.confirm', 'Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
