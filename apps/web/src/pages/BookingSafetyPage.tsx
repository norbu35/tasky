import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, MoreVertical, RefreshCw, ShieldAlert, Star, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { useAppContext } from '../context/AppContext';
import { ScreenFrame } from '../layout/ScreenFrame';
import type { Booking } from '../lib/apiClient';
import { parseError } from '../lib/errorHandling';
import { formatDate } from '../lib/formatDate';
import { createIdempotencyKey } from '../lib/idempotency';

export function BookingSafetyPage() {
  const { apiClient, session, trackClientEvent } = useAppContext();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // UI State
  const [activeTab, setActiveTab] = useState('ASSIGNED');
  const [actionDialog, setActionDialog] = useState<
    'CANCEL' | 'COMPLETE' | 'REVIEW' | 'DISPUTE' | 'MARK_DONE' | null
  >(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Form states — multi-category review ratings
  const [qualityRating, setQualityRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [clarityRating, setClarityRating] = useState(5);
  const [respectfulnessRating, setRespectfulnessRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [wouldBookAgain, setWouldBookAgain] = useState<boolean | null>(null);
  const [disputeCategory, setDisputeCategory] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  const {
    data: bookingsArray = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bookings', session, activeTab, apiClient],
    queryFn: async () => {
      if (!session) throw new Error('Not authenticated');
      const res = await apiClient.listBookings(session.accessToken, {
        role: 'customer', // we're fetching customer view by default, you could toggle this
        status: activeTab as 'ASSIGNED' | 'COMPLETED' | 'CANCELLED',
      });
      return res.data;
    },
    enabled: !!session,
  });

  const closeDialog = () => {
    setActionDialog(null);
    setSelectedBooking(null);
    setReviewComment('');
    setQualityRating(5);
    setPunctualityRating(5);
    setCommunicationRating(5);
    setClarityRating(5);
    setRespectfulnessRating(5);
    setWouldBookAgain(null);
    setDisputeCategory('');
    setDisputeReason('');
  };

  const invalidateBookings = () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiClient.cancelBooking(
        session!.accessToken,
        bookingId,
        createIdempotencyKey('cancel'),
      );
    },
    onSuccess: () => {
      invalidateBookings();
      closeDialog();
      toast.success(t('bookingSafety.cancelSuccess'));
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const completeMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiClient.completeBooking(
        session!.accessToken,
        bookingId,
        createIdempotencyKey('complete'),
      );
    },
    onSuccess: (booking) => {
      trackClientEvent('BOOKING_COMPLETED', { bookingId: booking.id, taskId: booking.task_id });
      invalidateBookings();
      closeDialog();
      toast.success(t('bookingSafety.completeSuccess'));
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const markDoneMutation = useMutation({
    mutationFn: async ({
      bookingId,
      proof,
    }: {
      bookingId: string;
      proof?: { photo_key?: string; note?: string };
    }) => {
      return apiClient.markBookingDone(
        session!.accessToken,
        bookingId,
        createIdempotencyKey('mark-done'),
        proof,
      );
    },
    onSuccess: (booking) => {
      trackClientEvent('BOOKING_MARKED_DONE', { bookingId: booking.id, taskId: booking.task_id });
      invalidateBookings();
      closeDialog();
      toast.success(t('bookingSafety.markDoneSuccess'));
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const rebookMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiClient.rebookBooking(
        session!.accessToken,
        bookingId,
        createIdempotencyKey('rebook'),
      );
    },
    onSuccess: () => {
      trackClientEvent('BOOKING_REBOOKED', { bookingId: selectedBooking?.id });
      invalidateBookings();
      closeDialog();
      toast.success(t('bookingSafety.rebookSuccess'));
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const handleRebook = (booking: Booking) => {
    rebookMutation.mutate(booking.id);
  };

  const isUserCustomer =
    selectedBooking != null && session != null
      ? session.user.id === selectedBooking.customer_id
      : true;

  const reviewMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const userIsCustomer = session!.user.id === selectedBooking!.customer_id;
      return apiClient.submitReview(session!.accessToken, bookingId, {
        ...(userIsCustomer ? { quality_rating: qualityRating } : {}),
        punctuality_rating: punctualityRating,
        ...(userIsCustomer ? { communication_rating: communicationRating } : {}),
        ...(!userIsCustomer ? { clarity_rating: clarityRating } : {}),
        ...(!userIsCustomer ? { respectfulness_rating: respectfulnessRating } : {}),
        comment: reviewComment.trim() || null,
        ...(userIsCustomer && wouldBookAgain !== null ? { would_book_again: wouldBookAgain } : {}),
      });
    },
    onSuccess: () => {
      invalidateBookings();
      closeDialog();
      toast.success(t('bookingSafety.reviewSuccess'));
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const disputeMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const combinedReason = disputeCategory
        ? `[${disputeCategory}] ${disputeReason.trim()}`
        : disputeReason.trim();
      return apiClient.raiseDispute(
        session!.accessToken,
        bookingId,
        combinedReason,
        createIdempotencyKey('dispute'),
      );
    },
    onSuccess: (dispute) => {
      trackClientEvent('DISPUTE_RAISED', {
        bookingId: dispute.booking_id,
        taskId: selectedBooking?.task_id,
      });
      invalidateBookings();
      closeDialog();
      toast.success(t('bookingSafety.disputeSuccess'));
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const openDialog = (type: typeof actionDialog, booking: Booking) => {
    setSelectedBooking(booking);
    setActionDialog(type);
  };

  return (
    <ScreenFrame>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t('bookingSafety.bookingManagement')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('bookingSafety.manageBookings')}</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>{t('bookingSafety.errorLoading')}</AlertTitle>
            <AlertDescription>{parseError(error)}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/50 border">
            <TabsTrigger value="ASSIGNED">{t('bookingSafety.tabActive')}</TabsTrigger>
            <TabsTrigger value="COMPLETED">{t('bookingSafety.tabCompleted')}</TabsTrigger>
            <TabsTrigger value="CANCELLED">{t('bookingSafety.tabCancelled')}</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[200px] w-full" />
              </div>
            ) : bookingsArray.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/10">
                <p className="text-muted-foreground">{t('bookingSafety.noBookings')}</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {bookingsArray.map((booking) => (
                  <Card
                    key={booking.id}
                    className="relative overflow-hidden group hover:border-primary/40 transition-colors"
                  >
                    <CardHeader className="pb-3 pr-10">
                      <div className="flex justify-between items-start">
                        <CardTitle
                          className="text-base font-semibold leading-tight line-clamp-1 truncate mr-2"
                          title={booking.id}
                        >
                          {t('bookingSafety.bookingPrefix')}
                          {booking.id.substring(0, 8)}...
                        </CardTitle>
                        <Badge
                          variant={
                            booking.status === 'ASSIGNED'
                              ? 'default'
                              : booking.status === 'COMPLETED'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {t('bookingSafety.taskerId')}{' '}
                        <span className="font-mono text-xs">
                          {booking.tasker_id.slice(0, 8)}...
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="text-sm grid gap-2 text-muted-foreground">
                        <div className="flex justify-between">
                          <span>{t('bookingSafety.task')}</span>
                          <span className="font-mono text-xs">
                            {booking.task_id.substring(0, 8)}...
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('bookingSafety.created')}</span>
                          <span>{formatDate(booking.created_at)}</span>
                        </div>
                      </div>
                    </CardContent>

                    <div className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">{t('bookingSafety.openMenu')}</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          {booking.status === 'ASSIGNED' && (
                            <>
                              {!isUserCustomer && (
                                <DropdownMenuItem onClick={() => openDialog('MARK_DONE', booking)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />{' '}
                                  {t('bookingSafety.markDoneTask')}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => openDialog('COMPLETE', booking)}>
                                <CheckCircle className="mr-2 h-4 w-4" />{' '}
                                {t('bookingSafety.completeTask')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDialog('CANCEL', booking)}
                                className="text-destructive"
                              >
                                <XCircle className="mr-2 h-4 w-4" />{' '}
                                {t('bookingSafety.cancelBooking')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDialog('DISPUTE', booking)}
                                className="text-accent focus:text-accent"
                              >
                                <ShieldAlert className="mr-2 h-4 w-4" />{' '}
                                {t('bookingSafety.raiseDispute')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {booking.status === 'COMPLETED' && (
                            <>
                              <DropdownMenuItem onClick={() => openDialog('REVIEW', booking)}>
                                <Star className="mr-2 h-4 w-4" /> {t('bookingSafety.leaveReview')}
                              </DropdownMenuItem>
                              {isUserCustomer && (
                                <DropdownMenuItem onClick={() => handleRebook(booking)}>
                                  <RefreshCw className="mr-2 h-4 w-4" />{' '}
                                  {t('bookingSafety.rebookAction')}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => openDialog('DISPUTE', booking)}
                                className="text-accent focus:text-accent"
                              >
                                <ShieldAlert className="mr-2 h-4 w-4" />{' '}
                                {t('bookingSafety.raiseDispute')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {booking.status === 'CANCELLED' && (
                            <DropdownMenuItem disabled>
                              {t('bookingSafety.noActions')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {/* Cancel Booking Dialog */}
      <Dialog open={actionDialog === 'CANCEL'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('bookingSafety.cancelTitle')}</DialogTitle>
            <DialogDescription>{t('bookingSafety.cancelDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={closeDialog} disabled={cancelMutation.isPending}>
              {t('bookingSafety.closeBtn')}
            </Button>
            <Button
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => cancelMutation.mutate(selectedBooking!.id)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending
                ? t('bookingSafety.cancellingBtn')
                : t('bookingSafety.yesCancelBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Booking Dialog */}
      <Dialog open={actionDialog === 'COMPLETE'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('bookingSafety.completeTitle')}</DialogTitle>
            <DialogDescription>{t('bookingSafety.completeDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={closeDialog} disabled={completeMutation.isPending}>
              {t('bookingSafety.closeBtn')}
            </Button>
            <Button
              onClick={() => completeMutation.mutate(selectedBooking!.id)}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending
                ? t('bookingSafety.completingBtn')
                : t('bookingSafety.markCompletedBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Done Dialog (Tasker) */}
      <Dialog open={actionDialog === 'MARK_DONE'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('bookingSafety.markDoneTitle')}</DialogTitle>
            <DialogDescription>{t('bookingSafety.markDoneDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={closeDialog} disabled={markDoneMutation.isPending}>
              {t('bookingSafety.closeBtn')}
            </Button>
            <Button
              onClick={() => markDoneMutation.mutate({ bookingId: selectedBooking!.id })}
              disabled={markDoneMutation.isPending}
            >
              {markDoneMutation.isPending
                ? t('bookingSafety.markingDoneBtn')
                : t('bookingSafety.markDoneBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={actionDialog === 'REVIEW'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('bookingSafety.reviewTitle')}</DialogTitle>
            <DialogDescription>
              {isUserCustomer
                ? t('bookingSafety.reviewDescCustomer')
                : t('bookingSafety.reviewDescTasker')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isUserCustomer ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="qualityRating">{t('bookingSafety.qualityRatingLabel')}</Label>
                  <Input
                    id="qualityRating"
                    type="number"
                    min={1}
                    max={5}
                    value={qualityRating}
                    onChange={(e) => setQualityRating(parseInt(e.target.value) || 5)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="punctualityRating">
                    {t('bookingSafety.punctualityRatingLabel')}
                  </Label>
                  <Input
                    id="punctualityRating"
                    type="number"
                    min={1}
                    max={5}
                    value={punctualityRating}
                    onChange={(e) => setPunctualityRating(parseInt(e.target.value) || 5)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="communicationRating">
                    {t('bookingSafety.communicationRatingLabel')}
                  </Label>
                  <Input
                    id="communicationRating"
                    type="number"
                    min={1}
                    max={5}
                    value={communicationRating}
                    onChange={(e) => setCommunicationRating(parseInt(e.target.value) || 5)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="clarityRating">{t('bookingSafety.clarityRatingLabel')}</Label>
                  <Input
                    id="clarityRating"
                    type="number"
                    min={1}
                    max={5}
                    value={clarityRating}
                    onChange={(e) => setClarityRating(parseInt(e.target.value) || 5)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="respectfulnessRating">
                    {t('bookingSafety.respectfulnessRatingLabel')}
                  </Label>
                  <Input
                    id="respectfulnessRating"
                    type="number"
                    min={1}
                    max={5}
                    value={respectfulnessRating}
                    onChange={(e) => setRespectfulnessRating(parseInt(e.target.value) || 5)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="punctualityRatingTasker">
                    {t('bookingSafety.punctualityRatingLabel')}
                  </Label>
                  <Input
                    id="punctualityRatingTasker"
                    type="number"
                    min={1}
                    max={5}
                    value={punctualityRating}
                    onChange={(e) => setPunctualityRating(parseInt(e.target.value) || 5)}
                  />
                </div>
              </>
            )}
            <div className="grid gap-2">
              <Label htmlFor="comment">{t('bookingSafety.commentLabel')}</Label>
              <Textarea
                id="comment"
                placeholder={t('bookingSafety.commentPlaceholder')}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                maxLength={1000}
              />
            </div>
            {isUserCustomer && (
              <div className="grid gap-2">
                <Label>{t('bookingSafety.wouldBookAgainLabel')}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={wouldBookAgain === true ? 'default' : 'outline'}
                    onClick={() => setWouldBookAgain(true)}
                  >
                    {t('bookingSafety.wouldBookAgainYes')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={wouldBookAgain === false ? 'default' : 'outline'}
                    onClick={() => setWouldBookAgain(false)}
                  >
                    {t('bookingSafety.wouldBookAgainNo')}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeDialog} disabled={reviewMutation.isPending}>
              {t('bookingSafety.cancelActionBtn')}
            </Button>
            <Button
              onClick={() => reviewMutation.mutate(selectedBooking!.id)}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending
                ? t('bookingSafety.submittingBtn')
                : t('bookingSafety.submitReviewBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={actionDialog === 'DISPUTE'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> {t('bookingSafety.disputeTitle')}
            </DialogTitle>
            <DialogDescription>{t('bookingSafety.disputeDesc')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="disputeCategory">{t('bookingSafety.reasonCategoryLabel')}</Label>
              <Select value={disputeCategory} onValueChange={setDisputeCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t('bookingSafety.selectReason')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POOR_QUALITY">{t('bookingSafety.reasonQuality')}</SelectItem>
                  <SelectItem value="LATE_OR_NO_SHOW">{t('bookingSafety.reasonLate')}</SelectItem>
                  <SelectItem value="DAMAGE_CAUSED">{t('bookingSafety.reasonDamage')}</SelectItem>
                  <SelectItem value="UNPROFESSIONAL">
                    {t('bookingSafety.reasonUnprofessional')}
                  </SelectItem>
                  <SelectItem value="OTHER">{t('bookingSafety.reasonOther')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="disputeReason">{t('bookingSafety.detailsLabel')}</Label>
              <Textarea
                id="disputeReason"
                placeholder={t('bookingSafety.detailsPlaceholder')}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeDialog} disabled={disputeMutation.isPending}>
              {t('bookingSafety.cancelActionBtn')}
            </Button>
            <Button
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => disputeMutation.mutate(selectedBooking!.id)}
              disabled={disputeMutation.isPending || disputeReason.length < 10 || !disputeCategory}
            >
              {disputeMutation.isPending
                ? t('bookingSafety.submittingBtn')
                : t('bookingSafety.submitDisputeBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScreenFrame>
  );
}
