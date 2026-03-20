import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";

interface ErrorAlertProps {
    message: string;
    onRetry?: () => void;
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
            <AlertTriangle className="text-destructive shrink-0" size={20} />
            <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{message}</p>
            </div>
            {onRetry && (
                <Button variant="ghost" size="sm" onClick={onRetry}>Retry</Button>
            )}
        </div>
    );
}
