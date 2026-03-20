import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { Task } from "../../lib/apiClient";
import { useAppContext } from "../context/AppContext";
import { ScreenFrame } from "../layout/ScreenFrame";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";
import { AlertCircle, MapPin, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useTranslation } from "react-i18next";

function TaskCard({ task }: { task: Task }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card
      className="flex flex-row items-center gap-3 p-4 hover:border-primary/40 transition-colors cursor-pointer"
      onClick={() => navigate(`/customer/tasks/${task.id}`)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge variant={task.status === "OPEN" ? "default" : "secondary"} className="text-xs">
            {task.status}
          </Badge>
        </div>
        <p className="text-sm font-semibold truncate">{task.description}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{task.location_text}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-bold">₮{task.budget.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">{new Date(task.scheduled_at).toLocaleDateString()}</div>
      </div>
    </Card>
  );
}

export function CustomerDashboardPage() {
    const {apiClient, session, profile} = useAppContext();
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

                {/* Greeting header */}
                <div className="space-y-1 mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                  <h1 className="text-2xl font-display font-bold">
                    {t("customerDashboard.greeting", "Sain baina uu")},{" "}
                    <span className="text-primary">
                      {profile?.full_name?.split(" ")[0] ?? t("customerDashboard.friend", "there")}
                    </span>
                    {"!"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isLoading
                      ? t("customerDashboard.loadingTasks", "Loading your tasks...")
                      : t("customerDashboard.activeTasksToday", {
                          count: tasksPage?.data?.filter((t) => t.status === "ASSIGNED" || t.status === "OPEN").length ?? 0,
                          defaultValue: "You have {{count}} active task(s) today.",
                        })}
                  </p>
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
                    <div className="grid gap-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Card key={i} className="flex flex-row items-center gap-3 p-4">
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                            <div className="space-y-1 text-right">
                              <Skeleton className="h-4 w-16 ml-auto" />
                              <Skeleton className="h-3 w-12 ml-auto" />
                            </div>
                          </Card>
                        ))}
                    </div>
                ) : !tasksPage?.data || tasksPage.data.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-semibold mb-1">{t("customerDashboard.noTasksTitle", "No tasks posted yet")}</p>
                      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                        {t("customerDashboard.noTasksDesc", "You haven't posted any tasks. Create your first task to find taskers to help you out.")}
                      </p>
                      <Button onClick={() => navigate("/customer/tasks/new")}>
                        {t("customerDashboard.postFirstTask", "Post your first task")}
                      </Button>
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
                            <div className="grid gap-3">
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
                            <div className="grid gap-3">
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
                            <div className="grid gap-3">
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
