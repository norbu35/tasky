import {useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {useMutation, useQuery} from "@tanstack/react-query";
import type {Booking} from "../../lib/apiClient";
import {Button} from "../../components/ui/button";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "../../components/ui/card";
import {Checkbox} from "../../components/ui/checkbox";
import {useAppContext} from "../context/AppContext";
import {ScreenFrame} from "../layout/ScreenFrame";
import {parseError} from "../utils/errorHandling";
import {createIdempotencyKey} from "../utils/idempotency";
import {AlertCircle, CheckCircle2, ChevronLeft, CreditCard, ShieldCheck} from "lucide-react";
import {Alert, AlertDescription, AlertTitle} from "../../components/ui/alert";
import {Avatar, AvatarFallback, AvatarImage} from "../../components/ui/avatar";
import {Separator} from "../../components/ui/separator";
import {Skeleton} from "../../components/ui/skeleton";
import {useTranslation} from "react-i18next";

export function BookingConfirmationPage() {
    const {apiClient, session, trackClientEvent} = useAppContext();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {t} = useTranslation();

    const taskId = searchParams.get("taskId");
    const applicationId = searchParams.get("applicationId");

    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
    const [successBooking, setSuccessBooking] = useState<Booking | null>(null);

    // Fetch Task and Application strictly for displaying info nicely (if possible)
    const {data: tasksPage, isLoading: loadingTask} = useQuery({
        queryKey: ["customerTasks", session?.accessToken],
        queryFn: async () => apiClient.listMyTasks(session!.accessToken),
        enabled: !!session && !!taskId
    });

    const {data: appsPage, isLoading: loadingApp} = useQuery({
        queryKey: ["taskApplications", taskId, session?.accessToken],
        queryFn: async () => apiClient.listTaskApplications(session!.accessToken, taskId!),
        enabled: !!session && !!taskId && !!applicationId
    });

    const acceptMutation = useMutation({
        mutationFn: async () => {
            if (!session || !taskId || !applicationId) throw new Error("Missing requirements");
            return apiClient.acceptApplication(
                session.accessToken,
                taskId!,
                applicationId!,
                disclaimerAccepted,
                createIdempotencyKey("accept")
            );
        },
        onSuccess: (booking) => {
            setSuccessBooking(booking);
            trackClientEvent("TASKER_ACCEPTED", {taskId: taskId || undefined, bookingId: booking.id});
            trackClientEvent("BOOKING_CONFIRMED", {taskId: taskId || undefined, bookingId: booking.id});
        }
    });

    if (!taskId || !applicationId) {
        return (
            <ScreenFrame>
                <Alert variant="destructive">
                    <AlertTitle>{t("bookingConfirmation.invalidRequestTitle", "Invalid Request")}</AlertTitle>
                    <AlertDescription>{t("bookingConfirmation.invalidRequestDesc", "Task ID and Application ID are missing from the URL.")}</AlertDescription>
                </Alert>
                <Button variant="ghost" className="mt-4" onClick={() => navigate("/customer/tasks")}>
                    {t("bookingConfirmation.backToDashboard", "Back to Dashboard")}
                </Button>
            </ScreenFrame>
        );
    }

    const task = tasksPage?.data.find(t => t.id === taskId);
    const application = appsPage?.data.find(a => a.id === applicationId);

    if (successBooking) {
        return (
            <ScreenFrame>
                <div className="max-w-xl mx-auto flex flex-col items-center justify-center text-center py-12">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600"/>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">{t("bookingConfirmation.bookingConfirmedTitle", "Booking Confirmed!")}</h1>
                    <p className="text-muted-foreground mb-8">
                        {t("bookingConfirmation.bookingConfirmedDesc", "Your booking has been successfully created. The Tasker will be notified.")}
                    </p>

                    <Card className="w-full text-left mb-8 shadow-sm">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle
                                className="text-lg">{t("bookingConfirmation.bookingDetails", "Booking Details")}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 grid gap-3">
                            <div className="flex justify-between">
                                <span
                                    className="text-muted-foreground">{t("bookingConfirmation.bookingId", "Booking ID")}</span>
                                <span className="font-medium">{successBooking.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span
                                    className="text-muted-foreground">{t("bookingConfirmation.status", "Status")}</span>
                                <span className="font-medium text-primary">{successBooking.status}</span>
                            </div>
                            {task && (
                                <div className="flex justify-between">
                                    <span
                                        className="text-muted-foreground">{t("bookingConfirmation.totalBudget", "Total Budget")}</span>
                                    <span className="font-semibold text-lg">₮{task.budget.toLocaleString()}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex gap-4 w-full">
                        <Button variant="secondary" className="flex-1" onClick={() => navigate("/customer/tasks")}>
                            {t("bookingConfirmation.backToTasks", "Back to Tasks")}
                        </Button>
                        <Button variant="secondary" className="flex-1" onClick={() => navigate("/booking/safety")}>
                            {t("bookingConfirmation.manageBooking", "Manage Booking")}
                        </Button>
                    </div>
                </div>
            </ScreenFrame>
        );
    }

    return (
        <ScreenFrame>
            <div className="max-w-3xl mx-auto">
                <Button variant="ghost" className="mb-6 -ml-2" onClick={() => navigate(-1)}>
                    <ChevronLeft className="w-4 h-4 mr-1"/>
                    {t("bookingConfirmation.back", "Back")}
                </Button>

                <h1 className="text-3xl font-bold tracking-tight mb-8">{t("bookingConfirmation.confirmBookingTitle", "Confirm Booking")}</h1>

                <div className="grid gap-8 md:grid-cols-[1fr_350px]">
                    <div className="space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold mb-4">{t("bookingConfirmation.taskDetailsTitle", "Task Details")}</h2>
                            {loadingTask ? (
                                <Skeleton className="w-full h-24"/>
                            ) : task ? (
                                <Card>
                                    <CardContent className="p-4">
                                        <h3 className="font-medium text-lg leading-tight mb-1">{task.description}</h3>
                                        <p className="text-muted-foreground text-sm">{task.location_text}</p>
                                        <div className="mt-3 text-sm font-medium">
                                            {t("bookingConfirmation.scheduledFor", "Scheduled for {{date}}", {date: new Date(task.scheduled_at).toLocaleString()})}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t("bookingConfirmation.taskLoadError", "Task details could not be loaded.")}</p>
                            )}
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-4">{t("bookingConfirmation.selectedTaskerTitle", "Selected Tasker")}</h2>
                            {loadingApp ? (
                                <Skeleton className="w-full h-20"/>
                            ) : application ? (
                                <div
                                    className="flex items-center gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                                    <Avatar className="w-14 h-14 border">
                                        {application.tasker.avatar_url &&
                                            <AvatarImage src={application.tasker.avatar_url}/>}
                                        <AvatarFallback>{application.tasker.full_name?.charAt(0) ?? "T"}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-semibold text-lg">{application.tasker.full_name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            ⭐ {application.tasker.rating_avg.toFixed(1)} • {t("bookingConfirmation.completedTasks", "{{count}} completed tasks", {count: application.tasker.completed_tasks})}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t("bookingConfirmation.applicantLoadError", "Applicant details could not be loaded.")}</p>
                            )}
                        </section>

                        <section className="bg-muted/30 p-4 rounded-lg flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-primary mt-0.5"/>
                            <div className="text-sm">
                                <p className="font-semibold mb-1">{t("bookingConfirmation.trustSafetyGuarantee", "Trust & Safety Guarantee")}</p>
                                <p className="text-muted-foreground">
                                    {t("bookingConfirmation.trustSafetyDesc", "Your payment is held securely until the task is completed to your satisfaction.")}
                                </p>
                            </div>
                        </section>

                        {acceptMutation.isError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4"/>
                                <AlertTitle>{t("bookingConfirmation.errorTitle", "Error")}</AlertTitle>
                                <AlertDescription>
                                    {parseError(acceptMutation.error)}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <div>
                        <Card className="sticky top-6 border-primary/20 shadow-lg">
                            <CardHeader className="bg-muted/20 border-b pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CreditCard className="w-4 h-4"/>
                                    {t("bookingConfirmation.summaryTitle", "Summary")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <span
                                        className="text-muted-foreground">{t("bookingConfirmation.taskBudget", "Task Budget")}</span>
                                    <span className="font-medium">
                                        {task?.budget ? `₮${task.budget.toLocaleString()}` : "—"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mb-4 text-sm">
                                    <span
                                        className="text-muted-foreground">{t("bookingConfirmation.platformFee", "Platform Fee (5%)")}</span>
                                    <span>{task?.budget ? `₮${(task.budget * 0.05).toLocaleString()}` : "—"}</span>
                                </div>
                                <Separator className="my-4"/>
                                <div className="flex justify-between items-center mb-6">
                                    <span
                                        className="font-semibold text-lg">{t("bookingConfirmation.total", "Total")}</span>
                                    <span className="font-bold text-2xl text-primary">
                                        {task?.budget ? `₮${(task.budget * 1.05).toLocaleString()}` : "—"}
                                    </span>
                                </div>

                                <div className="flex items-start space-x-3 mb-6 bg-muted/20 p-3 rounded-md border">
                                    <Checkbox
                                        id="liability-disclaimer"
                                        checked={disclaimerAccepted}
                                        onCheckedChange={(c) => setDisclaimerAccepted(c as boolean)}
                                        className="mt-1"
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor="liability-disclaimer"
                                            className="text-sm font-medium leading-tight cursor-pointer"
                                        >
                                            {t("bookingConfirmation.acceptTerms", "Accept Terms & Liability Disclaimer")}
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            {t("bookingConfirmation.termsDesc", "I agree to the platform's terms of service and hold harmless policies for this booking.")}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    className="w-full text-lg h-12"
                                    disabled={!disclaimerAccepted || acceptMutation.isPending}
                                    onClick={() => acceptMutation.mutate()}
                                >
                                    {acceptMutation.isPending ? t("bookingConfirmation.confirming", "Confirming...") : t("bookingConfirmation.confirmBookingBtn", "Confirm Booking")}
                                </Button>
                            </CardContent>
                            <CardFooter className="justify-center pt-0 pb-4 text-xs text-muted-foreground text-center">
                                {t("bookingConfirmation.chargeNotice", "You won't be charged until the task is done.")}
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </ScreenFrame>
    );
}
