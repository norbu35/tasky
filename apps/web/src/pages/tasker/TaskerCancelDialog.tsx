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

const REASON_LABEL_KEYS: Readonly<Record<(typeof CANCEL_REASONS)[number], string>> = {
  SCHEDULE_CONFLICT: 'taskerPages.cancelDialog.reasonLabel.SCHEDULE_CONFLICT',
  UNABLE_TO_COMPLETE: 'taskerPages.cancelDialog.reasonLabel.UNABLE_TO_COMPLETE',
  SAFETY_FRAUD: 'taskerPages.cancelDialog.reasonLabel.SAFETY_FRAUD',
  PERSONAL_EMERGENCY: 'taskerPages.cancelDialog.reasonLabel.PERSONAL_EMERGENCY',
  OTHER: 'taskerPages.cancelDialog.reasonLabel.OTHER',
};

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
      toast.success(t('taskerPages.cancelDialog.success'));
      navigate(-1);
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const canSubmit = selectedReason && !cancelMutation.isPending;

  return (
    <ScreenFrame maxWidth="narrow">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight flex items-center gap-2">
            <XCircle className="w-6 h-6 text-destructive" />
            {t('taskerPages.cancelDialog.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('taskerPages.cancelDialog.description')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('taskerPages.cancelDialog.reasonTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t('taskerPages.cancelDialog.selectReasonLabel')}</Label>
              <div className="grid gap-2">
                {CANCEL_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedReason(r)}
                    className={`text-left px-4 py-3 rounded-lg ring-1 ring-inset transition-all duration-200 text-sm ${
                      selectedReason === r
                        ? 'ring-primary bg-primary/10 text-foreground font-medium shadow-elevated'
                        : 'ring-border/40 bg-background text-muted-foreground hover:ring-primary/40 hover:bg-muted/30'
                    }`}
                  >
                    {t(REASON_LABEL_KEYS[r])}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cancel-details">{t('taskerPages.cancelDialog.detailsLabel')}</Label>
              <Textarea
                id="cancel-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t('taskerPages.cancelDialog.detailsPlaceholder')}
                rows={3}
                maxLength={1000}
              />
            </div>

            {selectedReason === 'SAFETY_FRAUD' && (
              <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-3">
                <p className="text-xs text-secondary font-medium">
                  {t('taskerPages.cancelDialog.safetyNotice')}
                </p>
              </div>
            )}

            <div className="bg-muted/30 border border-border/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                {t('taskerPages.cancelDialog.strikeNotice')}
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
                disabled={cancelMutation.isPending}
              >
                {t('taskerPages.cancelDialog.keepBooking')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={!canSubmit}
                onClick={() => cancelMutation.mutate()}
              >
                {cancelMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('taskerPages.cancelDialog.confirmButton')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScreenFrame>
  );
}
