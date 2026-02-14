import { useState } from "react";
import type { Booking } from "../../lib/apiClient";
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
import { useAppContext } from "../context/AppContext";
import { ScreenFrame } from "../layout/ScreenFrame";
import { parseError } from "../utils/errorHandling";
import { createIdempotencyKey } from "../utils/idempotency";

export function BookingPaymentPage() {
  const { apiClient, session, trackClientEvent } = useAppContext();
  const [taskId, setTaskId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [acceptedBooking, setAcceptedBooking] = useState<Booking | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const acceptApplication = async (): Promise<void> => {
    if (!session) {
      return;
    }
    if (!taskId.trim() || !applicationId.trim()) {
      setMessage("Task ID and Application ID are required.");
      return;
    }

    setWorking(true);
    setMessage(null);
    setPaymentUrl(null);
    setQrCode(null);
    try {
      const booking = await apiClient.acceptApplication(
        session.accessToken,
        taskId.trim(),
        applicationId.trim(),
        createIdempotencyKey("accept")
      );
      setAcceptedBooking(booking);
      setBookingId(booking.id);
      trackClientEvent("TASKER_ACCEPTED", { taskId: taskId.trim(), bookingId: booking.id });
      setMessage(`Application accepted. Booking created: ${booking.id}`);
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const initiatePayment = async (): Promise<void> => {
    if (!session) {
      return;
    }

    const bookingTarget = bookingId.trim() || acceptedBooking?.id;
    if (!bookingTarget) {
      setMessage("Booking ID is required before initiating payment.");
      return;
    }
    if (!disclaimerAccepted) {
      setMessage("Liability disclaimer must be accepted before payment.");
      return;
    }

    setWorking(true);
    setMessage(null);
    try {
      const payment = await apiClient.initiatePayment(
        session.accessToken,
        bookingTarget,
        createIdempotencyKey("payment")
      );
      setPaymentUrl(payment.paymentUrl);
      setQrCode(payment.qrCode);
      trackClientEvent("PAYMENT_INITIATED", { bookingId: bookingTarget });
      setMessage("Payment initiated.");
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScreenFrame>
      <Card className="border-border/70 shadow-xl shadow-foreground/5">
        <CardHeader>
          <CardTitle>Booking acceptance and payment</CardTitle>
          <CardDescription>
            Accept an applicant, acknowledge the liability disclaimer, and initiate QPay payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="accept-task-id">Task ID</Label>
              <Input
                id="accept-task-id"
                value={taskId}
                onChange={(event) => setTaskId(event.target.value)}
                placeholder="task-uuid"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accept-application-id">Application ID</Label>
              <Input
                id="accept-application-id"
                value={applicationId}
                onChange={(event) => setApplicationId(event.target.value)}
                placeholder="application-uuid"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={working} onClick={() => void acceptApplication()}>
              Accept application
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payment-booking-id">Booking ID</Label>
            <Input
              id="payment-booking-id"
              value={bookingId}
              onChange={(event) => setBookingId(event.target.value)}
              placeholder="booking-uuid"
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-muted-foreground" htmlFor="liability-disclaimer">
            <input
              id="liability-disclaimer"
              checked={disclaimerAccepted}
              onChange={(event) => setDisclaimerAccepted(event.target.checked)}
              type="checkbox"
            />
            <span>I acknowledge the liability disclaimer and want to proceed with payment.</span>
          </label>
          <div className="flex justify-end">
            <Button disabled={working || !disclaimerAccepted} onClick={() => void initiatePayment()}>
              Initiate payment
            </Button>
          </div>
          {paymentUrl ? (
            <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
              <p>
                Payment URL: <span className="font-medium">{paymentUrl}</span>
              </p>
              <p className="mt-1 break-all text-xs text-muted-foreground">QR payload: {qrCode}</p>
            </div>
          ) : null}
          {acceptedBooking ? (
            <p className="text-sm text-muted-foreground">
              Booking status: <span className="font-medium">{acceptedBooking.status}</span>
            </p>
          ) : null}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </ScreenFrame>
  );
}
