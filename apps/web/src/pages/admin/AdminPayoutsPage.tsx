import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../../context/AppContext';
import type { PayoutRequest } from '../../lib/apiClient';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
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

export function AdminPayoutsPage() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();

  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const accessToken = session?.accessToken ?? '';

  const fetchPayouts = useCallback(async () => {
    if (!accessToken) return;
    setPageState('loading');
    setError(null);
    try {
      const result = await apiClient.adminListPendingPayouts(accessToken);
      setPayouts(result.data);
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
    fetchPayouts();
  }, [fetchPayouts]);

  const handleProcess = async () => {
    if (!confirmingId || !accessToken) return;
    setProcessing(true);
    try {
      await apiClient.adminProcessPayout(accessToken, confirmingId, crypto.randomUUID());
      setPayouts((prev) => prev.filter((p) => p.id !== confirmingId));
      setConfirmingId(null);
      toast.success(t('admin.payouts.processed', 'Payout marked as processed'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process payout';
      if (message.includes('409') || (err as { status?: number }).status === 409) {
        toast.error(
          t('admin.payouts.offSchedule', 'Payouts can only be processed on Tuesdays and Fridays'),
        );
      } else {
        toast.error(message);
      }
    } finally {
      setProcessing(false);
      setConfirmingId(null);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Banknote className="h-6 w-6" />
          {t('admin.payouts.title', 'Payouts')}
        </h1>
        <div data-testid="payouts-loading" className="space-y-3">
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
          <Banknote className="h-6 w-6" />
          {t('admin.payouts.title', 'Payouts')}
        </h1>
        <Card data-testid="payouts-phase-gated">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {t('admin.payouts.phaseGated', 'Payouts are not active in the current phase.')}
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
          <Banknote className="h-6 w-6" />
          {t('admin.payouts.title', 'Payouts')}
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <p className="text-destructive">
              {error ?? t('admin.payouts.loadError', 'Failed to load pending payouts')}
            </p>
            <Button onClick={fetchPayouts}>{t('common.retry', 'Retry')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Banknote className="h-6 w-6" />
        {t('admin.payouts.title', 'Payouts')}
      </h1>

      {payouts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {t('admin.payouts.empty', 'No pending payouts.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.payouts.colTasker', 'Tasker')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.payouts.colBank', 'Bank')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.payouts.colAmount', 'Amount (MNT)')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.payouts.colRequested', 'Requested')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.payouts.colActions', 'Actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr
                  key={payout.id}
                  data-testid={`payout-row-${payout.id}`}
                  className="border-b last:border-0"
                >
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                    {payout.user_id ?? '—'}
                  </td>
                  <td className="px-4 py-3">{payout.bank_name}</td>
                  <td className="px-4 py-3">{payout.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">{new Date(payout.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => setConfirmingId(payout.id)}>
                      {t('admin.payouts.process', 'Process')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={confirmingId !== null} onOpenChange={(open) => !open && setConfirmingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.payouts.confirmTitle', 'Process Payout')}</DialogTitle>
            <DialogDescription>
              {t(
                'admin.payouts.confirmDesc',
                'This will mark the payout as processed. This action cannot be undone and assumes you have completed the bank transfer.',
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmingId(null)} disabled={processing}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleProcess} disabled={processing}>
              {t('common.confirm', 'Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
