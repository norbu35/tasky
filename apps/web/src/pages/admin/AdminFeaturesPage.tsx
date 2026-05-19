import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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
import { formatDateTime } from '../../lib/formatDate';

const FEATURE_LABEL_KEYS: Record<string, string> = {
  lead_fee_enabled: 'admin.features.featureLabels.lead_fee_enabled',
  subscription_enabled: 'admin.features.featureLabels.subscription_enabled',
  escrow_enabled: 'admin.features.featureLabels.escrow_enabled',
  ai_scope_summary_enabled: 'admin.features.featureLabels.ai_scope_summary_enabled',
};

const FEATURE_DESCRIPTION_KEYS: Record<string, string> = {
  lead_fee_enabled: 'admin.features.featureDescriptions.lead_fee_enabled',
  subscription_enabled: 'admin.features.featureDescriptions.subscription_enabled',
  escrow_enabled: 'admin.features.featureDescriptions.escrow_enabled',
  ai_scope_summary_enabled: 'admin.features.featureDescriptions.ai_scope_summary_enabled',
};

export function AdminFeaturesPage() {
  const { t } = useTranslation();
  const { session } = useAppContext();
  const adminApiClient = useAdminApiClient();

  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingToggle, setPendingToggle] = useState<{
    featureName: string;
    newValue: boolean;
  } | null>(null);
  const [updating, setUpdating] = useState(false);

  const getFeatureLabel = useCallback(
    (featureName: string) => {
      const key = FEATURE_LABEL_KEYS[featureName];
      return key ? t(key) : featureName;
    },
    [t],
  );

  const getFeatureDescription = useCallback(
    (featureName: string) => {
      const key = FEATURE_DESCRIPTION_KEYS[featureName];
      return key ? t(key) : '';
    },
    [t],
  );

  const fetchToggles = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const result = await adminApiClient.adminListFeatureToggles(session.accessToken);
      setToggles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.features.loadTogglesError'));
    } finally {
      setLoading(false);
    }
  }, [adminApiClient, session, t]);

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
        t(
          pendingToggle.newValue
            ? 'admin.features.toggleEnabledToast'
            : 'admin.features.toggleDisabledToast',
          { feature: getFeatureLabel(pendingToggle.featureName) },
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.features.updateToggleError'));
    } finally {
      setUpdating(false);
      setPendingToggle(null);
    }
  };

  const handleCancel = () => {
    setPendingToggle(null);
  };

  if (loading) {
    return (
      <div data-testid="features-loading" className="space-y-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t('admin.features.title')}
        </h1>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
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
          {t('admin.features.title')}
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <p className="text-body-sm text-destructive">{t('admin.features.loadError')}</p>
            <Button variant="outline" size="sm" onClick={fetchToggles}>
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {t('admin.features.title')}
      </h1>

      {toggles.map((toggle) => (
        <Card key={toggle.feature_name} data-testid={`toggle-row-${toggle.feature_name}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-card-title">
                    {getFeatureLabel(toggle.feature_name)}
                  </CardTitle>
                  <Badge
                    variant={toggle.is_enabled ? 'verified' : 'secondary'}
                    className="uppercase tracking-caps"
                  >
                    {toggle.is_enabled ? t('common.enabled') : t('common.disabled')}
                  </Badge>
                </div>
                <p className="text-body-sm text-muted-foreground">
                  {getFeatureDescription(toggle.feature_name)}
                </p>
              </div>
              <Switch
                checked={toggle.is_enabled}
                onCheckedChange={() => handleSwitchClick(toggle.feature_name, toggle.is_enabled)}
                aria-label={t('admin.features.toggleAriaLabel', {
                  feature: getFeatureLabel(toggle.feature_name),
                })}
              />
            </div>
          </CardHeader>
          {toggle.updated_by && (
            <CardContent className="pt-0">
              <p className="text-badge-text text-muted-foreground">
                {t('admin.features.updatedBy', {
                  name: toggle.updated_by,
                })}{' '}
                &middot; {formatDateTime(toggle.updated_at)}
              </p>
            </CardContent>
          )}
        </Card>
      ))}

      <Dialog open={pendingToggle !== null} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.features.confirmTitle')}</DialogTitle>
            <DialogDescription>
              {pendingToggle
                ? t('admin.features.confirmDesc', {
                    action: pendingToggle.newValue ? t('common.enable') : t('common.disable'),
                    feature: getFeatureLabel(pendingToggle.featureName),
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
