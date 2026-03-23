import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import type { AdminDisputeDetail, Dispute } from '../../lib/apiClient';

export function AdminDisputeDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { apiClient, session } = useAppContext();
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
      const result = await apiClient.adminGetDispute(session.accessToken, id);
      setDetail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [apiClient, session, id]);

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
        await apiClient.adminResolveDispute(
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
    [apiClient, session, id, notes, navigate, t],
  );

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t('admin.disputeDetail.title', 'Dispute Detail')}</h1>
        <p>{t('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t('admin.disputeDetail.title', 'Dispute Detail')}</h1>
        <p className="text-red-600">
          {t('common.error', 'Error')}: {error}
        </p>
      </div>
    );
  }

  if (!detail) {
    return null;
  }

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
        <button
          type="button"
          onClick={() => navigate('/admin/disputes')}
          className="px-3 py-1 border rounded hover:bg-gray-100"
        >
          {t('common.back', 'Back')}
        </button>
        <h1 className="text-2xl font-bold">{t('admin.disputeDetail.title', 'Dispute Detail')}</h1>
      </div>

      {/* Dispute Info */}
      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-semibold">
          {t('admin.disputeDetail.disputeInfo', 'Dispute Info')}
        </h2>
        <p>
          <strong>{t('admin.disputeDetail.reason', 'Reason')}:</strong> {dispute.reason}
        </p>
        <p>
          <strong>{t('admin.disputeDetail.status', 'Status')}:</strong> {dispute.status}
        </p>
        <p>
          <strong>{t('admin.disputeDetail.createdAt', 'Created')}:</strong>{' '}
          {new Date(dispute.created_at).toLocaleString()}
        </p>
      </section>

      {/* Booking Context */}
      <section className="border rounded p-4 space-y-2">
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
            {String(customer.full_name ?? 'Unknown')}
          </p>
        )}
        {tasker && (
          <p>
            <strong>{t('admin.disputeDetail.tasker', 'Tasker')}:</strong>{' '}
            {String(tasker.full_name ?? 'Unknown')}
          </p>
        )}
      </section>

      {/* Evidence Messages */}
      {evidenceMessages.length > 0 && (
        <section className="border rounded p-4 space-y-2">
          <h2 className="text-lg font-semibold">
            {t('admin.disputeDetail.evidence', 'Evidence Messages')}
          </h2>
          <div className="space-y-2">
            {evidenceMessages.map((msg) => (
              <div key={msg.id} className="border-l-2 pl-3 py-1">
                <p className="text-sm text-gray-500">{new Date(msg.created_at).toLocaleString()}</p>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Resolution Actions */}
      <section className="border rounded p-4 space-y-4">
        <h2 className="text-lg font-semibold">
          {t('admin.disputeDetail.resolution', 'Resolution')}
        </h2>

        <div>
          <label htmlFor="resolution-notes" className="block font-medium mb-1">
            {t('admin.disputeDetail.notesLabel', 'Resolution Notes')}
          </label>
          <textarea
            id="resolution-notes"
            className="w-full border rounded p-2"
            rows={4}
            placeholder={t('admin.disputeDetail.notesPlaceholder', 'Enter resolution notes...')}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (validationError) setValidationError(null);
            }}
          />
          {validationError && <p className="text-red-600 text-sm mt-1">{validationError}</p>}
        </div>

        {error && detail && (
          <p className="text-red-600 text-sm">
            {t('common.error', 'Error')}: {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            disabled={resolving}
            onClick={() => handleResolve('RESOLVE_CUSTOMER')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {t('admin.disputeDetail.resolveCustomer', 'Resolve for Customer')}
          </button>
          <button
            type="button"
            disabled={resolving}
            onClick={() => handleResolve('RESOLVE_TASKER')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {t('admin.disputeDetail.resolveTasker', 'Resolve for Tasker')}
          </button>
          <button
            type="button"
            disabled={resolving}
            onClick={() => handleResolve('ESCALATE')}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            {t('admin.disputeDetail.escalate', 'Escalate')}
          </button>
        </div>
      </section>
    </div>
  );
}
