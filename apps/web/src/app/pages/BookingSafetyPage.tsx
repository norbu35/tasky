import { useState } from "react";
import type {
  Booking,
  Dispute,
  Review
} from "../../lib/apiClient";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useAppContext } from "../context/AppContext";
import { ScreenFrame } from "../layout/ScreenFrame";
import { parseError } from "../utils/errorHandling";
import { createIdempotencyKey } from "../utils/idempotency";

export function BookingSafetyPage() {
  const { apiClient, session, trackClientEvent } = useAppContext();
  const [bookingId, setBookingId] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "customer" | "tasker">("customer");
  const [statusFilter, setStatusFilter] = useState<"" | "PENDING_PAYMENT" | "PAID" | "COMPLETED" | "CANCELLED">(
    ""
  );
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewUserId, setReviewUserId] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [disputeReason, setDisputeReason] = useState("");
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const listBookings = async (): Promise<void> => {
    if (!session) {
      return;
    }
    setWorking(true);
    setMessage(null);
    try {
      const response = await apiClient.listBookings(session.accessToken, {
        role: roleFilter || undefined,
        status: statusFilter || undefined
      });
      setBookings(response.data);
      setMessage(`Loaded ${response.data.length} booking(s).`);
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const loadBooking = async (): Promise<void> => {
    if (!session || !bookingId.trim()) {
      setMessage("Booking ID is required.");
      return;
    }

    setWorking(true);
    setMessage(null);
    try {
      const booking = await apiClient.getBooking(session.accessToken, bookingId.trim());
      setActiveBooking(booking);
      setReviewUserId(booking.tasker_id);
      setMessage("Booking loaded.");
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const cancelBooking = async (): Promise<void> => {
    if (!session || !activeBooking) {
      setMessage("Load a booking first.");
      return;
    }
    setWorking(true);
    setMessage(null);
    try {
      const booking = await apiClient.cancelBooking(
        session.accessToken,
        activeBooking.id,
        createIdempotencyKey("cancel")
      );
      setActiveBooking(booking);
      setMessage("Booking cancelled.");
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const completeBooking = async (): Promise<void> => {
    if (!session || !activeBooking) {
      setMessage("Load a booking first.");
      return;
    }
    setWorking(true);
    setMessage(null);
    try {
      const booking = await apiClient.completeBooking(
        session.accessToken,
        activeBooking.id,
        createIdempotencyKey("complete")
      );
      setActiveBooking(booking);
      trackClientEvent("BOOKING_COMPLETED", {
        bookingId: booking.id,
        taskId: booking.task_id
      });
      setMessage("Booking marked complete.");
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const submitReview = async (): Promise<void> => {
    if (!session || !activeBooking) {
      setMessage("Load a booking first.");
      return;
    }
    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      setMessage("Rating must be between 1 and 5.");
      return;
    }

    setWorking(true);
    setMessage(null);
    try {
      await apiClient.submitReview(session.accessToken, activeBooking.id, {
        rating: numericRating,
        comment: reviewComment.trim() || null
      });
      setMessage("Review submitted.");
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const loadReviews = async (): Promise<void> => {
    if (!session || !reviewUserId.trim()) {
      setMessage("Review user ID is required.");
      return;
    }
    setWorking(true);
    setMessage(null);
    try {
      const response = await apiClient.getUserReviews(session.accessToken, reviewUserId.trim());
      setReviews(response.data);
      setMessage(`Loaded ${response.data.length} review(s).`);
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const raiseDispute = async (): Promise<void> => {
    if (!session || !activeBooking) {
      setMessage("Load a booking first.");
      return;
    }
    if (disputeReason.trim().length < 10) {
      setMessage("Dispute reason must be at least 10 characters.");
      return;
    }
    setWorking(true);
    setMessage(null);
    try {
      const dispute = await apiClient.raiseDispute(
        session.accessToken,
        activeBooking.id,
        disputeReason.trim(),
        createIdempotencyKey("dispute")
      );
      setActiveDispute(dispute);
      trackClientEvent("DISPUTE_RAISED", {
        bookingId: dispute.booking_id,
        taskId: activeBooking.task_id
      });
      setMessage(`Dispute raised: ${dispute.id}`);
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const refreshDispute = async (): Promise<void> => {
    if (!session || !activeDispute) {
      return;
    }
    setWorking(true);
    setMessage(null);
    try {
      const dispute = await apiClient.getDispute(session.accessToken, activeDispute.id);
      setActiveDispute(dispute);
      setMessage(`Dispute status: ${dispute.status}`);
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScreenFrame>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="border-border/70 shadow-xl shadow-foreground/5">
          <CardHeader>
            <CardTitle>Booking safety actions</CardTitle>
            <CardDescription>
              Track booking transitions, cancellations, completion, reviews, and disputes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="booking-role-filter">Booking role filter</Label>
                <select
                  id="booking-role-filter"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={roleFilter}
                  onChange={(event) => {
                    setRoleFilter(event.target.value as "" | "customer" | "tasker");
                  }}
                >
                  <option value="">All</option>
                  <option value="customer">customer</option>
                  <option value="tasker">tasker</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="booking-status-filter">Booking status filter</Label>
                <select
                  id="booking-status-filter"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(
                      event.target.value as "" | "PENDING_PAYMENT" | "PAID" | "COMPLETED" | "CANCELLED"
                    );
                  }}
                >
                  <option value="">All</option>
                  <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                  <option value="PAID">PAID</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button disabled={working} onClick={() => void listBookings()} variant="secondary">
                List bookings
              </Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="safety-booking-id">Booking ID</Label>
              <Input
                id="safety-booking-id"
                value={bookingId}
                onChange={(event) => setBookingId(event.target.value)}
                placeholder="booking-uuid"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button disabled={working} onClick={() => void loadBooking()} variant="secondary">
                Load booking
              </Button>
              <Button disabled={working || !activeBooking} onClick={() => void cancelBooking()}>
                Cancel booking
              </Button>
              <Button disabled={working || !activeBooking} onClick={() => void completeBooking()}>
                Complete booking
              </Button>
            </div>
            {activeBooking ? (
              <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
                <p>
                  Current booking status: <span className="font-medium">{activeBooking.status}</span>
                </p>
                <p className="text-muted-foreground">Booking ID: {activeBooking.id}</p>
              </div>
            ) : null}
            <div className="grid gap-2 md:grid-cols-[140px_minmax(0,1fr)]">
              <div className="grid gap-2">
                <Label htmlFor="review-rating">Rating</Label>
                <Input
                  id="review-rating"
                  inputMode="numeric"
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="review-comment">Review comment</Label>
                <Textarea
                  id="review-comment"
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="Quality, punctuality, and communication feedback."
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button disabled={working || !activeBooking} onClick={() => void submitReview()}>
                Submit review
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="grid gap-2">
                <Label htmlFor="review-user-id">Review user ID</Label>
                <Input
                  id="review-user-id"
                  value={reviewUserId}
                  onChange={(event) => setReviewUserId(event.target.value)}
                  placeholder="user-uuid"
                />
              </div>
              <Button disabled={working} onClick={() => void loadReviews()} variant="secondary">
                Load reviews
              </Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dispute-reason">Dispute reason</Label>
              <Textarea
                id="dispute-reason"
                value={disputeReason}
                onChange={(event) => setDisputeReason(event.target.value)}
                placeholder="Describe what happened and what resolution you seek."
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button disabled={working || !activeBooking} onClick={() => void raiseDispute()}>
                Raise dispute
              </Button>
              <Button disabled={working || !activeDispute} onClick={() => void refreshDispute()} variant="secondary">
                Refresh dispute
              </Button>
            </div>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Safety snapshot</CardTitle>
            <CardDescription>Loaded bookings, reviews, and dispute detail.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div>
              <p className="text-sm font-medium">Bookings</p>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings loaded.</p>
              ) : (
                bookings.map((booking) => (
                  <p className="text-sm text-muted-foreground" key={booking.id}>
                    {booking.id}: {booking.status}
                  </p>
                ))
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Reviews</p>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews loaded.</p>
              ) : (
                reviews.map((review) => (
                  <p className="text-sm text-muted-foreground" key={review.id}>
                    {review.id}: {review.rating}/5
                  </p>
                ))
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Dispute</p>
              {activeDispute ? (
                <p className="text-sm text-muted-foreground">
                  {activeDispute.id}: {activeDispute.status}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No dispute loaded.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScreenFrame>
  );
}
