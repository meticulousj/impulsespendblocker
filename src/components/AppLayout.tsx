import { NavLink, Outlet } from "react-router-dom";
import { Home, History, Target, Sparkles, User2 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/history", label: "History", icon: History },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/profile", label: "Profile", icon: User2 },
];

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-32">
        <Outlet />
      </main>
      <nav
        aria-label="Primary"
        className="fixed bottom-4 inset-x-0 z-40 px-4"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-between gap-1 rounded-3xl border border-border/70 bg-card/80 p-1.5 shadow-lift backdrop-blur-xl">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold tracking-tight transition-all duration-200 active:scale-[0.96]",
                    isActive
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] transition-transform duration-200",
                        isActive ? "scale-110" : "",
                      )}
                      strokeWidth={isActive ? 2.4 : 1.9}
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}