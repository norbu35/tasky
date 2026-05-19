import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Textarea } from '../../components/ui/textarea';
import { useAppContext } from '../../context/AppContext';
import { useAdminApiClient } from '../../lib/adminApiClient';
import type { AdminDisputeDetail, Dispute } from '../../lib/apiClient';
import { formatDateTime } from '../../lib/formatDate';

function disputeStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'EVIDENCE_NEEDED':
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
  EVIDENCE_NEEDED: 'admin.disputes.statusLabel.EVIDENCE_NEEDED',
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

export function AdminDisputeDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { session } = useAppContext();
  const adminApiClient = useAdminApiClient();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<AdminDisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!session || !id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await adminApiClient.adminGetDispute(session.accessToken, id);
      setDetail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.unknownError'));
    } finally {
      setLoading(false);
    }
  }, [adminApiClient, session, id, t]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleResolve = useCallback(
    async (resolution: 'RESOLVE_CUSTOMER' | 'RESOLVE_TASKER' | 'ESCALATE') => {
      if (!notes.trim()) {
        setValidationError(t('admin.disputeDetail.notesRequired'));
        return;
      }
      setValidationError(null);
      if (!session || !id) return;
      setResolving(true);
      try {
        const idempotencyKey = crypto.randomUUID();
        await adminApiClient.adminResolveDispute(
          session.accessToken,
          id,
          resolution,
          notes.trim(),
          idempotencyKey,
        );
        navigate('/admin/disputes');
      } catch (err) {
        setError(err instanceof Error ? err.message : t('admin.disputeDetail.resolutionFailed'));
      } finally {
        setResolving(false);
      }
    },
    [adminApiClient, session, id, notes, navigate, t],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-64" />
        </div>
        <p className="sr-only">{t('common.loading')}</p>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/disputes')}>
            {t('common.back')}
          </Button>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t('admin.disputeDetail.title')}
          </h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-body-sm text-destructive">
              {t('common.error')}: {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!detail) return null;

  const dispute = detail.dispute as unknown as Dispute;
  const booking = detail.booking as Record<string, unknown>;
  const task = booking['task'] as Record<string, unknown> | undefined;
  const customer = booking['customer'] as Record<string, unknown> | undefined;
  const tasker = booking['tasker'] as Record<string, unknown> | undefined;
  const evidenceMessages = detail.evidence_messages as Array<{
    id: string;
    sender_id: string;
    content: string;
    sent_at: string;
  }>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/disputes')}>
          {t('common.back')}
        </Button>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t('admin.disputeDetail.title')}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-section-heading">
            {t('admin.disputeDetail.disputeInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-badge-text font-medium uppercase tracking-caps text-muted-foreground">
              {t('admin.disputeDetail.reason')}
            </span>
            <p className="text-body-sm">{dispute.reason}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-badge-text font-medium uppercase tracking-caps text-muted-foreground">
              {t('admin.disputeDetail.status')}
            </span>
            <Badge
              variant={disputeStatusVariant(dispute.status)}
              className="uppercase tracking-caps"
            >
              {t(getDisputeStatusLabelKey(dispute.status))}
            </Badge>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-badge-text font-medium uppercase tracking-caps text-muted-foreground">
              {t('admin.disputeDetail.createdAt')}
            </span>
            <p className="text-body-sm">{formatDateTime(dispute.created_at)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-section-heading">
            {t('admin.disputeDetail.bookingContext')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {task && (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-badge-text font-medium uppercase tracking-caps text-muted-foreground">
                  {t('admin.disputeDetail.taskDescription')}
                </span>
                <p className="text-body-sm">{String(task['description'] ?? '')}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-badge-text font-medium uppercase tracking-caps text-muted-foreground">
                  {t('admin.disputeDetail.budget')}
                </span>
                <p className="text-body-sm font-semibold">
                  {Number(task['budget'] ?? booking['price'] ?? 0).toLocaleString()}
                </p>
              </div>
              {task['scheduled_at'] && (
                <div className="flex flex-col gap-1">
                  <span className="text-badge-text font-medium uppercase tracking-caps text-muted-foreground">
                    {t('admin.disputeDetail.schedule')}
                  </span>
                  <p className="text-body-sm">{formatDateTime(String(task['scheduled_at']))}</p>
                </div>
              )}
            </>
          )}
          {!task && booking['price'] !== undefined && (
            <div className="flex flex-col gap-1">
              <span className="text-badge-text font-medium uppercase tracking-caps text-muted-foreground">
                {t('admin.disputeDetail.budget')}
              </span>
              <p className="text-body-sm font-semibold">
                {Number(booking['price']).toLocaleString()}
              </p>
            </div>
          )}
          {customer && (
            <div className="flex flex-col gap-1">
              <span className="text-badge-text font-medium uppercase tracking-caps text-muted-foreground">
                {t('admin.disputeDetail.customer')}
              </span>
              <p className="text-body-sm">{String(customer['full_name'] ?? t('common.unknown'))}</p>
            </div>
          )}
          {tasker && (
            <div className="flex flex-col gap-1">
              <span className="text-badge-text font-medium uppercase tracking-caps text-muted-foreground">
                {t('admin.disputeDetail.tasker')}
              </span>
              <p className="text-body-sm">{String(tasker['full_name'] ?? t('common.unknown'))}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {evidenceMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-section-heading">
              {t('admin.disputeDetail.evidence')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {evidenceMessages.map((msg) => (
              <div key={msg.id} className="border-l-2 border-border pl-4 py-2">
                <p className="text-badge-text text-muted-foreground">
                  {formatDateTime(msg.sent_at)}
                </p>
                <p className="text-body-sm mt-1">{msg.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-section-heading">
            {t('admin.disputeDetail.resolution')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="resolution-notes" className="block text-label font-medium mb-2">
              {t('admin.disputeDetail.notesLabel')}
            </label>
            <Textarea
              id="resolution-notes"
              rows={4}
              placeholder={t('admin.disputeDetail.notesPlaceholder')}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (validationError) setValidationError(null);
              }}
            />
            {validationError && (
              <p className="text-body-sm text-destructive mt-1.5">{validationError}</p>
            )}
          </div>
          {error && detail && (
            <p className="text-body-sm text-destructive">
              {t('common.error')}: {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button disabled={resolving} onClick={() => handleResolve('RESOLVE_CUSTOMER')}>
              {t('admin.disputeDetail.resolveCustomer')}
            </Button>
            <Button
              variant="secondary"
              disabled={resolving}
              onClick={() => handleResolve('RESOLVE_TASKER')}
            >
              {t('admin.disputeDetail.resolveTasker')}
            </Button>
            <Button
              variant="outline"
              disabled={resolving}
              onClick={() => handleResolve('ESCALATE')}
            >
              {t('admin.disputeDetail.escalate')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
