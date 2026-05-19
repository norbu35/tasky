import { differenceInHours, differenceInMinutes } from 'date-fns';
import type { TFunction } from 'i18next';
import { CheckCircle, ChevronDown, ChevronRight, RefreshCw, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { useAppContext } from '../../context/AppContext';
import { useAdminApiClient } from '../../lib/adminApiClient';
import type { VerificationDetail } from '../../lib/apiClient';
import { parseError } from '../../lib/errorHandling';
import { formatDateTime } from '../../lib/formatDate';

const SLA_HOURS = 24;

interface SlaInfo {
  label: string;
  colorClass: string;
}

function computeSla(submittedAt: string, now: Date, t: TFunction): SlaInfo {
  const submitted = new Date(submittedAt);
  const deadlineMs = submitted.getTime() + SLA_HOURS * 60 * 60 * 1000;
  const remainingMs = deadlineMs - now.getTime();

  if (remainingMs <= 0) {
    return {
      label: t('admin.verifications.overdue'),
      colorClass: 'bg-destructive text-destructive-foreground border-transparent',
    };
  }

  const hoursLeft = differenceInHours(deadlineMs, now);
  const minutesLeft = differenceInMinutes(deadlineMs, now) % 60;
  const label = t('admin.verifications.slaTimeLeft', {
    hours: hoursLeft,
    minutes: minutesLeft,
  });

  if (hoursLeft >= 12) {
    return { label, colorClass: 'bg-verified/15 text-verified border-verified/30' };
  }
  if (hoursLeft >= 4) {
    return { label, colorClass: 'bg-sun-wash/30 text-sun-light border-sun-wash/50' };
  }
  return { label, colorClass: 'bg-destructive/15 text-destructive border-destructive/30' };
}

export function AdminVerificationsPage() {
  const { t } = useTranslation();
  const { session } = useAppContext();
  const adminApiClient = useAdminApiClient();

  const [verifications, setVerifications] = useState<VerificationDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [confirmingRejectId, setConfirmingRejectId] = useState<string | null>(null);

  const accessToken = session?.accessToken;

  const fetchVerifications = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.adminListPendingVerifications(accessToken);
      const sorted = [...data].sort(
        (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime(),
      );
      setVerifications(sorted);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleApprove = useCallback(
    async (verificationId: string) => {
      if (!accessToken) return;
      setApprovingId(verificationId);
      try {
        await adminApiClient.adminApproveVerification(accessToken, verificationId);
        setVerifications((prev) => prev.filter((v) => v.id !== verificationId));
        setExpandedId(null);
      } catch (err) {
        setError(parseError(err));
      } finally {
        setApprovingId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessToken],
  );

  const handleRejectClick = useCallback((verificationId: string) => {
    setRejectingId(verificationId);
    setRejectReason('');
  }, []);

  const handleConfirmReject = useCallback(
    async (verificationId: string) => {
      if (!accessToken || !rejectReason.trim()) return;
      setConfirmingRejectId(verificationId);
      try {
        await adminApiClient.adminRejectVerification(
          accessToken,
          verificationId,
          rejectReason.trim(),
        );
        setVerifications((prev) => prev.filter((v) => v.id !== verificationId));
        setRejectingId(null);
        setRejectReason('');
        setExpandedId(null);
      } catch (err) {
        setError(parseError(err));
      } finally {
        setConfirmingRejectId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessToken, rejectReason],
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setRejectingId(null);
    setRejectReason('');
  }, []);

  const now = new Date();

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t('admin.verifications.title')}
        </h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && verifications.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t('admin.verifications.title')}
        </h1>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-body-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchVerifications}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('admin.verifications.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verifications.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t('admin.verifications.title')}
        </h1>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-body-sm text-muted-foreground">{t('admin.verifications.empty')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t('admin.verifications.title')}
        </h1>
        <Button variant="outline" size="sm" onClick={fetchVerifications}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('admin.verifications.refresh')}
        </Button>
      </div>

      <div className="space-y-4">
        {verifications.map((v) => {
          const sla = computeSla(v.submitted_at, now, t);
          const isExpanded = expandedId === v.id;
          const isRejecting = rejectingId === v.id;

          return (
            <Card key={v.id} className="overflow-hidden">
              <div
                data-testid={`verification-row-${v.id}`}
                className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleExpand(v.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(v.id);
                  }
                }}
              >
                <span className="text-muted-foreground">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-body font-medium truncate">{v.user_name}</span>
                    <span className="text-body-sm text-muted-foreground">{v.user_phone}</span>
                  </div>
                  <p className="text-badge-text text-muted-foreground mt-1">
                    {t('admin.verifications.submittedAt')} {formatDateTime(v.submitted_at)}
                  </p>
                </div>

                <Badge
                  data-testid={`sla-badge-${v.id}`}
                  className={`${sla.colorClass} uppercase tracking-caps`}
                >
                  {sla.label}
                </Badge>
              </div>

              {isExpanded && (
                <CardContent className="border-t border-border/30 pt-6 pb-6 space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold mb-3 uppercase tracking-caps text-muted-foreground">
                      {t('admin.verifications.documents')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-badge-text text-muted-foreground mb-1.5">
                          {t('admin.verifications.idFront')}
                        </p>
                        <img
                          src={v.id_card_front_url}
                          alt={t('admin.verifications.idFront')}
                          className="rounded-lg border border-border/40 object-cover w-full max-h-48 shadow-card"
                        />
                      </div>
                      <div>
                        <p className="text-badge-text text-muted-foreground mb-1.5">
                          {t('admin.verifications.idBack')}
                        </p>
                        <img
                          src={v.id_card_back_url}
                          alt={t('admin.verifications.idBack')}
                          className="rounded-lg border border-border/40 object-cover w-full max-h-48 shadow-card"
                        />
                      </div>
                      {v.selfie_url && (
                        <div>
                          <p className="text-badge-text text-muted-foreground mb-1.5">
                            {t('admin.verifications.selfie')}
                          </p>
                          <img
                            src={v.selfie_url}
                            alt={t('admin.verifications.selfie')}
                            className="rounded-lg border border-border/40 object-cover w-full max-h-48 shadow-card"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {isRejecting && (
                    <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                      <Input
                        placeholder={t('admin.verifications.rejectReasonPlaceholder')}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!rejectReason.trim() || confirmingRejectId === v.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmReject(v.id);
                          }}
                        >
                          {confirmingRejectId === v.id
                            ? t('admin.verifications.rejecting')
                            : t('admin.verifications.confirmReject')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRejectingId(null);
                            setRejectReason('');
                          }}
                        >
                          {t('admin.verifications.cancel')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isRejecting && (
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-verified/40 text-verified hover:bg-verified/10 hover:text-verified"
                        disabled={approvingId === v.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(v.id);
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {approvingId === v.id
                          ? t('admin.verifications.approving')
                          : t('admin.verifications.approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectClick(v.id);
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {t('admin.verifications.reject')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
