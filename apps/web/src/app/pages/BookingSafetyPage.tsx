import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Booking } from "../../lib/apiClient";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import { useAppContext } from "../context/AppContext";
import { ScreenFrame } from "../layout/ScreenFrame";
import { parseError } from "../utils/errorHandling";
import { createIdempotencyKey } from "../utils/idempotency";
import { AlertCircle, ShieldAlert, MoreVertical, CheckCircle, XCircle, Star } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";

export function BookingSafetyPage() {
    const { apiClient, session, trackClientEvent } = useAppContext();
    const queryClient = useQueryClient();

    // UI State
    const [activeTab, setActiveTab] = useState("ASSIGNED");
    const [actionDialog, setActionDialog] = useState<"CANCEL" | "COMPLETE" | "REVIEW" | "DISPUTE" | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // Form states
    const [rating, setRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [disputeCategory, setDisputeCategory] = useState("");
    const [disputeReason, setDisputeReason] = useState("");

    const { data: bookingsArray = [], isLoading, error } = useQuery({
        queryKey: ["bookings", session?.accessToken, activeTab],
        queryFn: async () => {
            if (!session) throw new Error("Not authenticated");
            const res = await apiClient.listBookings(session.accessToken, {
                role: "customer", // we're fetching customer view by default, you could toggle this
                status: activeTab as any
            });
            return res.data;
        },
        enabled: !!session
    });

    const closeDialog = () => {
        setActionDialog(null);
        setSelectedBooking(null);
        setActionError(null);
        setReviewComment("");
        setRating(5);
        setDisputeCategory("");
        setDisputeReason("");
    };

    const invalidateBookings = () => {
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
    };

    const cancelMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            return apiClient.cancelBooking(session!.accessToken, bookingId, createIdempotencyKey("cancel"));
        },
        onSuccess: () => {
            invalidateBookings();
            closeDialog();
        },
        onError: (err) => setActionError(parseError(err))
    });

    const completeMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            return apiClient.completeBooking(session!.accessToken, bookingId, createIdempotencyKey("complete"));
        },
        onSuccess: (booking) => {
            trackClientEvent("BOOKING_COMPLETED", { bookingId: booking.id, taskId: booking.task_id });
            invalidateBookings();
            closeDialog();
        },
        onError: (err) => setActionError(parseError(err))
    });

    const reviewMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            return apiClient.submitReview(session!.accessToken, bookingId, {
                rating, comment: reviewComment.trim() || null
            });
        },
        onSuccess: () => {
            invalidateBookings();
            closeDialog();
        },
        onError: (err) => setActionError(parseError(err))
    });

    const disputeMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const combinedReason = disputeCategory ? `[${disputeCategory}] ${disputeReason.trim()}` : disputeReason.trim();
            return apiClient.raiseDispute(session!.accessToken, bookingId, combinedReason, createIdempotencyKey("dispute"));
        },
        onSuccess: (dispute) => {
            trackClientEvent("DISPUTE_RAISED", { bookingId: dispute.booking_id, taskId: selectedBooking?.task_id });
            invalidateBookings();
            closeDialog();
        },
        onError: (err) => setActionError(parseError(err))
    });

    const openDialog = (type: typeof actionDialog, booking: Booking) => {
        setSelectedBooking(booking);
        setActionDialog(type);
    };

    return (
        <ScreenFrame>
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Booking Management</h1>
                    <p className="text-muted-foreground mt-1">Manage your active bookings, reviews and safety concerns.</p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error Loading Bookings</AlertTitle>
                        <AlertDescription>{parseError(error)}</AlertDescription>
                    </Alert>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/50 border">
                        <TabsTrigger value="ASSIGNED">Active</TabsTrigger>
                        <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
                        <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        {isLoading ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                <Skeleton className="h-[200px] w-full" />
                                <Skeleton className="h-[200px] w-full" />
                            </div>
                        ) : bookingsArray.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/10">
                                <p className="text-muted-foreground">No bookings found in this state.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {bookingsArray.map(booking => (
                                    <Card key={booking.id} className="relative overflow-hidden group hover:border-primary/40 transition-colors">
                                        <CardHeader className="pb-3 pr-10">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-base font-semibold leading-tight line-clamp-1 truncate mr-2" title={booking.id}>
                                                    Booking {booking.id.substring(0, 8)}...
                                                </CardTitle>
                                                <Badge
                                                    variant={
                                                        booking.status === "ASSIGNED" ? "default" :
                                                            booking.status === "COMPLETED" ? "secondary" : "destructive"
                                                    }
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </div>
                                            <CardDescription>
                                                Tasker ID: <span className="font-mono text-xs">{booking.tasker_id.slice(0, 8)}...</span>
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pb-4">
                                            <div className="text-sm grid gap-2 text-muted-foreground">
                                                <div className="flex justify-between">
                                                    <span>Task</span>
                                                    <span className="font-mono text-xs">{booking.task_id.substring(0, 8)}...</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Created</span>
                                                    <span>{new Date(booking.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </CardContent>

                                        <div className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[160px]">
                                                    {booking.status === "ASSIGNED" && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => openDialog("COMPLETE", booking)}>
                                                                <CheckCircle className="mr-2 h-4 w-4" /> Complete Task
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openDialog("CANCEL", booking)} className="text-destructive">
                                                                <XCircle className="mr-2 h-4 w-4" /> Cancel Booking
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {booking.status === "COMPLETED" && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => openDialog("REVIEW", booking)}>
                                                                <Star className="mr-2 h-4 w-4" /> Leave Review
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openDialog("DISPUTE", booking)} className="text-amber-600 focus:text-amber-600">
                                                                <ShieldAlert className="mr-2 h-4 w-4" /> Raise Dispute
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {booking.status === "CANCELLED" && (
                                                        <DropdownMenuItem disabled>
                                                            No actions available
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
            <Dialog open={actionDialog === "CANCEL"} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Booking</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this booking? This action cannot be undone and may incur cancellation fees.
                        </DialogDescription>
                    </DialogHeader>
                    {actionError && <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert>}
                    <DialogFooter className="mt-4">
                        <Button variant="secondary" onClick={closeDialog} disabled={cancelMutation.isPending}>Close</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => cancelMutation.mutate(selectedBooking!.id)} disabled={cancelMutation.isPending}>
                            {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Complete Booking Dialog */}
            <Dialog open={actionDialog === "COMPLETE"} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Booking</DialogTitle>
                        <DialogDescription>
                            Mark this booking as successfully completed. This will release payment to the Tasker.
                        </DialogDescription>
                    </DialogHeader>
                    {actionError && <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert>}
                    <DialogFooter className="mt-4">
                        <Button variant="secondary" onClick={closeDialog} disabled={completeMutation.isPending}>Close</Button>
                        <Button onClick={() => completeMutation.mutate(selectedBooking!.id)} disabled={completeMutation.isPending}>
                            {completeMutation.isPending ? "Completing..." : "Mark Completed"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Review Dialog */}
            <Dialog open={actionDialog === "REVIEW"} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Leave a Review</DialogTitle>
                        <DialogDescription>
                            Rate your experience with the Tasker.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="rating">Rating (1-5)</Label>
                            <Input
                                id="rating"
                                type="number"
                                min={1} max={5}
                                value={rating}
                                onChange={(e) => setRating(parseInt(e.target.value) || 5)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="comment">Comment</Label>
                            <Textarea
                                id="comment"
                                placeholder="How was the service?"
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                            />
                        </div>
                    </div>
                    {actionError && <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert>}
                    <DialogFooter>
                        <Button variant="secondary" onClick={closeDialog} disabled={reviewMutation.isPending}>Cancel</Button>
                        <Button onClick={() => reviewMutation.mutate(selectedBooking!.id)} disabled={reviewMutation.isPending}>
                            {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dispute Dialog */}
            <Dialog open={actionDialog === "DISPUTE"} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5" /> Raise a Dispute
                        </DialogTitle>
                        <DialogDescription>
                            If you have issues with a completed task (e.g., poor quality, damage), you can raise a dispute for our Trust & Safety team to review.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="disputeCategory">Reason Category</Label>
                            <select
                                id="disputeCategory"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={disputeCategory}
                                onChange={(e) => setDisputeCategory(e.target.value)}
                            >
                                <option value="" disabled>Select a reason...</option>
                                <option value="POOR_QUALITY">Poor Quality of Work</option>
                                <option value="LATE_OR_NO_SHOW">Tasker was Late or No Show</option>
                                <option value="DAMAGE_CAUSED">Damage Caused during Task</option>
                                <option value="UNPROFESSIONAL">Unprofessional Behavior</option>
                                <option value="OTHER">Other Issue</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="disputeReason">Additional Details</Label>
                            <Textarea
                                id="disputeReason"
                                placeholder="Please explain the issue in detail (min 10 characters)..."
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    {actionError && <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert>}
                    <DialogFooter>
                        <Button variant="secondary" onClick={closeDialog} disabled={disputeMutation.isPending}>Cancel</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => disputeMutation.mutate(selectedBooking!.id)} disabled={disputeMutation.isPending || disputeReason.length < 10 || !disputeCategory}>
                            {disputeMutation.isPending ? "Submitting..." : "Submit Dispute"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </ScreenFrame>
    );
}
