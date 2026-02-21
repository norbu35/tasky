import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({className, type, ...props}, ref) => (
        <input
            type={type}
            className={cn(
                "flex h-12 w-full rounded-xl border border-input/50 bg-background/50 px-4 py-2 text-sm ring-offset-background transition-all hover:bg-background/80 hover:border-border",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:bg-background",
                "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            ref={ref}
            {...props}
        />
    )
);
Input.displayName = "Input";

export { Input };
