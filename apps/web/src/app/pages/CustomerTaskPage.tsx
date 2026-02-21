import { useEffect, useState } from "react";
import type { Category, Task, TaskApplication } from "../../lib/apiClient";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useAppContext } from "../context/AppContext";
import { ScreenFrame } from "../layout/ScreenFrame";
import { parseError } from "../utils/errorHandling";
import { LocationPicker } from "../../components/TaskCreation/LocationPicker";
import { PhotoUploadManager } from "../../components/TaskCreation/PhotoUploadManager";
import { createTaskSchema } from "@tasky/core";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function CustomerTaskPage() {
    const {apiClient, session, setProfileError, trackClientEvent} = useAppContext();
    const {t, i18n} = useTranslation();

    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState("50000");
    const [locationText, setLocationText] = useState("");
    const [locationLat, setLocationLat] = useState(47.9184);
    const [locationLng, setLocationLng] = useState(106.9177);
    const [scheduledAt, setScheduledAt] = useState("");
    const [photoKeys, setPhotoKeys] = useState<string[]>([]);
    const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
    const [applicationsByTask, setApplicationsByTask] = useState<Record<string, TaskApplication[]>>({});
    const [working, setWorking] = useState(false);
    const [errorMap, setErrorMap] = useState<Record<string, string>>({});

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

        setWorking(true);
        setErrorMap({});

        try {
            const formData = {
                category_id: categoryId,
                description: description.trim(),
                budget: Number(budget),
                location_lat: locationLat,
                location_lng: locationLng,
                location_text: locationText.trim(),
                scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : "",
                photo_keys: photoKeys,
            };
            const validatedData = createTaskSchema.parse(formData);

            const created = await apiClient.createTask(session.accessToken, validatedData);
            setCreatedTasks((previous) => [created, ...previous]);
            trackClientEvent("TASK_POSTED", {taskId: created.id});
            toast.success(t("customerTask.successMessage", "Task created successfully."));

            // Optional: reset form after creation
            setDescription("");
            setBudget("50000");
            setLocationText("");
            setScheduledAt("");
            setPhotoKeys([]);
            setCategoryId(categories[0]?.id || "");
        } catch (error: unknown) {
            const err = error as Error & { name?: string; errors?: { path: (string | number)[]; message: string }[] };
            if (err.name === "ZodError" && err.errors) {
                const map: Record<string, string> = {};
                err.errors.forEach((e) => {
                    if (e.path[0]) map[e.path[0].toString()] = e.message;
                });
                setErrorMap(map);
            } else {
                toast.error(parseError(error));
            }
        } finally {
            setWorking(false);
        }
    };

    const loadApplications = async (taskId: string): Promise<void> => {
        if (!session) {
            return;
        }

        setWorking(true);
        try {
            const response = await apiClient.listTaskApplications(session.accessToken, taskId);
            setApplicationsByTask((previous) => ({...previous, [taskId]: response.data}));
            toast.success(t("customerTask.loadedCount", "Loaded {{count}} application(s).", {count: response.data.length}));
        } catch (error) {
            toast.error(parseError(error));
        } finally {
            setWorking(false);
        }
    };

    return (
        <ScreenFrame>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
                <Card className="border-border/70 shadow-xl shadow-foreground/5">
                    <CardHeader>
                        <CardTitle>{t("customerTask.createTaskTitle", "Create task")}</CardTitle>
                        <CardDescription>
                            {t("customerTask.createTaskDesc", "Customer can create a task with category, location, schedule, and budget.")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="task-category">{t("customerTask.categoryLabel", "Category")}</Label>
                            <select
                                id="task-category"
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                value={categoryId}
                                onChange={(event) => setCategoryId(event.target.value)}
                            >
                                <option value="">{t("customerTask.selectCategory", "Select category")}</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {i18n.language === "mn" ? category.name_mn : category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {Object.keys(errorMap).length > 0 && (
                            <div data-testid="error-map-dump" className="text-red-500 font-mono text-xs mt-2">
                                {JSON.stringify(errorMap)}
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label
                                htmlFor="task-description">{t("customerTask.taskDetailsLabel", "Task details")}</Label>
                            <Textarea
                                id="task-description"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder={t("customerTask.taskDetailsPlaceholder", "1-bedroom apartment deep cleaning")}
                            />
                            {errorMap.description && <p className="text-xs text-destructive">{errorMap.description}</p>}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="task-budget">{t("customerTask.budgetLabel", "Budget (MNT)")}</Label>
                                <Input
                                    id="task-budget"
                                    inputMode="numeric"
                                    value={budget}
                                    onChange={(event) => setBudget(event.target.value)}
                                />
                                {errorMap.budget && <p className="text-xs text-destructive">{errorMap.budget}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="task-scheduled-at">{t("customerTask.scheduledAtLabel", "Scheduled at")}</Label>
                                <Input
                                    id="task-scheduled-at"
                                    type="datetime-local"
                                    value={scheduledAt}
                                    onChange={(event) => setScheduledAt(event.target.value)}
                                />
                                {errorMap.scheduled_at &&
                                    <p className="text-xs text-destructive">{errorMap.scheduled_at}</p>}
                            </div>
                        </div>

                        <PhotoUploadManager
                            photoKeys={photoKeys}
                            onPhotoKeysChange={setPhotoKeys}
                        />

                        <div className="grid gap-2">
                            <Label
                                htmlFor="task-location-text">{t("customerTask.addressDescLabel", "Address description")}</Label>
                            <Input
                                id="task-location-text"
                                value={locationText}
                                onChange={(event) => setLocationText(event.target.value)}
                                placeholder={t("customerTask.addressDescPlaceholder", "ХУД, 15-р хороо, Олимп хотхон")}
                            />
                            {errorMap.location_text &&
                                <p className="text-xs text-destructive">{errorMap.location_text}</p>}
                        </div>

                        <LocationPicker
                            lat={locationLat}
                            lng={locationLng}
                            onChange={(lat, lng) => {
                                setLocationLat(lat);
                                setLocationLng(lng);
                            }}
                        />
                        {errorMap.location_lat &&
                            <p className="text-xs text-destructive">{t("customerTask.locationRequired", "Location is required")}</p>}
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button
                            disabled={working}
                            onClick={createTask}
                        >
                            {t("customerTask.createTaskButton", "Create task")}
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("customerTask.myCreatedTasksTitle", "My created tasks")}</CardTitle>
                        <CardDescription>{t("customerTask.myCreatedTasksDesc", "Load applications to validate customer-side applicant visibility.")}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {createdTasks.length === 0 ?
                            <p className="text-sm text-muted-foreground">{t("customerTask.noTasksCreated", "No tasks created yet.")}</p> : null}
                        {createdTasks.map((task) => (
                            <article className="rounded-md border border-border p-3" key={task.id}>
                                <p className="text-sm font-medium">{task.description}</p>
                                <p className="text-xs text-muted-foreground">{t("customerTask.taskId", "Task ID: ")}{task.id}</p>
                                <p className="text-xs text-muted-foreground">{t("customerTask.status", "Status: ")}{task.status}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        disabled={working}
                                        onClick={() => {
                                            void loadApplications(task.id);
                                        }}
                                    >
                                        {t("customerTask.loadApplicationsButton", "Load applications")}
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                        {t("customerTask.applicationsCount", "Applications: ")}{applicationsByTask[task.id]?.length ?? 0}
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
