import { useMutation } from '@tanstack/react-query';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { useAppContext } from '../../context/AppContext';
import { ScreenFrame } from '../../layout/ScreenFrame';
import { parseError } from '../../lib/errorHandling';
import { createIdempotencyKey } from '../../lib/idempotency';

const EVIDENCE_TYPES = ['WRITTEN_TIMELINE', 'CHAT_EXCERPT', 'PHOTO'] as const;

const EVIDENCE_TYPE_LABEL_KEYS = {
  WRITTEN_TIMELINE: 'customerPages.disputeRaise.evidenceType.WRITTEN_TIMELINE',
  CHAT_EXCERPT: 'customerPages.disputeRaise.evidenceType.CHAT_EXCERPT',
  PHOTO: 'customerPages.disputeRaise.evidenceType.PHOTO',
} as const;

export function CustomerDisputeRaisePage() {
  const { t } = useTranslation();
  const { apiClient, session, trackClientEvent } = useAppContext();
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [reason, setReason] = useState('');
  const [evidenceType, setEvidenceType] = useState<string>('WRITTEN_TIMELINE');
  const [evidenceText, setEvidenceText] = useState('');

  const raiseDisputeMutation = useMutation({
    mutationFn: async () => {
      if (!session || !bookingId) throw new Error('Missing session or booking ID');

      const evidenceTextPayload = evidenceText.trim();
      const evidence =
        evidenceType === 'PHOTO' || evidenceTextPayload.length === 0
          ? []
          : [
              {
                type: evidenceType,
                text_payload: evidenceTextPayload,
              },
            ];

      return apiClient.raiseDispute(
        session.accessToken,
        bookingId,
        reason.trim(),
        createIdempotencyKey('dispute'),
        evidence,
      );
    },
    onSuccess: (dispute) => {
      trackClientEvent('DISPUTE_RAISED', { bookingId: dispute.booking_id });
      toast.success(t('customerPages.disputeRaise.success'));
      navigate(`/customer/disputes/${dispute.id}`, { replace: true });
    },
    onError: (err) => {
      toast.error(parseError(err));
    },
  });

  const canSubmit = reason.trim().length >= 10 && !raiseDisputeMutation.isPending;

  return (
    <ScreenFrame maxWidth="narrow">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-destructive" />
            {t('customerPages.disputeRaise.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('customerPages.disputeRaise.description')}
          </p>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>{t('customerPages.disputeRaise.cardTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dispute-reason">{t('customerPages.disputeRaise.reasonLabel')}</Label>
              <Textarea
                id="dispute-reason"
                placeholder={t('customerPages.disputeRaise.reasonPlaceholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                minLength={10}
                maxLength={2000}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                {reason.length < 10
                  ? t('customerPages.disputeRaise.reasonMinLength', {
                      remaining: 10 - reason.length,
                    })
                  : t('customerPages.disputeRaise.charCount', {
                      count: reason.length,
                    })}
              </p>
            </div>

            <div className="grid gap-2">
              <Label>{t('customerPages.disputeRaise.evidenceTypeLabel')}</Label>
              <Select value={evidenceType} onValueChange={setEvidenceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(EVIDENCE_TYPE_LABEL_KEYS[type])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {evidenceType !== 'PHOTO' && (
              <div className="grid gap-2">
                <Label htmlFor="evidence-text">
                  {t('customerPages.disputeRaise.evidenceTextLabel')}
                </Label>
                <Textarea
                  id="evidence-text"
                  placeholder={t('customerPages.disputeRaise.evidenceTextPlaceholder')}
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  rows={3}
                  maxLength={2000}
                />
              </div>
            )}

            {evidenceType === 'PHOTO' && (
              <div className="grid gap-2">
                <Label>{t('customerPages.disputeRaise.photoEvidenceLabel')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('customerPages.disputeRaise.photoEvidenceHint')}
                </p>
              </div>
            )}

            <div className="bg-muted/30 border border-border/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                {t('customerPages.disputeRaise.phase1Notice')}
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
                disabled={raiseDisputeMutation.isPending}
              >
                {t('customerPages.disputeRaise.cancel')}
              </Button>
              <Button
                type="button"
                disabled={!canSubmit}
                onClick={() => raiseDisputeMutation.mutate()}
              >
                {raiseDisputeMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {t('customerPages.disputeRaise.submitAction')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScreenFrame>
  );
}
