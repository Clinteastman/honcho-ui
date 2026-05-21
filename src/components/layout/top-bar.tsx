import { LogOut, Shield, ShieldCheck, ShieldAlert, ExternalLink } from "lucide-react";
import { useAuth, clearAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

export function TopBar() {
  const { config, decoded } = useAuth();

  if (!config || !decoded) return null;

  const scope = decoded.scope;
  const ScopeIcon =
    scope === "admin" ? ShieldCheck :
    scope === "workspace" ? Shield :
    scope === "peer" ? Shield :
    ShieldAlert;

  const scopeTone =
    scope === "admin" ? "mauve" :
    scope === "workspace" ? "sapphire" :
    scope === "peer" ? "sapphire" :
    "outline";

  const handleLogout = () => {
    clearAuth();
    toast.success("Signed out. Your token has been cleared from this browser.");
  };

  return (
    <div className="h-12 shrink-0 border-b border-surface1/40 bg-mantle/40 backdrop-blur flex items-center px-4 gap-3">
      <WorkspaceSwitcher />

      <div className="flex-1" />

      {/* Endpoint */}
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={config.baseUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="hidden md:flex items-center gap-1.5 px-2 h-7 rounded-md border border-surface1/60 text-[11px] font-mono text-subtext hover:text-text hover:border-surface2 transition-colors"
          >
            {new URL(config.baseUrl).host}
            <ExternalLink className="size-3" />
          </a>
        </TooltipTrigger>
        <TooltipContent>Honcho endpoint (click to open the API in a new tab)</TooltipContent>
      </Tooltip>

      {/* Scope badge */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge tone={scopeTone as "mauve" | "sapphire" | "outline"} className="gap-1">
            <ScopeIcon className="size-3" />
            {decoded.scopeLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          Token scope. Determines which resources you can access.
        </TooltipContent>
      </Tooltip>

      {/* Logout */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Sign out (clears token from this browser)</TooltipContent>
      </Tooltip>
    </div>
  );
}
