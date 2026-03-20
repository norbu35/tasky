import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAppContext } from "../context/AppContext";

const TASKER_LINKS = [
    { to: "/tasker/tasks", label: "nav.findWork", fallback: "Find Work" },
    { to: "/tasker/my-tasks", label: "nav.myJobs", fallback: "My Jobs" },
    { to: "/communication", label: "nav.inbox", fallback: "Inbox" },
];

const CUSTOMER_LINKS = [
    { to: "/customer/dashboard", label: "nav.dashboard", fallback: "Dashboard" },
    { to: "/customer/tasks", label: "nav.tasks", fallback: "Tasks" },
    { to: "/communication", label: "nav.inbox", fallback: "Inbox" },
];

const COMMON_LINKS = [
    { to: "/profile", label: "nav.profile", fallback: "Profile" },
];

export function Header() {
    const { profile, signOut } = useAppContext();
    const { t } = useTranslation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [devRole, setDevRole] = useState<string | null>(null);

    const effectiveRole = devRole ?? profile?.role;
    const roleLinks = effectiveRole === "TASKER" ? TASKER_LINKS
        : effectiveRole === "CUSTOMER" ? CUSTOMER_LINKS
        : [];
    const allLinks = [...roleLinks, ...COMMON_LINKS];

    const linkClass = ({ isActive }: { isActive: boolean }): string =>
        [
            "rounded-xl px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors whitespace-nowrap",
            isActive
                ? "bg-primary text-primary-foreground"
                : "text-nav-inactive hover:bg-muted"
        ].join(" ");

    return (
        <>
            <header className="fixed left-0 right-0 top-0 z-50 w-full border-b border-border/40 bg-background/75 backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 h-16">
                    <div className="flex items-center gap-4">
                        <span className="text-xl font-extrabold font-display text-primary-deep tracking-tight">
                            Tasky
                        </span>
                        <LanguageSwitcher />
                    </div>

                    <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
                        {allLinks.map(link => (
                            <NavLink key={link.to} className={linkClass} to={link.to}>
                                {t(link.label, link.fallback)}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        {profile && (
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                                    {profile.full_name?.charAt(0) ?? "?"}
                                </div>
                            </div>
                        )}
                        <Button variant="ghost" size="sm" className="text-xs font-semibold" onClick={signOut}>
                            {t("nav.logout", "Sign out")}
                        </Button>
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-muted"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {mobileOpen && (
                    <nav className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-md px-6 py-3 flex flex-col gap-1" aria-label="Mobile navigation">
                        {allLinks.map(link => (
                            <NavLink
                                key={link.to}
                                className={linkClass}
                                to={link.to}
                                onClick={() => setMobileOpen(false)}
                            >
                                {t(link.label, link.fallback)}
                            </NavLink>
                        ))}
                    </nav>
                )}
            </header>

            {import.meta.env.DEV && (
                <button
                    className="fixed bottom-4 right-4 z-50 bg-foreground/10 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-foreground/20 transition-colors"
                    onClick={() => setDevRole(prev =>
                        prev === "TASKER" ? "CUSTOMER" : prev === "CUSTOMER" ? null : "TASKER"
                    )}
                >
                    {devRole ? `Dev: ${devRole}` : "Dev: auto"}
                </button>
            )}
        </>
    );
}
