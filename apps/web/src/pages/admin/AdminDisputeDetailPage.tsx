import { useAdminApiClient } from '../../lib/adminApiClient';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import type { AdminDisputeDetail, Dispute } from '../../lib/apiClient';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Textarea } from '../../components/ui/textarea';

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
      setError(err instanceof Error ? err.message : t('common.unknownError', 'Unknown error'));
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
        setValidationError(t('admin.disputeDetail.notesRequired', 'Notes are required.'));
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
        setError(err instanceof Error ? err.message : 'Resolution failed');
      } finally {
        setResolving(false);
      }
    },
    [adminApiClient, session, id, notes, navigate, t],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('admin.disputeDetail.title', 'Dispute Detail')}</h1>
        <p className="sr-only">{t('common.loading', 'Loading...')}</p>
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
        <h1 className="text-2xl font-bold">{t('admin.disputeDetail.title', 'Dispute Detail')}</h1>
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-destructive">
              {t('common.error', 'Error')}: {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!detail) return null;

  const dispute = detail.dispute as unknown as Dispute;
  const booking = detail.booking as Record<string, unknown>;
  const task = booking.task as Record<string, unknown> | undefined;
  const customer = booking.customer as Record<string, unknown> | undefined;
  const tasker = booking.tasker as Record<string, unknown> | undefined;
  const evidenceMessages = detail.evidence_messages as Array<{
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
  }>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/disputes')}>
          {t('common.back', 'Back')}
        </Button>
        <h1 className="text-2xl font-bold">{t('admin.disputeDetail.title', 'Dispute Detail')}</h1>
      </div>

      {/* Dispute Info */}
      <Card>
        <CardContent className="space-y-2 p-6">
          <h2 className="text-lg font-semibold">
            {t('admin.disputeDetail.disputeInfo', 'Dispute Info')}
          </h2>
          <p>
            <strong>{t('admin.disputeDetail.reason', 'Reason')}:</strong> {dispute.reason}
          </p>
          <div className="flex items-center gap-2">
            <strong>{t('admin.disputeDetail.status', 'Status')}:</strong>
            <Badge variant={disputeStatusVariant(dispute.status)}>
              {t(`admin.disputes.status_${dispute.status}`, dispute.status)}
            </Badge>
          </div>
          <p>
            <strong>{t('admin.disputeDetail.createdAt', 'Created')}:</strong>{' '}
            {new Date(dispute.created_at).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Booking Context */}
      <Card>
        <CardContent className="space-y-2 p-6">
          <h2 className="text-lg font-semibold">
            {t('admin.disputeDetail.bookingContext', 'Booking Context')}
          </h2>
          {task && (
            <>
              <p>
                <strong>{t('admin.disputeDetail.taskDescription', 'Task')}:</strong>{' '}
                {String(task.description ?? '')}
              </p>
              <p>
                <strong>{t('admin.disputeDetail.budget', 'Budget')}:</strong>{' '}
                {Number(task.budget ?? booking.price ?? 0).toLocaleString()}
              </p>
              {task.scheduled_at && (
                <p>
                  <strong>{t('admin.disputeDetail.schedule', 'Schedule')}:</strong>{' '}
                  {new Date(String(task.scheduled_at)).toLocaleString()}
                </p>
              )}
            </>
          )}
          {!task && booking.price !== undefined && (
            <p>
              <strong>{t('admin.disputeDetail.budget', 'Budget')}:</strong>{' '}
              {Number(booking.price).toLocaleString()}
            </p>
          )}
          {customer && (
            <p>
              <strong>{t('admin.disputeDetail.customer', 'Customer')}:</strong>{' '}
              {String(customer.full_name ?? t('common.unknown', 'Unknown'))}
            </p>
          )}
          {tasker && (
            <p>
              <strong>{t('admin.disputeDetail.tasker', 'Tasker')}:</strong>{' '}
              {String(tasker.full_name ?? t('common.unknown', 'Unknown'))}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Evidence Messages */}
      {evidenceMessages.length > 0 && (
        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="text-lg font-semibold">
              {t('admin.disputeDetail.evidence', 'Evidence Messages')}
            </h2>
            {evidenceMessages.map((msg) => (
              <div key={msg.id} className="border-l-2 border-border pl-3 py-1">
                <p className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
                <p className="text-sm">{msg.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Resolution */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">
            {t('admin.disputeDetail.resolution', 'Resolution')}
          </h2>
          <div>
            <label htmlFor="resolution-notes" className="block text-sm font-medium mb-1">
              {t('admin.disputeDetail.notesLabel', 'Resolution Notes')}
            </label>
            <Textarea
              id="resolution-notes"
              rows={4}
              placeholder={t('admin.disputeDetail.notesPlaceholder', 'Enter resolution notes...')}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (validationError) setValidationError(null);
              }}
            />
            {validationError && <p className="text-destructive text-sm mt-1">{validationError}</p>}
          </div>
          {error && detail && (
            <p className="text-destructive text-sm">
              {t('common.error', 'Error')}: {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button disabled={resolving} onClick={() => handleResolve('RESOLVE_CUSTOMER')}>
              {t('admin.disputeDetail.resolveCustomer', 'Resolve for Customer')}
            </Button>
            <Button disabled={resolving} onClick={() => handleResolve('RESOLVE_TASKER')}>
              {t('admin.disputeDetail.resolveTasker', 'Resolve for Tasker')}
            </Button>
            <Button
              variant="secondary"
              disabled={resolving}
              onClick={() => handleResolve('ESCALATE')}
            >
              {t('admin.disputeDetail.escalate', 'Escalate')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
