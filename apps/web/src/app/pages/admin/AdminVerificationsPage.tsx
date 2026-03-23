import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { differenceInHours, differenceInMinutes } from "date-fns";
import { CheckCircle, ChevronDown, ChevronRight, RefreshCw, XCircle } from "lucide-react";
import type { VerificationDetail } from "../../../lib/apiClient";
import { useAppContext } from "../../context/AppContext";
import { parseError } from "../../utils/errorHandling";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Skeleton } from "../../../components/ui/skeleton";

// ── SLA helpers ──────────────────────────────────────────────────────

const SLA_HOURS = 24;

interface SlaInfo {
  label: string;
  colorClass: string;
}

function computeSla(submittedAt: string, now: Date): SlaInfo {
  const submitted = new Date(submittedAt);
  const deadlineMs = submitted.getTime() + SLA_HOURS * 60 * 60 * 1000;
  const remainingMs = deadlineMs - now.getTime();

  if (remainingMs <= 0) {
    return { label: "Overdue", colorClass: "bg-red-700 text-white" };
  }

  const hoursLeft = differenceInHours(deadlineMs, now);
  const minutesLeft = differenceInMinutes(deadlineMs, now) % 60;
  const label = `${hoursLeft}h ${minutesLeft}m`;

  if (hoursLeft >= 12) {
    return { label, colorClass: "bg-green-100 text-green-800 border-green-300" };
  }
  if (hoursLeft >= 4) {
    return { label, colorClass: "bg-yellow-100 text-yellow-800 border-yellow-300" };
  }
  return { label, colorClass: "bg-red-100 text-red-800 border-red-300" };
}

// ── Component ────────────────────────────────────────────────────────

export function AdminVerificationsPage() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();

  const [verifications, setVerifications] = useState<VerificationDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reject flow state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Action busy flags
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [confirmingRejectId, setConfirmingRejectId] = useState<string | null>(null);

  const accessToken = session?.accessToken;

  const fetchVerifications = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.adminListPendingVerifications(accessToken);
      // Sort by submitted_at ascending (oldest first — highest urgency)
      const sorted = [...data].sort(
        (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
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
        await apiClient.adminApproveVerification(accessToken, verificationId);
        setVerifications((prev) => prev.filter((v) => v.id !== verificationId));
        setExpandedId(null);
      } catch (err) {
        setError(parseError(err));
      } finally {
        setApprovingId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessToken]
  );

  const handleRejectClick = useCallback((verificationId: string) => {
    setRejectingId(verificationId);
    setRejectReason("");
  }, []);

  const handleConfirmReject = useCallback(
    async (verificationId: string) => {
      if (!accessToken || !rejectReason.trim()) return;
      setConfirmingRejectId(verificationId);
      try {
        await apiClient.adminRejectVerification(
          accessToken,
          verificationId,
          rejectReason.trim()
        );
        setVerifications((prev) => prev.filter((v) => v.id !== verificationId));
        setRejectingId(null);
        setRejectReason("");
        setExpandedId(null);
      } catch (err) {
        setError(parseError(err));
      } finally {
        setConfirmingRejectId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessToken, rejectReason]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    // Clear reject state when collapsing
    setRejectingId(null);
    setRejectReason("");
  }, []);

  const now = new Date();

  // ── Loading State ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">
          {t("admin.verifications.title", "Verifications")}
        </h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────
  if (error && verifications.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">
          {t("admin.verifications.title", "Verifications")}
        </h1>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <Button variant="secondary" onClick={fetchVerifications}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("admin.verifications.retry", "Retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Empty State ────────────────────────────────────────────────────
  if (verifications.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">
          {t("admin.verifications.title", "Verifications")}
        </h1>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">
              {t("admin.verifications.empty", "No pending verifications")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main List ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {t("admin.verifications.title", "Verifications")}
        </h1>
        <Button variant="secondary" size="sm" onClick={fetchVerifications}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("admin.verifications.refresh", "Refresh")}
        </Button>
      </div>

      <div className="space-y-3">
        {verifications.map((v) => {
          const sla = computeSla(v.submitted_at, now);
          const isExpanded = expandedId === v.id;
          const isRejecting = rejectingId === v.id;

          return (
            <Card key={v.id} className="overflow-hidden">
              {/* Clickable Row Header */}
              <div
                data-testid={`verification-row-${v.id}`}
                className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(v.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
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
                    <span className="font-medium truncate">{v.user_name}</span>
                    <span className="text-sm text-muted-foreground">{v.user_phone}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("admin.verifications.submittedAt", "Submitted:")}{" "}
                    {new Date(v.submitted_at).toLocaleString()}
                  </p>
                </div>

                <Badge
                  data-testid={`sla-badge-${v.id}`}
                  className={sla.colorClass}
                >
                  {sla.label}
                </Badge>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <CardContent className="border-t pt-6 space-y-6">
                  {/* ID Card Images */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">
                      {t("admin.verifications.documents", "Identity Documents")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {t("admin.verifications.idFront", "ID Front")}
                        </p>
                        <img
                          src={v.id_card_front_url}
                          alt="ID Card Front"
                          className="rounded-lg border object-cover w-full max-h-48"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {t("admin.verifications.idBack", "ID Back")}
                        </p>
                        <img
                          src={v.id_card_back_url}
                          alt="ID Card Back"
                          className="rounded-lg border object-cover w-full max-h-48"
                        />
                      </div>
                      {v.selfie_url && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {t("admin.verifications.selfie", "Selfie")}
                          </p>
                          <img
                            src={v.selfie_url}
                            alt="Selfie"
                            className="rounded-lg border object-cover w-full max-h-48"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reject Reason Input */}
                  {isRejecting && (
                    <div className="space-y-2">
                      <Input
                        placeholder={t(
                          "admin.verifications.rejectReasonPlaceholder",
                          "Enter rejection reason..."
                        )}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          disabled={
                            !rejectReason.trim() || confirmingRejectId === v.id
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmReject(v.id);
                          }}
                        >
                          {confirmingRejectId === v.id
                            ? t("admin.verifications.rejecting", "Rejecting...")
                            : t("admin.verifications.confirmReject", "Confirm Reject")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRejectingId(null);
                            setRejectReason("");
                          }}
                        >
                          {t("admin.verifications.cancel", "Cancel")}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!isRejecting && (
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={approvingId === v.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(v.id);
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {approvingId === v.id
                          ? t("admin.verifications.approving", "Approving...")
                          : t("admin.verifications.approve", "Approve")}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectClick(v.id);
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {t("admin.verifications.reject", "Reject")}
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
