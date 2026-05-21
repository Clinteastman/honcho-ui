import {
  LayoutDashboard,
  Folder,
  Users,
  MessagesSquare,
  MessageCircle,
  Lightbulb,
  Search,
  Webhook,
  Key,
  Settings,
  Terminal,
  HelpCircle,
} from "lucide-react";
import { Link, useLocation } from "@/lib/router";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  /** Show a "EXPLORER" badge when this section is just a thin wrapper over
   *  /api-explorer (kept for discoverability while we build out the page). */
  experimental?: boolean;
}

const NAV_SECTIONS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Browse",
    items: [
      { label: "Overview",     to: "/",            icon: LayoutDashboard },
      { label: "Workspaces",   to: "/workspaces",  icon: Folder },
      { label: "Peers",        to: "/peers",       icon: Users },
      { label: "Sessions",     to: "/sessions",    icon: MessagesSquare },
      { label: "Search",       to: "/search",      icon: Search },
    ],
  },
  {
    heading: "Operate",
    items: [
      { label: "Dialectic Chat", to: "/chat",        icon: MessageCircle },
      { label: "Conclusions",    to: "/conclusions", icon: Lightbulb },
    ],
  },
  {
    heading: "Admin",
    items: [
      { label: "Webhooks",     to: "/webhooks",     icon: Webhook },
      { label: "API Keys",     to: "/keys",         icon: Key },
      { label: "API Explorer", to: "/api-explorer", icon: Terminal },
      { label: "Settings",     to: "/settings",     icon: Settings },
    ],
  },
];

export function Sidebar() {
  const path = useLocation();
  return (
    <aside
      className={cn(
        "w-60 shrink-0 border-r border-surface1/40 bg-mantle/60",
        "flex flex-col",
      )}
    >
      {/* Brand */}
      <div className="px-5 py-4 flex items-center gap-2.5">
        <div className="grid place-items-center size-7 rounded-md bg-mauve text-base font-bold text-sm">
          H
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Honcho</div>
          <div className="text-[10px] uppercase tracking-widest text-muted">
            Admin
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.heading} className="space-y-0.5">
            <div className="px-2 pb-1.5 text-[10px] uppercase tracking-widest text-muted font-medium">
              {section.heading}
            </div>
            {section.items.map((it) => {
              const Icon = it.icon;
              const active =
                path === it.to ||
                (it.to !== "/" && path.startsWith(it.to + "/"));
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md px-2 py-1.5",
                    "text-sm transition-colors duration-150 ease-[var(--ease-out-quart)]",
                    active
                      ? "bg-surface1/80 text-text"
                      : "text-subtext hover:bg-surface1/40 hover:text-text",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "size-4 transition-colors",
                      active ? "text-mauve" : "text-muted group-hover:text-subtext",
                    )}
                  />
                  <span className="flex-1 truncate">{it.label}</span>
                  {active && (
                    <span className="size-1 rounded-full bg-mauve" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-surface1/40 px-4 py-3 text-[11px] text-muted flex items-center gap-2">
        <HelpCircle className="size-3.5" />
        <a
          href="https://github.com/Clinteastman/honcho-ui"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-subtext underline-offset-2 hover:underline"
        >
          honcho-ui · GitHub
        </a>
      </div>
    </aside>
  );
}
