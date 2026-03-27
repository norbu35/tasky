import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../../context/AppContext';
import type { LeadUnlockPrice, LeadUnlockPricePayload } from '../../lib/apiClient';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

type PageState = 'loading' | 'phase-gated' | 'error' | 'ready';

const EMPTY_FORM: LeadUnlockPricePayload = {
  category_id: '',
  district_id: '',
  credits_required: 1,
  effective_from: '',
  effective_to: null,
};

export function AdminLeadPricingPage() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();

  const [prices, setPrices] = useState<LeadUnlockPrice[]>([]);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<LeadUnlockPricePayload>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const accessToken = session?.accessToken ?? '';

  const fetchPrices = useCallback(async () => {
    if (!accessToken) return;
    setPageState('loading');
    setError(null);
    try {
      const result = await apiClient.adminListLeadUnlockPrices(accessToken);
      setPrices(result.data);
      setPageState('ready');
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 503) {
        setPageState('phase-gated');
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPageState('error');
      }
    }
  }, [apiClient, accessToken]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleOpenDialog = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!accessToken) return;
    setSubmitting(true);
    try {
      const payload: LeadUnlockPricePayload = {
        ...form,
        effective_to: form.effective_to || null,
      };
      const created = await apiClient.adminCreateLeadUnlockPrice(accessToken, payload);
      setPrices((prev) => [created, ...prev]);
      setDialogOpen(false);
      toast.success(t('admin.pricing.created', 'Price rule created'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create price');
    } finally {
      setSubmitting(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6" />
          {t('admin.pricing.title', 'Lead Pricing')}
        </h1>
        <div data-testid="pricing-loading" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (pageState === 'phase-gated') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6" />
          {t('admin.pricing.title', 'Lead Pricing')}
        </h1>
        <Card data-testid="pricing-phase-gated">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {t('admin.pricing.phaseGated', 'Lead pricing is not active in the current phase.')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6" />
          {t('admin.pricing.title', 'Lead Pricing')}
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <p className="text-destructive">
              {error ?? t('admin.pricing.loadError', 'Failed to load lead unlock prices')}
            </p>
            <Button onClick={fetchPrices}>{t('common.retry', 'Retry')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6" />
          {t('admin.pricing.title', 'Lead Pricing')}
        </h1>
        <Button onClick={handleOpenDialog}>{t('admin.pricing.create', 'Create Price')}</Button>
      </div>

      {prices.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {t('admin.pricing.empty', 'No prices configured.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.pricing.colCategory', 'Category')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.pricing.colDistrict', 'District')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.pricing.colCredits', 'Credits')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.pricing.colFrom', 'Effective From')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.pricing.colTo', 'Effective To')}
                </th>
              </tr>
            </thead>
            <tbody>
              {prices.map((price) => (
                <tr
                  key={price.id}
                  data-testid={`price-row-${price.id}`}
                  className="border-b last:border-0"
                >
                  <td className="px-4 py-3 font-mono text-xs">{price.category_id}</td>
                  <td className="px-4 py-3">{price.district_id}</td>
                  <td className="px-4 py-3">{price.credits_required}</td>
                  <td className="px-4 py-3">
                    {new Date(price.effective_from).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {price.effective_to ? new Date(price.effective_to).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.pricing.createTitle', 'Create Price Rule')}</DialogTitle>
            <DialogDescription>
              {t(
                'admin.pricing.createDesc',
                'Set a lead unlock credit requirement for a category and district.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="price-category">
                {t('admin.pricing.colCategory', 'Category ID')}
              </Label>
              <Input
                id="price-category"
                placeholder={t('admin.pricing.categoryPlaceholder', 'Category UUID')}
                value={form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="price-district">
                {t('admin.pricing.colDistrict', 'District ID')}
              </Label>
              <Input
                id="price-district"
                placeholder={t('admin.pricing.districtPlaceholder', 'District slug')}
                value={form.district_id}
                onChange={(e) => setForm((f) => ({ ...f, district_id: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="price-credits">
                {t('admin.pricing.colCredits', 'Credits Required')}
              </Label>
              <Input
                id="price-credits"
                type="number"
                min={1}
                placeholder={t('admin.pricing.creditsPlaceholder', 'Credits (min 1)')}
                value={form.credits_required}
                onChange={(e) =>
                  setForm((f) => ({ ...f, credits_required: parseInt(e.target.value, 10) || 1 }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="price-from">{t('admin.pricing.colFrom', 'Effective From')}</Label>
              <Input
                id="price-from"
                type="datetime-local"
                placeholder={t('admin.pricing.fromPlaceholder', 'Effective from date')}
                value={form.effective_from}
                onChange={(e) => setForm((f) => ({ ...f, effective_from: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="price-to">
                {t('admin.pricing.colTo', 'Effective To')} ({t('common.optional', 'optional')})
              </Label>
              <Input
                id="price-to"
                type="datetime-local"
                placeholder={t('admin.pricing.toPlaceholder', 'Effective to date (optional)')}
                value={form.effective_to ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, effective_to: e.target.value || null }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
