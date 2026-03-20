import type { ReactNode } from "react";

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold font-display text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
            {action}
        </div>
    );
}
