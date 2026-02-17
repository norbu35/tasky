import {NavLink} from "react-router-dom";
import {Button} from "../../components/ui/button";
import {useAppContext} from "../context/AppContext";

export function Header() {
  const { profile, signOut } = useAppContext();

  const linkClass = ({ isActive }: { isActive: boolean }): string =>
    [
      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
    ].join(" ");

  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Tasky Web MVP
        </p>
        <p className="text-sm text-foreground">{profile ? `${profile.full_name} (${profile.role})` : "Guest"}</p>
      </div>
      <nav className="flex flex-wrap items-center gap-2" aria-label="Primary navigation">
        <NavLink className={linkClass} to="/profile">
          Profile
        </NavLink>
        <NavLink className={linkClass} to="/customer/tasks/new">
          Customer
        </NavLink>
        <NavLink className={linkClass} to="/customer/booking-confirmation">
          Confirm
        </NavLink>
        <NavLink className={linkClass} to="/booking/safety">
          Safety
        </NavLink>
        <NavLink className={linkClass} to="/tasker/tasks">
          Tasker
        </NavLink>
        <NavLink className={linkClass} to="/communication">
          Inbox
        </NavLink>
        <Button variant="ghost" onClick={signOut}>
          Sign out
        </Button>
      </nav>
    </header>
  );
}
