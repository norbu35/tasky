import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { Task } from "../../lib/apiClient";
import { useAppContext } from "../context/AppContext";
import { ScreenFrame } from "../layout/ScreenFrame";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";
import { AlertCircle, Calendar, CheckCircle, MapPin, Plus, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useTranslation } from "react-i18next";

function TaskCard({task}: { task: Task }) {
    const navigate = useNavigate();
    const {t} = useTranslation();

    return (
        <Card className="flex flex-col hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-lg line-clamp-2">{task.description}</CardTitle>
                    <Badge variant={task.status === "OPEN" ? "default" : "secondary"}>
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
                    {task.status === "OPEN" ? (
                        <>
                            <Users className="w-4 h-4"/>
                            <span>{t("customerDashboard.reviewApplicants", "Review applicants")}</span>
                        </>
                    ) : task.status === "ASSIGNED" ? (
                        <>
                            <CheckCircle className="w-4 h-4 text-green-600"/>
                            <span
                                className="text-green-600 font-medium">{t("customerDashboard.booked", "Booked")}</span>
                        </>
                    ) : (
                        <>
                            <span className="font-medium">{task.status}</span>
                        </>
                    )}
                </div>
                <Button size="sm" onClick={() => navigate(`/customer/tasks/${task.id}`)}>
                    {task.status === "OPEN" ? t("customerDashboard.manage", "Manage") : t("customerDashboard.viewDetails", "View details")}
                </Button>
            </CardFooter>
        </Card>
    );
}

export function CustomerDashboardPage() {
    const {apiClient, session} = useAppContext();
    const navigate = useNavigate();
    const {t} = useTranslation();

    const {
        data: tasksPage,
        isLoading,
        error
    } = useQuery({
        queryKey: ["customerTasks", session?.accessToken],
        queryFn: async () => {
            if (!session) throw new Error("Not authenticated");
            return apiClient.listMyTasks(session.accessToken);
        },
        enabled: !!session
    });

    return (
        <ScreenFrame>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t("customerDashboard.title", "My Tasks")}</h1>
                        <p className="text-muted-foreground mt-1">{t("customerDashboard.subtitle", "Manage the tasks you have posted.")}</p>
                    </div>
                    <Button onClick={() => navigate("/customer/tasks/new")} className="gap-2">
                        <Plus className="w-4 h-4"/>
                        <span className="hidden sm:inline">{t("customerDashboard.postNewTask", "Post new task")}</span>
                        <span className="sm:hidden">{t("customerDashboard.post", "Post")}</span>
                    </Button>
                </div>

                {error ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4"/>
                        <AlertTitle>{t("customerDashboard.errorTitle", "Error")}</AlertTitle>
                        <AlertDescription>
                            {error.message ?? t("customerDashboard.errorFailedLoad", "Failed to load tasks")}
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
                            <Plus className="h-6 w-6 text-primary"/>
                        </div>
                        <CardTitle
                            className="mb-2">{t("customerDashboard.noTasksTitle", "No tasks posted yet")}</CardTitle>
                        <CardDescription className="mb-6 max-w-sm">
                            {t("customerDashboard.noTasksDesc", "You haven't posted any tasks. Create your first task to find taskers to help you out.")}
                        </CardDescription>
                        <Button
                            onClick={() => navigate("/customer/tasks/new")}>{t("customerDashboard.postFirstTask", "Post your first task")}</Button>
                    </Card>
                ) : (
                    <Tabs defaultValue="open" className="w-full mt-4">
                        <TabsList className="mb-4">
                            <TabsTrigger value="open">{t("customerDashboard.tabOpen", "Open Requests")}</TabsTrigger>
                            <TabsTrigger
                                value="active">{t("customerDashboard.tabActive", "Active Bookings")}</TabsTrigger>
                            <TabsTrigger value="past">{t("customerDashboard.tabPast", "Past Submissions")}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="open" className="mt-0">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {tasksPage.data.filter(t => t.status === "OPEN").map((task) => (
                                    <TaskCard key={task.id} task={task}/>
                                ))}
                                {tasksPage.data.filter(t => t.status === "OPEN").length === 0 && (
                                    <div
                                        className="col-span-full py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                                        {t("customerDashboard.emptyOpen", "No open task requests.")}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="active" className="mt-0">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {tasksPage.data.filter(t => t.status === "ASSIGNED").map((task) => (
                                    <TaskCard key={task.id} task={task}/>
                                ))}
                                {tasksPage.data.filter(t => t.status === "ASSIGNED").length === 0 && (
                                    <div
                                        className="col-span-full py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                                        {t("customerDashboard.emptyActive", "No active bookings.")}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="past" className="mt-0">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {tasksPage.data.filter(t => t.status === "COMPLETED" || t.status === "CANCELLED").map((task) => (
                                    <TaskCard key={task.id} task={task}/>
                                ))}
                                {tasksPage.data.filter(t => t.status === "COMPLETED" || t.status === "CANCELLED").length === 0 && (
                                    <div
                                        className="col-span-full py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                                        {t("customerDashboard.emptyPast", "No past tasks.")}
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
