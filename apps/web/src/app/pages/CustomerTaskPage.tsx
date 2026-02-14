import {useEffect, useState} from "react";
import type {Category, Task, TaskApplication} from "../../lib/apiClient";
import {Button} from "../../components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "../../components/ui/card";
import {Input} from "../../components/ui/input";
import {Label} from "../../components/ui/label";
import {Textarea} from "../../components/ui/textarea";
import {useAppContext} from "../context/AppContext";
import {ScreenFrame} from "../layout/ScreenFrame";
import {parseError} from "../utils/errorHandling";

export function CustomerTaskPage() {
  const { apiClient, session, setProfileError, trackClientEvent } = useAppContext();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("50000");
  const [locationText, setLocationText] = useState("");
  const [locationLat, setLocationLat] = useState("47.9184");
  const [locationLng, setLocationLng] = useState("106.9177");
  const [scheduledAt, setScheduledAt] = useState("");
  const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
  const [applicationsByTask, setApplicationsByTask] = useState<Record<string, TaskApplication[]>>({});
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async (): Promise<void> => {
      if (!session) {
        return;
      }
      try {
        const response = await apiClient.listCategories(session.accessToken);
        setCategories(response.data);
        if (response.data.length > 0) {
          setCategoryId((previous) => previous || response.data[0].id);
        }
      } catch (error) {
        setProfileError(parseError(error));
      }
    };

    void loadCategories();
  }, [apiClient, session, setProfileError]);

  const createTask = async (): Promise<void> => {
    if (!session) {
      return;
    }

    if (!scheduledAt) {
      setMessage("Please choose a future schedule.");
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      setMessage("Invalid schedule format.");
      return;
    }

    setWorking(true);
    setMessage(null);
    try {
      const created = await apiClient.createTask(session.accessToken, {
        category_id: categoryId,
        description: description.trim(),
        budget: Number(budget),
        location_lat: Number(locationLat),
        location_lng: Number(locationLng),
        location_text: locationText.trim(),
        scheduled_at: scheduledDate.toISOString()
      });
      setCreatedTasks((previous) => [created, ...previous]);
      trackClientEvent("TASK_POSTED", { taskId: created.id });
      setMessage("Task created.");
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const loadApplications = async (taskId: string): Promise<void> => {
    if (!session) {
      return;
    }

    setWorking(true);
    setMessage(null);
    try {
      const response = await apiClient.listTaskApplications(session.accessToken, taskId);
      setApplicationsByTask((previous) => ({ ...previous, [taskId]: response.data }));
      setMessage(`Loaded ${response.data.length} application(s).`);
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScreenFrame>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        <Card className="border-border/70 shadow-xl shadow-foreground/5">
          <CardHeader>
            <CardTitle>Create task</CardTitle>
            <CardDescription>
              Customer can create a task with category, location, schedule, and budget.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="task-category">Category</Label>
              <select
                id="task-category"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-description">Task details</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="1-bedroom apartment deep cleaning"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="task-budget">Budget (MNT)</Label>
                <Input
                  id="task-budget"
                  inputMode="numeric"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-scheduled-at">Scheduled at</Label>
                <Input
                  id="task-scheduled-at"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-location-text">Address description</Label>
              <Input
                id="task-location-text"
                value={locationText}
                onChange={(event) => setLocationText(event.target.value)}
                placeholder="ХУД, 15-р хороо, Олимп хотхон"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="task-location-lat">Latitude</Label>
                <Input
                  id="task-location-lat"
                  inputMode="decimal"
                  value={locationLat}
                  onChange={(event) => setLocationLat(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-location-lng">Longitude</Label>
                <Input
                  id="task-location-lng"
                  inputMode="decimal"
                  value={locationLng}
                  onChange={(event) => setLocationLng(event.target.value)}
                />
              </div>
            </div>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              disabled={
                working ||
                !categoryId ||
                description.trim().length < 10 ||
                locationText.trim().length < 5 ||
                !scheduledAt
              }
              onClick={createTask}
            >
              Create task
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My created tasks</CardTitle>
            <CardDescription>Load applications to validate customer-side applicant visibility.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {createdTasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks created yet.</p> : null}
            {createdTasks.map((task) => (
              <article className="rounded-md border border-border p-3" key={task.id}>
                <p className="text-sm font-medium">{task.description}</p>
                <p className="text-xs text-muted-foreground">Task ID: {task.id}</p>
                <p className="text-xs text-muted-foreground">Status: {task.status}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={working}
                    onClick={() => {
                      void loadApplications(task.id);
                    }}
                  >
                    Load applications
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Applications: {applicationsByTask[task.id]?.length ?? 0}
                  </span>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScreenFrame>
  );
}
