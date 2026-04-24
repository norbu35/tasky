import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, Clock, Loader2, UserX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ScreenFrame } from '../../layout/ScreenFrame';
import { parseError } from '../../lib/errorHandling';
import { createIdempotencyKey } from '../../lib/idempotency';

export function TaskerNoShowDialog() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [confirmText, setConfirmText] = useState('');

  const flagMutation = useMutation({
    mutationFn: async () => {
      if (!session || !bookingId) throw new Error('Missing session or booking ID');
      return apiClient.flagNoShow(session.accessToken, bookingId, createIdempotencyKey('noshow'));
    },
    onSuccess: () => {
      toast.success(t('taskerPages.noShow.success', 'No-show flagged successfully.'));
      navigate(-1);
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const isConfirmed = confirmText === 'NO-SHOW';

  return (
    <ScreenFrame maxWidth="narrow">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <UserX className="w-6 h-6 text-destructive" />
            {t('taskerPages.noShow.title', 'Flag no-show')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              'taskerPages.noShow.description',
              'Flag the other party as a no-show. The system validates eligibility automatically.',
            )}
          </p>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              {t('taskerPages.noShow.timingTitle', 'Timing rules')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">30 min</span>
              <span>{t('taskerPages.noShow.reminderRule', 'Reminder sent automatically')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">1 hr</span>
              <span>{t('taskerPages.noShow.eligibleRule', 'No-show flag becomes eligible')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">
                  {t('taskerPages.noShow.warningTitle', 'Before you flag')}
                </p>
                <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                  <li>
                    {t(
                      'taskerPages.noShow.warningActivity',
                      'Recent in-app activity blocks premature flags.',
                    )}
                  </li>
                  <li>
                    {t(
                      'taskerPages.noShow.warningReschedule',
                      'An accepted reschedule supersedes the original schedule.',
                    )}
                  </li>
                  <li>
                    {t(
                      'taskerPages.noShow.warningAudit',
                      'No-show adjudication creates an audit trail.',
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>{t('taskerPages.noShow.confirmTitle', 'Confirm no-show')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t('taskerPages.noShow.confirmLabel', 'Type NO-SHOW to confirm')}</Label>
              <input
                className="flex h-12 w-full rounded-md border-[1.5px] border-border bg-background px-4 py-3 text-base font-sans text-foreground transition-colors placeholder:text-text-tertiary focus-visible:outline-none focus-visible:border-foreground"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="NO-SHOW"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
                disabled={flagMutation.isPending}
              >
                {t('taskerPages.noShow.cancel', 'Cancel')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={!isConfirmed || flagMutation.isPending}
                onClick={() => flagMutation.mutate()}
              >
                {flagMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('taskerPages.noShow.flagButton', 'Flag no-show')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScreenFrame>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {children}
    </label>
  );
}
