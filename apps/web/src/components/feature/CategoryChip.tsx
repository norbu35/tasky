import { cn } from "../../lib/utils";

interface CategoryChipProps {
    label: string;
    isActive?: boolean;
    onClick?: () => void;
}

export function CategoryChip({ label, isActive = false, onClick }: CategoryChipProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
                isActive
                    ? "bg-primary text-primary-foreground shadow-[0_10px_15px_-3px_rgba(83,0,183,0.2)]"
                    : "bg-chip-inactive text-muted-foreground hover:bg-muted"
            )}
        >
            {label}
        </button>
    );
}
