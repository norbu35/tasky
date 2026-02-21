import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { ScreenFrame } from "../layout/ScreenFrame";
import type { FallbackProps } from "react-error-boundary";

export function GlobalErrorFallback({error, resetErrorBoundary}: FallbackProps) {
    return (
        <ScreenFrame>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6">
                <div className="bg-destructive/10 p-4 rounded-full">
                    <AlertTriangle className="w-12 h-12 text-destructive"/>
                </div>

                <div className="space-y-2 max-w-md">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">Something went
                        wrong</h1>
                    <p className="text-muted-foreground">
                        An unexpected error has crashed this page. Our team has been notified.
                    </p>
                </div>

                <div
                    className="bg-muted/50 w-full max-w-xl p-4 rounded-lg font-mono text-sm text-left text-muted-foreground overflow-auto border shadow-inner">
                    <p className="font-semibold text-foreground mb-1">Error details:</p>
                    {error instanceof Error ? error.message : String(error)}
                </div>

                <div className="flex gap-4 pt-4">
                    <Button onClick={resetErrorBoundary} size="lg" className="gap-2">
                        <RefreshCcw className="w-4 h-4"/> Try again
                    </Button>
                    <Button variant="secondary" size="lg" onClick={() => window.location.href = "/"}>
                        Go home
                    </Button>
                </div>
            </div>
        </ScreenFrame>
    );
}
