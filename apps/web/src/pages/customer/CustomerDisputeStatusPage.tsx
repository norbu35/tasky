import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, Loader2, MessageSquare, ShieldAlert, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ScreenFrame } from '../../layout/ScreenFrame';
import { parseError } from '../../lib/errorHandling';

const STATUS_CONFIG: Record<
  string,
  { icon: typeof Clock; color: string; tone: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  EVIDENCE_NEEDED: { icon: Clock, color: 'text-amber-500', tone: 'outline' },
  OPEN: { icon: Clock, color: 'text-amber-500', tone: 'outline' },
  ESCALATED: { icon: ShieldAlert, color: 'text-orange-500', tone: 'destructive' },
  RESOLVED_CUSTOMER: { icon: CheckCircle, color: 'text-emerald-500', tone: 'default' },
  RESOLVED_TASKER: { icon: XCircle, color: 'text-red-500', tone: 'secondary' },
  CLOSED_INSUFFICIENT_EVIDENCE: { icon: XCircle, color: 'text-gray-500', tone: 'secondary' },
};

const DISPUTE_STATUS_LABEL_KEYS = {
  EVIDENCE_NEEDED: 'customerPages.disputeStatus.statusLabel.EVIDENCE_NEEDED',
  OPEN: 'customerPages.disputeStatus.statusLabel.OPEN',
  ESCALATED: 'customerPages.disputeStatus.statusLabel.ESCALATED',
  RESOLVED_CUSTOMER: 'customerPages.disputeStatus.statusLabel.RESOLVED_CUSTOMER',
  RESOLVED_TASKER: 'customerPages.disputeStatus.statusLabel.RESOLVED_TASKER',
  CLOSED_INSUFFICIENT_EVIDENCE:
    'customerPages.disputeStatus.statusLabel.CLOSED_INSUFFICIENT_EVIDENCE',
  UNKNOWN: 'customerPages.disputeStatus.statusLabel.UNKNOWN',
} as const;

function getDisputeStatusLabelKey(status: string): string {
  const key = status as keyof typeof DISPUTE_STATUS_LABEL_KEYS;
  return DISPUTE_STATUS_LABEL_KEYS[key] ?? DISPUTE_STATUS_LABEL_KEYS.UNKNOWN;
}

export function CustomerDisputeStatusPage() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();

  const {
    data: dispute,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dispute', disputeId, session, apiClient],
    queryFn: async () => {
      if (!session || !disputeId) throw new Error('Missing session or dispute ID');
      return apiClient.getDispute(session.accessToken, disputeId);
    },
    enabled: !!session && !!disputeId,
  });

  const config = dispute
    ? (STATUS_CONFIG[dispute.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG['OPEN'])
    : STATUS_CONFIG['OPEN'];
  const StatusIcon = config.icon;
  const isResolved =
    dispute?.status?.startsWith('RESOLVED') || dispute?.status === 'CLOSED_INSUFFICIENT_EVIDENCE';

  return (
    <ScreenFrame maxWidth="narrow">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            {t('customerPages.disputeStatus.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('customerPages.disputeStatus.description')}
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <Card className="border-destructive/40">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{parseError(error)}</p>
            </CardContent>
          </Card>
        )}

        {dispute && (
          <div className="space-y-4">
            {/* Status Card */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <StatusIcon className={`w-5 h-5 ${config.color}`} />
                    {t(getDisputeStatusLabelKey(dispute.status))}
                  </CardTitle>
                  <Badge variant={config.tone}>{dispute.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('customerPages.disputeStatus.disputeId')}
                  </span>
                  <span className="font-mono text-xs">{dispute.id.substring(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('customerPages.disputeStatus.bookingId')}
                  </span>
                  <span className="font-mono text-xs">
                    {dispute.booking_id.substring(0, 12)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('customerPages.disputeStatus.filedOn')}
                  </span>
                  <span>
                    {new Date(dispute.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Reason Card */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>{t('customerPages.disputeStatus.reasonTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{dispute.reason}</p>
              </CardContent>
            </Card>

            {/* Resolution Card */}
            {isResolved && dispute.resolution_notes && (
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>{t('customerPages.disputeStatus.resolutionTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  {dispute.resolution_notes && (
                    <p className="whitespace-pre-wrap">{dispute.resolution_notes}</p>
                  )}
                  {dispute.resolved_at && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t('customerPages.disputeStatus.resolvedOn')}</span>
                      <span>
                        {new Date(dispute.resolved_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Open Status Notice */}
            {!isResolved && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">
                        {t('customerPages.disputeStatus.underReviewTitle')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('customerPages.disputeStatus.underReviewDesc')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                {t('customerPages.disputeStatus.back')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/customer/bookings/${dispute.booking_id}`)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {t('customerPages.disputeStatus.viewBooking')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </ScreenFrame>
  );
}
