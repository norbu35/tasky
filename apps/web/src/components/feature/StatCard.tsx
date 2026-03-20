export function StatCard({ value, label }: { value: string; label: string }) {
    return (
        <div className="flex-1 bg-muted rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
        </div>
    );
}
