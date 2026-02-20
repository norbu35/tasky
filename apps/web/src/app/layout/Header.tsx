import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAppContext } from "../context/AppContext";

export function Header() {
    const { profile, signOut } = useAppContext();
    const { t } = useTranslation();

    const linkClass = ({ isActive }: { isActive: boolean }): string =>
        [
            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
        ].join(" ");

    return (
        <header
            className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
            <div>
                <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Tasky Web MVP
                    </p>
                    <LanguageSwitcher />
                </div>
                <p className="text-sm text-foreground">{profile ? `${profile.full_name} (${profile.role})` : "Guest"}</p>
            </div>
            <nav className="flex flex-wrap items-center gap-2" aria-label="Primary navigation">
                <NavLink className={linkClass} to="/profile">
                    {t("nav.profile", "Profile")}
                </NavLink>
                <NavLink className={linkClass} to="/customer/tasks/new">
                    {t("nav.createTask", "Customer")}
                </NavLink>
                <NavLink className={linkClass} to="/customer/booking-confirmation">
                    {t("nav.confirmBooking", "Confirm")}
                </NavLink>
                <NavLink className={linkClass} to="/booking/safety">
                    {t("nav.safety", "Safety")}
                </NavLink>
                <NavLink className={linkClass} to="/tasker/tasks">
                    {t("nav.taskerFeed", "Tasker Feed")}
                </NavLink>
                <NavLink className={linkClass} to="/tasker/my-tasks">
                    {t("nav.taskerTasks", "My Bookings")}
                </NavLink>
                <NavLink className={linkClass} to="/communication">
                    {t("nav.inbox", "Inbox")}
                </NavLink>
                <Button variant="ghost" onClick={signOut}>
                    {t("nav.logout", "Sign out")}
                </Button>
            </nav>
        </header>
    );
}
