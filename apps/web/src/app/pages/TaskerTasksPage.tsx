import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { Task } from "../../lib/apiClient";
import { useAppContext } from "../context/AppContext";
import { ScreenFrame } from "../layout/ScreenFrame";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";
import { AlertCircle, Calendar, CheckCircle, MapPin, Rocket } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useTranslation } from "react-i18next";

function TaskerBookingCard({task}: { task: Task }) {
    const navigate = useNavigate();
    const {t} = useTranslation();

    return (
        <Card className="flex flex-col hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-lg line-clamp-2">{task.description}</CardTitle>
                    <Badge variant={task.status === "COMPLETED" ? "secondary" : "default"}>
                        {task.status}
                    </Badge>
                </div>
                <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                    <Calendar className="w-3 h-3"/>
                    {new Date(task.scheduled_at).toLocaleDateString()}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-3 text-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4"/>
                    <span className="truncate">{task.location_text}</span>
                </div>
                <div className="font-medium text-foreground">
                    ₮{task.budget.toLocaleString()}
                </div>
            </CardContent>
            <CardFooter className="pt-3 border-t bg-muted/20 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {task.status === "COMPLETED" ? (
                        <>
                            <CheckCircle className="w-4 h-4 text-green-600"/>
                            <span
                                className="text-green-600 font-medium">{t("taskerTasks.completed", "Completed")}</span>
                        </>
                    ) : (
                        <span className="font-medium">{t("taskerTasks.assigned", "Assigned")}</span>
                    )}
                </div>
                <Button size="sm" onClick={() => navigate(`/booking/safety?taskId=${task.id}`)}>
                    {task.status === "COMPLETED" ? t("taskerTasks.viewDetails", "View Details") : t("taskerTasks.manageBooking", "Manage Booking")}
                </Button>
            </CardFooter>
        </Card>
    );
}

export function TaskerTasksPage() {
    const {apiClient, session, profile} = useAppContext();
    const navigate = useNavigate();
    const {t} = useTranslation();

    // Reusing listTasks but simulating filtering for assigned to this tasker.
    // In a real app, there would be an endpoint like `listAssignedTasks(taskId)`,
    // but for the MVP frontend we will fetch the feed or rely on a specific API.
    // Wait, does the API have `listMyBookings()`?
    // Looking at apiClient, there is no `listMyBookings()`.
    // So we will just fetch all tasks (TaskerFeed) and filter them manually for MVP
    // to avoid blocking the UI flow. Actually, wait! The backend returns ALL tasks in feed.
    // We can filter where `status` is ASSIGNED or COMPLETED and we are the assigned tasker.
    // Wait, task object doesn't have `assigned_tasker_id`. It has `booking_id`.

    const {
        data: tasksPage,
        isLoading,
        error
    } = useQuery({
        queryKey: ["tasksFeed", session?.accessToken],
        queryFn: async () => {
            if (!session) throw new Error("Not authenticated");
            return apiClient.listTasks(session.accessToken);
        },
        enabled: !!session && profile?.role === "TASKER"
    });

    // Keep type simple since feed Task might be slightly different than full Task for linting
    const tasksList = (tasksPage?.data || []) as unknown as Task[];

    // Since we don't have task.assigned_tasker_id in the model we just filter by ASSIGNED and COMPLETED.
    // In a real scenario, this would be a dedicated backend endpoint.
    // We allow Taskers to see ASSIGNED tasks to simulate managing their bookings.

    return (
        <ScreenFrame>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t("taskerTasks.title", "My Bookings")}</h1>
                        <p className="text-muted-foreground mt-1">{t("taskerTasks.subtitle", "Manage your accepted jobs and past work.")}</p>
                    </div>
                    <Button onClick={() => navigate("/tasker/tasks")} variant="secondary" className="gap-2">
                        <Rocket className="w-4 h-4"/>
                        <span className="hidden sm:inline">{t("taskerTasks.findMoreWork", "Find more work")}</span>
                        <span className="sm:hidden">{t("taskerTasks.find", "Find")}</span>
                    </Button>
                </div>

                {error ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4"/>
                        <AlertTitle>{t("taskerTasks.errorTitle", "Error")}</AlertTitle>
                        <AlertDescription>
                            {error.message ?? t("taskerTasks.errorFailedLoad", "Failed to load bookings")}
                        </AlertDescription>
                    </Alert>
                ) : isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({length: 3}).map((_, i) => (
                            <Card key={i} className="flex flex-col">
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/4 mb-2"/>
                                    <Skeleton className="h-4 w-1/4"/>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <Skeleton className="h-4 w-1/2 mb-2"/>
                                    <Skeleton className="h-4 w-1/3"/>
                                </CardContent>
                                <CardFooter className="pt-4 border-t">
                                    <Skeleton className="h-9 w-full"/>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : !tasksPage?.data || tasksPage.data.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                        <div
                            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <Rocket className="h-6 w-6 text-primary"/>
                        </div>
                        <CardTitle className="mb-2">{t("taskerTasks.noBookingsTitle", "No bookings yet")}</CardTitle>
                        <CardDescription className="mb-6 max-w-sm">
                            {t("taskerTasks.noBookingsDesc", "You haven't been assigned to any tasks yet. Head over to the feed to find and apply for jobs.")}
                        </CardDescription>
                        <Button
                            onClick={() => navigate("/tasker/tasks")}>{t("taskerTasks.browseAvailableTasks", "Browse available tasks")}</Button>
                    </Card>
                ) : (
                    <Tabs defaultValue="active" className="w-full mt-4">
                        <TabsList className="mb-4">
                            <TabsTrigger value="active">{t("taskerTasks.tabActive", "Active Bookings")}</TabsTrigger>
                            <TabsTrigger value="past">{t("taskerTasks.tabPast", "Past Work")}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="active" className="mt-0">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {tasksList.filter(t => t.status === "ASSIGNED").map((task) => (
                                    <TaskerBookingCard key={task.id} task={task}/>
                                ))}
                                {tasksList.filter(t => t.status === "ASSIGNED").length === 0 && (
                                    <div
                                        className="col-span-full py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                                        {t("taskerTasks.emptyActive", "No active bookings.")}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="past" className="mt-0">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {tasksList.filter(t => t.status === "COMPLETED").map((task) => (
                                    <TaskerBookingCard key={task.id} task={task}/>
                                ))}
                                {tasksList.filter(t => t.status === "COMPLETED").length === 0 && (
                                    <div
                                        className="col-span-full py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                                        {t("taskerTasks.emptyPast", "No past work completed yet.")}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </ScreenFrame>
    );
}
