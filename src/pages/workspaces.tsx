import { Folder, Search, ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Spinner } from "@/components/ui/empty";
import { useWorkspaces } from "@/lib/api/queries";
import { useCurrentWorkspace } from "@/lib/workspace";
import { useNavigate } from "@/lib/router";
import { cn } from "@/lib/utils";

export function WorkspacesPage() {
  const [filter, setFilter] = useState("");
  const { data, isLoading, error } = useWorkspaces({});
  const { current, setCurrent, locked } = useCurrentWorkspace();
  const navigate = useNavigate();

  type Listish<T> = { items?: T[] };
  type Ws = { id?: string; created_at?: string; metadata?: Record<string, unknown> };
  const items: Ws[] = ((data as Listish<Ws>)?.items ?? []).filter((w) =>
    !filter || (w.id ?? "").toLowerCase().includes(filter.toLowerCase()),
  );

  const handleSelect = (id: string) => {
    setCurrent(id);
    navigate("/peers");
  };

  return (
    <>
      <PageHeader
        icon={<Folder className="size-5" />}
        title="Workspaces"
        description={
          <>
            The top-level isolation boundary in Honcho. Click a workspace to
            make it the active one — other pages (peers, sessions, etc.) will
            scope to it.
            {locked && (
              <span className="block mt-1 text-peach">
                Your token is workspace-scoped; you can't switch.
              </span>
            )}
          </>
        }
      />

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
        <Input
          placeholder="Filter workspaces…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          hasLeftIcon
        />
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : error ? (
          <EmptyState
            icon={<Folder className="size-5" />}
            title="Couldn't list workspaces"
            description={(error as Error).message}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Folder className="size-5" />}
            title="No workspaces"
            description="Use the API Explorer to create one, or check that your token has list-workspace scope."
          />
        ) : (
          <ul className="divide-y divide-surface1/40">
            {items.map((ws) => {
              const isCurrent = ws.id === current;
              return (
                <li key={ws.id}>
                  <button
                    type="button"
                    onClick={() => ws.id && handleSelect(ws.id)}
                    disabled={locked && !isCurrent}
                    className={cn(
                      "group w-full flex items-center justify-between gap-4 px-5 py-3.5",
                      "text-left transition-colors duration-150 ease-[var(--ease-out-quart)]",
                      "hover:bg-surface1/30 focus-visible:bg-surface1/40 focus-visible:outline-none",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      isCurrent && "bg-mauve/5",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Folder
                        className={cn("size-4 shrink-0", isCurrent ? "text-mauve" : "text-muted")}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">{ws.id}</span>
                          {isCurrent && (
                            <Badge tone="mauve" className="gap-1">
                              <Check className="size-3" />
                              active
                            </Badge>
                          )}
                        </div>
                        {ws.metadata && Object.keys(ws.metadata).length > 0 && (
                          <div className="text-[11px] text-muted mt-0.5">
                            {Object.keys(ws.metadata).length} metadata key
                            {Object.keys(ws.metadata).length === 1 ? "" : "s"}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-muted tabular-nums hidden sm:inline">
                        {ws.created_at ? new Date(ws.created_at).toLocaleDateString() : ""}
                      </span>
                      <ArrowRight
                        className={cn(
                          "size-4 text-muted shrink-0 transition-transform",
                          "group-hover:translate-x-0.5 group-hover:text-text",
                        )}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
