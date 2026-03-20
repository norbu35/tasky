import { CheckCircle, Shield } from "lucide-react";
import { cn } from "../../lib/utils";

interface VerificationBadgeProps {
    type: "verified" | "pro";
    size?: "sm" | "md";
    className?: string;
}

export function VerificationBadge({ type, size = "sm", className }: VerificationBadgeProps) {
    const dim = size === "sm" ? "w-5 h-5" : "w-6 h-6";
    const iconSize = size === "sm" ? 12 : 14;

    if (type === "verified") {
        return (
            <span className={cn("inline-flex items-center justify-center rounded-full bg-verified text-white", dim, className)}>
                <CheckCircle size={iconSize} />
            </span>
        );
    }

    return (
        <span className={cn("inline-flex items-center justify-center rounded-full bg-trust text-trust-muted", dim, className)}>
            <Shield size={iconSize} />
        </span>
    );
}
