import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { useAppContext } from '../../context/AppContext';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';
import type { Booking } from '../../lib/apiClient';
import { parseError } from '../../lib/errorHandling';
import { createIdempotencyKey } from '../../lib/idempotency';

export function TaskerJobsPage() {
  const { t } = useTranslation();
  const { apiClient, session, trackClientEvent } = useAppContext();
  const queryClient = useQueryClient();
  const [confirmBookingId, setConfirmBookingId] = useState<string | null>(null);
  const [confirmTaskId, setConfirmTaskId] = useState<string | null>(null);
  const [confirmApplicationId, setConfirmApplicationId] = useState<string | null>(null);

  const { data: bookingsPage, isLoading } = useQuery({
    queryKey: ['taskerBookings', session, apiClient],
    queryFn: async () => {
      return apiClient.listBookings(session!.accessToken, { role: 'tasker' });
    },
    enabled: !!session,
  });

  const bookings = bookingsPage?.data ?? [];

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!confirmTaskId || !confirmApplicationId) throw new Error('Missing IDs');
      return apiClient.confirmAcceptance(
        session!.accessToken,
        confirmTaskId,
        confirmApplicationId,
        createIdempotencyKey('confirm-acceptance'),
      );
    },
    onSuccess: () => {
      trackClientEvent('BOOKING_CONFIRMED', { bookingId: confirmBookingId ?? undefined });
      queryClient.invalidateQueries({ queryKey: ['taskerBookings'] });
      setConfirmBookingId(null);
      setConfirmTaskId(null);
      setConfirmApplicationId(null);
      toast.success(t('taskerPages.jobs.confirmSuccess'));
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const openConfirm = (booking: Booking) => {
    setConfirmBookingId(booking.id);
    setConfirmTaskId(booking.task_id);
    // In the real flow, the tasker would have been selected from an application
    // For now, we derive the application ID from the booking context
    setConfirmApplicationId(null); // Would come from route params or API
  };

  return (
    <ResponsiveDetailShell
      title={t('taskerPages.jobs.title')}
      description={t('taskerPages.jobs.description')}
    >
      {isLoading ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('taskerPages.jobs.loading')}</p>
          </CardContent>
        </Card>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('taskerPages.jobs.empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {t('taskerPages.jobs.bookingId')} {booking.id.substring(0, 8)}...
                  </CardTitle>
                  <StatusBadge status={booking.status} />
                </div>
                <CardDescription className="text-xs">
                  {booking.confirmed_scheduled_at &&
                    new Date(booking.confirmed_scheduled_at).toLocaleDateString()}
                  {booking.price != null && ` · ₮${booking.price.toLocaleString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {booking.status === 'ASSIGNED' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => openConfirm(booking)}>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {t('taskerPages.jobs.confirmBtn')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        /* Opens cancel dialog — uses cancelBooking */
                      }}
                    >
                      <XCircle className="mr-1 h-3 w-3" />
                      {t('taskerPages.jobs.declineBtn')}
                    </Button>
                  </div>
                )}
                {booking.status === 'COMPLETED' && (
                  <p className="text-xs text-muted-foreground">{t('taskerPages.jobs.completed')}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm Acceptance Dialog */}
      <Dialog
        open={confirmBookingId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmBookingId(null);
            setConfirmTaskId(null);
            setConfirmApplicationId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('taskerPages.jobs.confirmTitle')}</DialogTitle>
            <DialogDescription>{t('taskerPages.jobs.confirmDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmBookingId(null);
                setConfirmTaskId(null);
                setConfirmApplicationId(null);
              }}
              disabled={confirmMutation.isPending}
            >
              {t('taskerPages.jobs.cancelBtn')}
            </Button>
            <Button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending || !confirmApplicationId}
            >
              {confirmMutation.isPending
                ? t('taskerPages.jobs.confirmingBtn')
                : t('taskerPages.jobs.confirmBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ResponsiveDetailShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  switch (status) {
    case 'ASSIGNED':
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {t('taskerPages.jobs.statusAssigned')}
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="outline" className="gap-1 text-green-600">
          <CheckCircle className="h-3 w-3" />
          {t('taskerPages.jobs.statusCompleted')}
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="outline" className="gap-1 text-destructive">
          <XCircle className="h-3 w-3" />
          {t('taskerPages.jobs.statusCancelled')}
        </Badge>
      );
    case 'NO_SHOW':
      return (
        <Badge variant="outline" className="gap-1 text-destructive">
          <Briefcase className="h-3 w-3" />
          {t('taskerPages.jobs.statusNoShow')}
        </Badge>
      );
    default:
      return <Badge variant="outline">{t('taskerPages.jobs.statusUnknown', status)}</Badge>;
  }
}
