import { useState } from "react";
import type { Category, PublicTask } from "../../lib/apiClient";
import { useCategoriesQuery, useTasksQuery } from "@tasky/core";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useAppContext } from "../context/AppContext";
import { ScreenFrame } from "../layout/ScreenFrame";
import { parseError } from "../utils/errorHandling";
import { Coins, Loader2, MapPin, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

export function TaskerFeedPage() {
    const {apiClient, session, trackClientEvent} = useAppContext();
    const {t, i18n} = useTranslation();

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

    const [applyDrafts, setApplyDrafts] = useState<Record<string, string>>({});
    const [working, setWorking] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    const {data: categoriesPage, isLoading: loadingCategories} = useCategoriesQuery(apiClient, session?.accessToken);
    const categories = categoriesPage?.data || [];

    const {data: tasksPage, isLoading: loadingTasks, refetch: refetchTasks, error: tasksError} = useTasksQuery(
        apiClient,
        session?.accessToken,
        {
            categoryId: filters.categoryId || undefined,
            lat: Number(filters.lat),
            lng: Number(filters.lng),
            radiusKm: Number(filters.radiusKm)
        }
    );
    const taskCards = tasksPage?.data || [];

    const applyToTask = async (taskId: string): Promise<void> => {
        if (!session) return;

        const draft = (applyDrafts[taskId] ?? "").trim();
        if (draft.length < 10) {
            setActionMessage(t("taskerFeed.msgMinLength", "Application message must be at least 10 characters."));
            return;
        }

        setWorking(true);
        setActionMessage(null);
        try {
            await apiClient.applyToTask(session.accessToken, taskId, draft);
            setApplyDrafts((prev) => ({...prev, [taskId]: ""}));
            trackClientEvent("APPLICATION_SUBMITTED", {taskId});
            setActionMessage(t("taskerFeed.msgSent", "Application sent."));
            void refetchTasks();
        } catch (error) {
            setActionMessage(parseError(error));
        } finally {
            setWorking(false);
        }
    };

    return (
        <ScreenFrame>
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Page header */}
                <div className="mb-4">
                  <h1 className="text-2xl font-display font-bold tracking-tight">
                    {t("taskerFeed.title", "Available Tasks")}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("taskerFeed.subtitle", "Find nearby opportunities in Ulaanbaatar based on your skills.")}
                  </p>
                </div>

                {/* Category filter chips */}
                <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, categoryId: "" }))}
                    className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors ${
                      !filters.categoryId
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {t("taskerFeed.allCategories", "All")}
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, categoryId: c.id }))}
                      className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors ${
                        filters.categoryId === c.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {i18n.language === "mn" ? c.name_mn : c.name}
                    </button>
                  ))}
                </div>

                {tasksError &&
                    <p className="text-sm text-destructive font-medium p-4 bg-destructive/10 rounded-xl">{parseError(tasksError)}</p>}
                {actionMessage &&
                    <p className="text-sm text-primary font-medium p-4 bg-primary/10 rounded-xl">{actionMessage}</p>}

                <div className="grid gap-6">
                    {loadingTasks && (
                        <div className="flex py-12 items-center justify-center text-muted-foreground flex-col gap-4">
                            <Loader2 className="w-8 h-8 animate-spin"/>
                            <p className="text-sm font-medium">{t("taskerFeed.scanningMsg", "Scanning for available tasks...")}</p>
                        </div>
                    )}

                    {!loadingTasks && taskCards.length === 0 && !tasksError && (
                        <div
                            className="flex py-12 items-center justify-center text-muted-foreground flex-col gap-4 bg-muted/20 rounded-xl border border-dashed border-border">
                            <Search className="w-10 h-10 opacity-20"/>
                            <p className="text-sm font-medium opacity-60">{t("taskerFeed.noTasksFound", "No open tasks found in this area.")}</p>
                        </div>
                    )}

                    {!loadingTasks && taskCards.map((task: PublicTask) => (
                        <Card key={task.id}
                              className="overflow-hidden shadow-md hover:shadow-lg transition-all group border-border">
                            <CardHeader className="bg-muted/10 pb-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="hover:bg-secondary">
                                                {task.category?.name || t("taskerFeed.categoryFallback", "Task")}
                                            </Badge>
                                            <Badge variant="outline" className="text-muted-foreground">
                                                {t("taskerFeed.statusOpen", "Open")}
                                            </Badge>
                                        </div>
                                        <CardTitle
                                            className="text-xl leading-snug font-medium mt-2">{task.description}</CardTitle>
                                    </div>
                                    <div className="text-right whitespace-nowrap">
                                        <div className="text-2xl font-display font-bold text-foreground">
                                            {task.budget.toLocaleString("en-US")} <span
                                            className="text-sm font-normal text-muted-foreground">MNT</span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent
                                className="pt-4 pb-4 border-t border-border/40 grid md:grid-cols-2 gap-4 text-sm bg-card">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="w-4 h-4 shrink-0 text-primary/70"/>
                                    <span>{t("taskerFeed.approxLocation", "Approximate location: ")}<strong
                                        className="text-foreground">{task.approximate_location}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Coins className="w-4 h-4 shrink-0 text-primary/70"/>
                                    <span>{t("taskerFeed.payStructure", "Pay structure: ")}<strong
                                        className="text-foreground">{t("taskerFeed.fixedPrice", "Fixed price")}</strong></span>
                                </div>
                            </CardContent>
                            <CardFooter
                                className="bg-muted/10 border-t border-border/40 p-4 pt-4 flex flex-col items-stretch gap-3">
                                <Label htmlFor={`apply-${task.id}`}
                                       className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                                    {t("taskerFeed.appMessageLabel", "Application message")}
                                </Label>
                                <Textarea
                                    id={`apply-${task.id}`}
                                    className="resize-none min-h-[80px] rounded-xl bg-background border-border/60 focus:bg-background transition-colors"
                                    value={applyDrafts[task.id] ?? ""}
                                    onChange={(e) => setApplyDrafts(prev => ({...prev, [task.id]: e.target.value}))}
                                    placeholder={t("taskerFeed.appMessagePlaceholder", "Explain why you are the best fit for this task...")}
                                />
                                <div className="flex justify-end mt-1">
                                    <Button
                                        disabled={working || (applyDrafts[task.id] ?? "").trim().length < 10}
                                        onClick={() => void applyToTask(task.id)}
                                        className="rounded-xl shadow-lg hover:translate-y-[-1px] transition-all font-semibold"
                                    >
                                        {working ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                                        {t("taskerFeed.applyButton", "Apply to task")}
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </ScreenFrame>
    );
}
