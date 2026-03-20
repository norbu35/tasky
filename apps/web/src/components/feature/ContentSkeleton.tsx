import { cn } from "../../lib/utils";

interface ContentSkeletonProps {
    variant?: "card" | "list-item" | "profile";
    className?: string;
}

export function ContentSkeleton({ variant = "card", className }: ContentSkeletonProps) {
    if (variant === "profile") {
        return (
            <div className={cn("animate-pulse space-y-4", className)}>
                <div className="mx-auto w-32 h-32 rounded-full bg-muted" />
                <div className="mx-auto w-40 h-6 rounded bg-muted" />
                <div className="mx-auto w-24 h-4 rounded bg-muted" />
                <div className="flex gap-3 justify-center">
                    <div className="w-24 h-20 rounded-xl bg-muted" />
                    <div className="w-24 h-20 rounded-xl bg-muted" />
                    <div className="w-24 h-20 rounded-xl bg-muted" />
                </div>
            </div>
        );
    }

    if (variant === "list-item") {
        return (
            <div className={cn("animate-pulse flex items-center gap-4 p-4 rounded-xl bg-card", className)}>
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                    <div className="w-3/4 h-4 rounded bg-muted" />
                    <div className="w-1/2 h-3 rounded bg-muted" />
                </div>
            </div>
        );
    }

    return (
        <div className={cn("animate-pulse rounded-xl bg-card p-5 space-y-4", className)}>
            <div className="flex justify-between">
                <div className="w-12 h-12 rounded-xl bg-muted" />
                <div className="w-16 h-6 rounded-full bg-muted" />
            </div>
            <div className="w-3/4 h-5 rounded bg-muted" />
            <div className="w-1/3 h-6 rounded bg-muted" />
            <div className="flex gap-4 pt-4 border-t border-border">
                <div className="w-1/3 h-4 rounded bg-muted" />
                <div className="w-1/3 h-4 rounded bg-muted" />
            </div>
        </div>
    );
}
