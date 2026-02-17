import {useState} from "react";
import type {Booking} from "../../lib/apiClient";
import {Button} from "../../components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "../../components/ui/card";
import {Input} from "../../components/ui/input";
import {Label} from "../../components/ui/label";
import {useAppContext} from "../context/AppContext";
import {ScreenFrame} from "../layout/ScreenFrame";
import {parseError} from "../utils/errorHandling";
import {createIdempotencyKey} from "../utils/idempotency";

export function BookingConfirmationPage() {
    const {apiClient, session, trackClientEvent} = useAppContext();
    const [taskId, setTaskId] = useState("");
    const [applicationId, setApplicationId] = useState("");
    const [acceptedBooking, setAcceptedBooking] = useState<Booking | null>(null);
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
    const [working, setWorking] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const confirmBooking = async (): Promise<void> => {
        if (!session) {
            return;
        }
        if (!taskId.trim() || !applicationId.trim()) {
            setMessage("Task ID and Application ID are required.");
            return;
        }
        if (!disclaimerAccepted) {
            setMessage("Liability disclaimer must be accepted before booking confirmation.");
            return;
        }

        setWorking(true);
        setMessage(null);
        try {
            const booking = await apiClient.acceptApplication(
                session.accessToken,
                taskId.trim(),
                applicationId.trim(),
                disclaimerAccepted,
                createIdempotencyKey("accept")
            );
            setAcceptedBooking(booking);
            trackClientEvent("TASKER_ACCEPTED", {taskId: taskId.trim(), bookingId: booking.id});
            trackClientEvent("BOOKING_CONFIRMED", {taskId: taskId.trim(), bookingId: booking.id});
            setMessage(`Booking confirmed: ${booking.id}`);
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
                    <CardTitle>Booking confirmation</CardTitle>
                    <CardDescription>
                        Accept an applicant and acknowledge the liability disclaimer to confirm booking.
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
                    <label className="flex items-start gap-2 text-sm text-muted-foreground"
                           htmlFor="liability-disclaimer">
                        <input
                            id="liability-disclaimer"
                            checked={disclaimerAccepted}
                            onChange={(event) => setDisclaimerAccepted(event.target.checked)}
                            type="checkbox"
                        />
                        <span>I acknowledge the liability disclaimer and want to confirm this booking.</span>
                    </label>
                    <div className="flex justify-end">
                        <Button disabled={working || !disclaimerAccepted} onClick={() => void confirmBooking()}>
                            Confirm booking
                        </Button>
                    </div>
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
