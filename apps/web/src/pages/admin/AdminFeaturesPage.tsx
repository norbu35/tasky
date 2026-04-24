import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import { Switch } from '../../components/ui/switch';
import { useAppContext } from '../../context/AppContext';
import { useAdminApiClient } from '../../lib/adminApiClient';
import type { FeatureToggle } from '../../lib/apiClient';

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
  const { session } = useAppContext();
  const adminApiClient = useAdminApiClient();

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
      const result = await adminApiClient.adminListFeatureToggles(session.accessToken);
      setToggles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feature toggles');
    } finally {
      setLoading(false);
    }
  }, [adminApiClient, session]);

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
      const updated = await adminApiClient.adminUpdateFeatureToggle(
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
        <h1 className="text-2xl font-bold font-display">{t('admin.features.title')}</h1>
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
        <h1 className="text-2xl font-bold font-display">{t('admin.features.title')}</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <p className="text-destructive">{t('admin.features.loadError')}</p>
            <Button onClick={fetchToggles}>{t('common.retry')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold font-display">{t('admin.features.title')}</h1>

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
                  t('admin.features.updatedBy', {
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
            <DialogTitle>{t('admin.features.confirmTitle')}</DialogTitle>
            <DialogDescription>
              {pendingToggle
                ? t('admin.features.confirmDesc', {
                    action: pendingToggle.newValue ? t('common.enable') : t('common.disable'),
                    feature: FEATURE_LABELS[pendingToggle.featureName] ?? pendingToggle.featureName,
                  })
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={handleCancel} disabled={updating}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleConfirm} disabled={updating}>
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
