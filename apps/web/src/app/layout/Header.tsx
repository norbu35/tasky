import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAppContext } from "../context/AppContext";

export function Header() {
    const {profile, signOut} = useAppContext();
    const {t} = useTranslation();

    const linkClass = ({isActive}: { isActive: boolean }): string =>
        [
            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
        ].join(" ");

    return (
        <header
            className="fixed left-0 right-0 top-0 z-50 w-full border-b border-border/40 bg-background/75 px-4 py-3 shadow-sm backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mr-1">
                        Tasky Web MVP
                    </p>
                    <LanguageSwitcher/>
                </div>
                <div className="hidden text-sm font-medium text-foreground sm:block">
                    {profile ? `${profile.full_name} (${profile.role})` : "Guest"}
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
                    <Button variant="ghost" size="sm" className="ml-2 font-medium" onClick={signOut}>
                        {t("nav.logout", "Sign out")}
                    </Button>
                </nav>
            </div>
        </header>
    );
}
