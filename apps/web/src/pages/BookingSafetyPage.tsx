import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Booking } from '../lib/apiClient';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useAppContext } from '../context/AppContext';
import { ScreenFrame } from '../layout/ScreenFrame';
import { toast } from 'sonner';
import { parseError } from '../lib/errorHandling';
import { createIdempotencyKey } from '../lib/idempotency';
import { useTranslation } from 'react-i18next';
import { CheckCircle, MoreVertical, ShieldAlert, Star, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';

export function BookingSafetyPage() {
  const { apiClient, session, trackClientEvent } = useAppContext();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // UI State
  const [activeTab, setActiveTab] = useState('ASSIGNED');
  const [actionDialog, setActionDialog] = useState<
    'CANCEL' | 'COMPLETE' | 'REVIEW' | 'DISPUTE' | null
  >(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Form states — multi-category review ratings
  const [qualityRating, setQualityRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [clarityRating, setClarityRating] = useState(5);
  const [respectfulnessRating, setRespectfulnessRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [disputeCategory, setDisputeCategory] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  const {
    data: bookingsArray = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bookings', session?.accessToken, activeTab],
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
      toast.success(t('bookingSafety.cancelSuccess', 'Booking cancelled successfully.'));
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
      toast.success(t('bookingSafety.completeSuccess', 'Booking marked as completed.'));
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const isUserCustomer =
    selectedBooking != null && session != null
      ? session.user.id === selectedBooking.customer_id
      : true;

  const reviewMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const userIsCustomer = session!.user.id === selectedBooking!.customer_id;
      return apiClient.submitReview(session!.accessToken, bookingId, {
        quality_rating: userIsCustomer ? qualityRating : 0,
        punctuality_rating: punctualityRating,
        communication_rating: userIsCustomer ? communicationRating : 0,
        clarity_rating: userIsCustomer ? 0 : clarityRating,
        respectfulness_rating: userIsCustomer ? 0 : respectfulnessRating,
        comment: reviewComment.trim() || null,
      });
    },
    onSuccess: () => {
      invalidateBookings();
      closeDialog();
      toast.success(t('bookingSafety.reviewSuccess', 'Review submitted successfully.'));
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
      toast.success(t('bookingSafety.disputeSuccess', 'Dispute raised successfully.'));
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const openDialog = (type: typeof actionDialog, booking: Booking) => {
    setSelectedBooking(booking);
    setActionDialog(type);
  };

  return (
    <ScreenFrame>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('bookingSafety.bookingManagement', 'Booking Management')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t(
              'bookingSafety.manageBookings',
              'Manage your active bookings, reviews and safety concerns.',
            )}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>{t('bookingSafety.errorLoading', 'Error Loading Bookings')}</AlertTitle>
            <AlertDescription>{parseError(error)}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/50 border">
            <TabsTrigger value="ASSIGNED">{t('bookingSafety.tabActive', 'Active')}</TabsTrigger>
            <TabsTrigger value="COMPLETED">
              {t('bookingSafety.tabCompleted', 'Completed')}
            </TabsTrigger>
            <TabsTrigger value="CANCELLED">
              {t('bookingSafety.tabCancelled', 'Cancelled')}
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[200px] w-full" />
              </div>
            ) : bookingsArray.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/10">
                <p className="text-muted-foreground">
                  {t('bookingSafety.noBookings', 'No bookings found in this state.')}
                </p>
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
                          {t('bookingSafety.bookingPrefix', 'Booking ')}
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
                        {t('bookingSafety.taskerId', 'Tasker ID:')}{' '}
                        <span className="font-mono text-xs">
                          {booking.tasker_id.slice(0, 8)}...
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="text-sm grid gap-2 text-muted-foreground">
                        <div className="flex justify-between">
                          <span>{t('bookingSafety.task', 'Task')}</span>
                          <span className="font-mono text-xs">
                            {booking.task_id.substring(0, 8)}...
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('bookingSafety.created', 'Created')}</span>
                          <span>{new Date(booking.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>

                    <div className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">
                              {t('bookingSafety.openMenu', 'Open menu')}
                            </span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          {booking.status === 'ASSIGNED' && (
                            <>
                              <DropdownMenuItem onClick={() => openDialog('COMPLETE', booking)}>
                                <CheckCircle className="mr-2 h-4 w-4" />{' '}
                                {t('bookingSafety.completeTask', 'Complete Task')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDialog('CANCEL', booking)}
                                className="text-destructive"
                              >
                                <XCircle className="mr-2 h-4 w-4" />{' '}
                                {t('bookingSafety.cancelBooking', 'Cancel Booking')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {booking.status === 'COMPLETED' && (
                            <>
                              <DropdownMenuItem onClick={() => openDialog('REVIEW', booking)}>
                                <Star className="mr-2 h-4 w-4" />{' '}
                                {t('bookingSafety.leaveReview', 'Leave Review')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDialog('DISPUTE', booking)}
                                className="text-accent focus:text-accent"
                              >
                                <ShieldAlert className="mr-2 h-4 w-4" />{' '}
                                {t('bookingSafety.raiseDispute', 'Raise Dispute')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {booking.status === 'CANCELLED' && (
                            <DropdownMenuItem disabled>
                              {t('bookingSafety.noActions', 'No actions available')}
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
            <DialogTitle>{t('bookingSafety.cancelTitle', 'Cancel Booking')}</DialogTitle>
            <DialogDescription>
              {t(
                'bookingSafety.cancelDesc',
                'Are you sure you want to cancel this booking? This action cannot be undone and may incur cancellation fees.',
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={closeDialog} disabled={cancelMutation.isPending}>
              {t('bookingSafety.closeBtn', 'Close')}
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => cancelMutation.mutate(selectedBooking!.id)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending
                ? t('bookingSafety.cancellingBtn', 'Cancelling...')
                : t('bookingSafety.yesCancelBtn', 'Yes, Cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Booking Dialog */}
      <Dialog open={actionDialog === 'COMPLETE'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('bookingSafety.completeTitle', 'Complete Booking')}</DialogTitle>
            <DialogDescription>
              {t(
                'bookingSafety.completeDesc',
                'Mark this booking as successfully completed. This will release payment to the Tasker.',
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={closeDialog} disabled={completeMutation.isPending}>
              {t('bookingSafety.closeBtn', 'Close')}
            </Button>
            <Button
              onClick={() => completeMutation.mutate(selectedBooking!.id)}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending
                ? t('bookingSafety.completingBtn', 'Completing...')
                : t('bookingSafety.markCompletedBtn', 'Mark Completed')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={actionDialog === 'REVIEW'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('bookingSafety.reviewTitle', 'Leave a Review')}</DialogTitle>
            <DialogDescription>
              {isUserCustomer
                ? t('bookingSafety.reviewDescCustomer', 'Rate your experience with the Tasker.')
                : t('bookingSafety.reviewDescTasker', 'Rate your experience with the Customer.')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isUserCustomer ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="qualityRating">
                    {t('bookingSafety.qualityRatingLabel', 'Quality (1-5)')}
                  </Label>
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
                    {t('bookingSafety.punctualityRatingLabel', 'Punctuality (1-5)')}
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
                    {t('bookingSafety.communicationRatingLabel', 'Communication (1-5)')}
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
                  <Label htmlFor="clarityRating">
                    {t('bookingSafety.clarityRatingLabel', 'Clarity (1-5)')}
                  </Label>
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
                    {t('bookingSafety.respectfulnessRatingLabel', 'Respectfulness (1-5)')}
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
                    {t('bookingSafety.punctualityRatingLabel', 'Punctuality (1-5)')}
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
              <Label htmlFor="comment">{t('bookingSafety.commentLabel', 'Comment')}</Label>
              <Textarea
                id="comment"
                placeholder={t('bookingSafety.commentPlaceholder', 'How was the service?')}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                maxLength={1000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeDialog} disabled={reviewMutation.isPending}>
              {t('bookingSafety.cancelActionBtn', 'Cancel')}
            </Button>
            <Button
              onClick={() => reviewMutation.mutate(selectedBooking!.id)}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending
                ? t('bookingSafety.submittingBtn', 'Submitting...')
                : t('bookingSafety.submitReviewBtn', 'Submit Review')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={actionDialog === 'DISPUTE'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />{' '}
              {t('bookingSafety.disputeTitle', 'Raise a Dispute')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'bookingSafety.disputeDesc',
                'If you have issues with a completed task (e.g., poor quality, damage), you can raise a dispute for our Trust & Safety team to review.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="disputeCategory">
                {t('bookingSafety.reasonCategoryLabel', 'Reason Category')}
              </Label>
              <select
                id="disputeCategory"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={disputeCategory}
                onChange={(e) => setDisputeCategory(e.target.value)}
              >
                <option value="" disabled>
                  {t('bookingSafety.selectReason', 'Select a reason...')}
                </option>
                <option value="POOR_QUALITY">
                  {t('bookingSafety.reasonQuality', 'Poor Quality of Work')}
                </option>
                <option value="LATE_OR_NO_SHOW">
                  {t('bookingSafety.reasonLate', 'Tasker was Late or No Show')}
                </option>
                <option value="DAMAGE_CAUSED">
                  {t('bookingSafety.reasonDamage', 'Damage Caused during Task')}
                </option>
                <option value="UNPROFESSIONAL">
                  {t('bookingSafety.reasonUnprofessional', 'Unprofessional Behavior')}
                </option>
                <option value="OTHER">{t('bookingSafety.reasonOther', 'Other Issue')}</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="disputeReason">
                {t('bookingSafety.detailsLabel', 'Additional Details')}
              </Label>
              <Textarea
                id="disputeReason"
                placeholder={t(
                  'bookingSafety.detailsPlaceholder',
                  'Please explain the issue in detail (min 10 characters)...',
                )}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeDialog} disabled={disputeMutation.isPending}>
              {t('bookingSafety.cancelActionBtn', 'Cancel')}
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => disputeMutation.mutate(selectedBooking!.id)}
              disabled={disputeMutation.isPending || disputeReason.length < 10 || !disputeCategory}
            >
              {disputeMutation.isPending
                ? t('bookingSafety.submittingBtn', 'Submitting...')
                : t('bookingSafety.submitDisputeBtn', 'Submit Dispute')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScreenFrame>
  );
}
