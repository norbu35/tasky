import { useMutation } from '@tanstack/react-query';
import { CalendarClock, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useAppContext } from '../../context/AppContext';
import { ScreenFrame } from '../../layout/ScreenFrame';
import { parseError } from '../../lib/errorHandling';
import { createIdempotencyKey } from '../../lib/idempotency';

export function CustomerReschedulePage() {
  const { t } = useTranslation();
  const { apiClient, session, trackClientEvent } = useAppContext();
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [reason, setReason] = useState('');

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      if (!session || !bookingId) throw new Error('Missing session or booking ID');
      const proposedScheduledAt = new Date(`${proposedDate}T${proposedTime}`).toISOString();
      return apiClient.requestReschedule(
        session.accessToken,
        bookingId,
        proposedScheduledAt,
        createIdempotencyKey('reschedule'),
        reason.trim() || undefined,
      );
    },
    onSuccess: () => {
      trackClientEvent('RESCHEDULE_REQUESTED', { bookingId });
      toast.success(t('customerPages.reschedule.success'));
      navigate(-1);
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const canSubmit = proposedDate && proposedTime && !rescheduleMutation.isPending;

  return (
    <ScreenFrame maxWidth="narrow">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-primary" />
            {t('customerPages.reschedule.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('customerPages.reschedule.description')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('customerPages.reschedule.cardTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reschedule-date">{t('customerPages.reschedule.dateLabel')}</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reschedule-time">{t('customerPages.reschedule.timeLabel')}</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reschedule-reason">{t('customerPages.reschedule.reasonLabel')}</Label>
              <Textarea
                id="reschedule-reason"
                placeholder={t('customerPages.reschedule.reasonPlaceholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={1000}
                rows={3}
              />
            </div>

            <div className="bg-muted/30 border border-border/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                {t('customerPages.reschedule.policyNotice')}
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
                disabled={rescheduleMutation.isPending}
              >
                {t('customerPages.reschedule.cancel')}
              </Button>
              <Button
                type="button"
                disabled={!canSubmit}
                onClick={() => rescheduleMutation.mutate()}
              >
                {rescheduleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('customerPages.reschedule.saveChanges')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScreenFrame>
  );
}
