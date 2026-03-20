import { MapPin, Clock } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { cn } from "../../lib/utils";

interface TaskCardProps {
    title: string;
    description?: string;
    budget: number;
    status: string;
    location?: string;
    scheduledAt?: string;
    categoryIcon?: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export function TaskCard({ title, description, budget, status, location, scheduledAt, categoryIcon, onClick, className }: TaskCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left bg-card rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
                "hover:border-primary/30 border border-transparent transition-colors",
                className
            )}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-subtle-violet flex items-center justify-center text-primary-deep">
                    {categoryIcon}
                </div>
                <StatusBadge status={status} />
            </div>
            <h3 className="text-lg font-bold font-display text-foreground leading-snug mb-1 line-clamp-2">{title}</h3>
            {description && <p className="text-sm text-muted-foreground line-clamp-2 mb-1">{description}</p>}
            <p className="text-2xl font-bold text-primary-deep">₮{budget.toLocaleString()}</p>
            <div className="flex gap-6 mt-4 pt-4 border-t border-border">
                {location && (
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <MapPin size={12} />
                        <span>{location}</span>
                    </div>
                )}
                {scheduledAt && (
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Clock size={12} />
                        <span>{scheduledAt}</span>
                    </div>
                )}
            </div>
        </button>
    );
}
