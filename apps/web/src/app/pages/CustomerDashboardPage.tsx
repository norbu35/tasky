import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { Task } from "../../lib/apiClient";
import { useAppContext } from "../context/AppContext";
import { ScreenFrame } from "../layout/ScreenFrame";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";
import { Plus, Users, Calendar, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

function TaskCard({ task }: { task: Task }) {
  const navigate = useNavigate();

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
          <Calendar className="w-3 h-3" />
          {new Date(task.scheduled_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-3 text-sm flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
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
              <Users className="w-4 h-4" />
              <span>Review applicants</span>
            </>
          ) : task.status === "ASSIGNED" ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium">Booked</span>
            </>
          ) : (
            <>
              <span className="font-medium">{task.status}</span>
            </>
          )}
        </div>
        <Button size="sm" onClick={() => navigate(`/customer/tasks/${task.id}`)}>
          {task.status === "OPEN" ? "Manage" : "View details"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function CustomerDashboardPage() {
  const { apiClient, session } = useAppContext();
  const navigate = useNavigate();

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
            <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage the tasks you have posted.</p>
          </div>
          <Button onClick={() => navigate("/customer/tasks/new")} className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Post new task</span>
            <span className="sm:hidden">Post</span>
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to load tasks"}
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent className="flex-1">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
                <CardFooter className="pt-4 border-t">
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : !tasksPage?.data || tasksPage.data.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">No tasks posted yet</CardTitle>
            <CardDescription className="mb-6 max-w-sm">
              You haven't posted any tasks. Create your first task to find taskers to help you out.
            </CardDescription>
            <Button onClick={() => navigate("/customer/tasks/new")}>Post your first task</Button>
          </Card>
        ) : (
          <Tabs defaultValue="open" className="w-full mt-4">
            <TabsList className="mb-4">
              <TabsTrigger value="open">Open Requests</TabsTrigger>
              <TabsTrigger value="active">Active Bookings</TabsTrigger>
              <TabsTrigger value="past">Past Submissions</TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="mt-0">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tasksPage.data.filter(t => t.status === "OPEN").map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {tasksPage.data.filter(t => t.status === "OPEN").length === 0 && (
                  <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                    No open task requests.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="active" className="mt-0">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tasksPage.data.filter(t => t.status === "ASSIGNED").map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {tasksPage.data.filter(t => t.status === "ASSIGNED").length === 0 && (
                  <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                    No active bookings.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="past" className="mt-0">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tasksPage.data.filter(t => t.status === "COMPLETED" || t.status === "CANCELLED").map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {tasksPage.data.filter(t => t.status === "COMPLETED" || t.status === "CANCELLED").length === 0 && (
                  <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                    No past tasks.
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
