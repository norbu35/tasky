import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { useAppContext } from '../../context/AppContext';
import { useAdminApiClient } from '../../lib/adminApiClient';
import type { Dispute } from '../../lib/apiClient';

function disputeStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'OPEN':
      return 'default';
    case 'RESOLVED_CUSTOMER':
    case 'RESOLVED_TASKER':
      return 'secondary';
    case 'ESCALATED':
    case 'CLOSED_INSUFFICIENT_EVIDENCE':
      return 'outline';
    default:
      return 'secondary';
  }
}

const DISPUTE_STATUS_LABEL_KEYS = {
  OPEN: 'admin.disputes.statusLabel.OPEN',
  RESOLVED_CUSTOMER: 'admin.disputes.statusLabel.RESOLVED_CUSTOMER',
  RESOLVED_TASKER: 'admin.disputes.statusLabel.RESOLVED_TASKER',
  ESCALATED: 'admin.disputes.statusLabel.ESCALATED',
  CLOSED_INSUFFICIENT_EVIDENCE: 'admin.disputes.statusLabel.CLOSED_INSUFFICIENT_EVIDENCE',
  UNKNOWN: 'admin.disputes.statusLabel.UNKNOWN',
} as const;

function getDisputeStatusLabelKey(status: string): string {
  const key = status as keyof typeof DISPUTE_STATUS_LABEL_KEYS;
  return DISPUTE_STATUS_LABEL_KEYS[key] ?? DISPUTE_STATUS_LABEL_KEYS.UNKNOWN;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

export function AdminDisputesPage() {
  const { t } = useTranslation();
  const { session } = useAppContext();
  const adminApiClient = useAdminApiClient();
  const navigate = useNavigate();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const result = await adminApiClient.adminListDisputes(session.accessToken);
      setDisputes(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.unknownError'));
    } finally {
      setLoading(false);
    }
  }, [adminApiClient, session, t]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold font-display">{t('admin.disputes.title')}</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold font-display">{t('admin.disputes.title')}</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <p className="text-destructive">{t('admin.disputes.error')}</p>
            <Button onClick={fetchDisputes}>{t('common.retry')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (disputes.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold font-display">{t('admin.disputes.title')}</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">{t('admin.disputes.empty')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold font-display">{t('admin.disputes.title')}</h1>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">{t('admin.disputes.reason')}</th>
              <th className="px-4 py-3 text-left font-medium">{t('admin.disputes.status')}</th>
              <th className="px-4 py-3 text-left font-medium">{t('admin.disputes.createdAt')}</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((dispute) => (
              <tr
                key={dispute.id}
                data-testid="dispute-row"
                className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/admin/disputes/${dispute.id}`)}
              >
                <td className="px-4 py-3">{truncate(dispute.reason, 80)}</td>
                <td className="px-4 py-3">
                  <Badge variant={disputeStatusVariant(dispute.status)}>
                    {t(getDisputeStatusLabelKey(dispute.status))}
                  </Badge>
                </td>
                <td className="px-4 py-3">{formatDate(dispute.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
