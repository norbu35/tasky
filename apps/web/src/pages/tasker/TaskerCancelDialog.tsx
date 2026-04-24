import { useMutation } from '@tanstack/react-query';
import { Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useAppContext } from '../../context/AppContext';
import { ScreenFrame } from '../../layout/ScreenFrame';
import { parseError } from '../../lib/errorHandling';
import { createIdempotencyKey } from '../../lib/idempotency';

const CANCEL_REASONS = [
  'SCHEDULE_CONFLICT',
  'UNABLE_TO_COMPLETE',
  'SAFETY_FRAUD',
  'PERSONAL_EMERGENCY',
  'OTHER',
] as const;

export function TaskerCancelDialog() {
  const { t } = useTranslation();
  const { apiClient, session, trackClientEvent } = useAppContext();
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState('');

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!session || !bookingId) throw new Error('Missing session or booking ID');
      const reason =
        selectedReason === 'OTHER'
          ? details.trim()
          : `[${selectedReason}]${details.trim() ? ' ' + details.trim() : ''}`;
      return apiClient.cancelBooking(
        session.accessToken,
        bookingId,
        createIdempotencyKey('cancel'),
        reason,
      );
    },
    onSuccess: () => {
      trackClientEvent('BOOKING_CANCELLED', { bookingId });
      toast.success(t('taskerPages.cancelDialog.success', 'Booking cancelled.'));
      navigate(-1);
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const canSubmit = selectedReason && !cancelMutation.isPending;

  return (
    <ScreenFrame maxWidth="narrow">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <XCircle className="w-6 h-6 text-destructive" />
            {t('taskerPages.cancelDialog.title', 'Cancel booking')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              'taskerPages.cancelDialog.description',
              'Cancel an assigned booking. The task will reopen for other taskers.',
            )}
          </p>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>
              {t('taskerPages.cancelDialog.reasonTitle', 'Cancellation reason')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>
                {t('taskerPages.cancelDialog.selectReasonLabel', 'Why are you cancelling?')}
              </Label>
              <div className="grid gap-2">
                {CANCEL_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedReason(r)}
                    className={`text-left px-4 py-3 rounded-lg border transition-colors text-sm ${
                      selectedReason === r
                        ? 'border-primary bg-primary/10 text-foreground font-medium'
                        : 'border-border/60 bg-background text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {t(`taskerPages.cancelDialog.reason_${r}`, r.replace(/_/g, ' '))}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cancel-details">
                {t('taskerPages.cancelDialog.detailsLabel', 'Additional details (optional)')}
              </Label>
              <Textarea
                id="cancel-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t(
                  'taskerPages.cancelDialog.detailsPlaceholder',
                  'Provide more context...',
                )}
                rows={3}
                maxLength={1000}
              />
            </div>

            {selectedReason === 'SAFETY_FRAUD' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-xs text-amber-600 font-medium">
                  {t(
                    'taskerPages.cancelDialog.safetyNotice',
                    'Safety/fraud cancellations bypass automated strike logic and are handled by the trust & safety team.',
                  )}
                </p>
              </div>
            )}

            <div className="bg-muted/30 border border-border/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                {t(
                  'taskerPages.cancelDialog.strikeNotice',
                  'Cancellations may affect your reliability record. The task will reopen for other taskers.',
                )}
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
                disabled={cancelMutation.isPending}
              >
                {t('taskerPages.cancelDialog.keepBooking', 'Keep booking')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={!canSubmit}
                onClick={() => cancelMutation.mutate()}
              >
                {cancelMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('taskerPages.cancelDialog.confirmButton', 'Confirm cancellation')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScreenFrame>
  );
}
