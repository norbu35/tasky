import { useCallback, useEffect, useState } from "react";
import type { Category } from "../../lib/apiClient";
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

export function TaskerFeedPage() {
  const { apiClient, session, setProfileError, trackClientEvent } = useAppContext();

  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<{
    categoryId: string;
    lat: string;
    lng: string;
    radiusKm: string;
  }>({
    categoryId: "",
    lat: "47.9184",
    lng: "106.9177",
    radiusKm: "10"
  });
  const [taskCards, setTaskCards] = useState<Array<{ id: string; approximate_location: string; budget: number; description: string }>>(
    []
  );
  const [applyDrafts, setApplyDrafts] = useState<Record<string, string>>({});
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadCategories = useCallback(async (): Promise<void> => {
    if (!session) {
      return;
    }
    try {
      const response = await apiClient.listCategories(session.accessToken);
      setCategories(response.data);
      if (response.data.length > 0) {
        setFilters((previous) => ({
          ...previous,
          categoryId: previous.categoryId || response.data[0].id
        }));
      }
    } catch (error) {
      setProfileError(parseError(error));
    }
  }, [apiClient, session, setProfileError]);

  const loadTaskFeed = useCallback(async (): Promise<void> => {
    if (!session) {
      return;
    }

    setWorking(true);
    setMessage(null);
    try {
      const response = await apiClient.listTasks(session.accessToken, {
        categoryId: filters.categoryId || undefined,
        lat: Number(filters.lat),
        lng: Number(filters.lng),
        radiusKm: Number(filters.radiusKm)
      });
      // Intentionally project only privacy-safe fields for feed display.
      setTaskCards(
        response.data.map((task) => ({
          id: task.id,
          approximate_location: task.approximate_location,
          budget: task.budget,
          description: task.description
        }))
      );
      setMessage(`Loaded ${response.data.length} open task(s).`);
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  }, [apiClient, filters.categoryId, filters.lat, filters.lng, filters.radiusKm, session]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadTaskFeed();
  }, [loadTaskFeed]);

  const applyToTask = async (taskId: string): Promise<void> => {
    if (!session) {
      return;
    }

    const draft = (applyDrafts[taskId] ?? "").trim();
    if (draft.length < 10) {
      setMessage("Application message must be at least 10 characters.");
      return;
    }

    setWorking(true);
    setMessage(null);
    try {
      await apiClient.applyToTask(session.accessToken, taskId, draft);
      setApplyDrafts((previous) => ({ ...previous, [taskId]: "" }));
      trackClientEvent("APPLICATION_SUBMITTED", { taskId });
      setMessage("Application sent.");
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
          <CardTitle>Open task feed</CardTitle>
          <CardDescription>
            Feed uses privacy-safe approximate locations and lets verified taskers apply.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="feed-category">Category</Label>
              <select
                id="feed-category"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={filters.categoryId}
                onChange={(event) => {
                  setFilters((previous) => ({ ...previous, categoryId: event.target.value }));
                }}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feed-lat">Latitude</Label>
              <Input
                id="feed-lat"
                value={filters.lat}
                onChange={(event) => {
                  setFilters((previous) => ({ ...previous, lat: event.target.value }));
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feed-lng">Longitude</Label>
              <Input
                id="feed-lng"
                value={filters.lng}
                onChange={(event) => {
                  setFilters((previous) => ({ ...previous, lng: event.target.value }));
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feed-radius">Radius (km)</Label>
              <Input
                id="feed-radius"
                value={filters.radiusKm}
                onChange={(event) => {
                  setFilters((previous) => ({ ...previous, radiusKm: event.target.value }));
                }}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={working} onClick={() => void loadTaskFeed()} variant="secondary">
              Refresh feed
            </Button>
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <div className="grid gap-3">
            {taskCards.length === 0 ? <p className="text-sm text-muted-foreground">No open tasks found.</p> : null}
            {taskCards.map((task) => (
              <article className="rounded-md border border-border p-4" key={task.id}>
                <p className="text-sm font-medium">{task.description}</p>
                <p className="text-sm">Budget: {task.budget.toLocaleString("en-US")} MNT</p>
                <p className="text-sm text-muted-foreground">Approximate location: {task.approximate_location}</p>
                <div className="mt-3 grid gap-2">
                  <Label htmlFor={`apply-${task.id}`}>Application message</Label>
                  <Textarea
                    id={`apply-${task.id}`}
                    value={applyDrafts[task.id] ?? ""}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setApplyDrafts((previous) => ({ ...previous, [task.id]: nextValue }));
                    }}
                    placeholder="I can complete this task by your requested time."
                  />
                  <div className="flex justify-end">
                    <Button
                      disabled={working}
                      onClick={() => {
                        void applyToTask(task.id);
                      }}
                      size="sm"
                    >
                      Apply to task
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </ScreenFrame>
  );
}
