import { MessagesSquare, Search, AlertCircle } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Spinner } from "@/components/ui/empty";
import { Link } from "@/lib/router";
import { useCurrentWorkspace } from "@/lib/workspace";
import { useSessions } from "@/lib/api/queries";

export function SessionsPage() {
  const { current } = useCurrentWorkspace();
  const [filter, setFilter] = useState("");
  const { data, isLoading, error } = useSessions(current ?? "", {});

  type Session = { id?: string; is_active?: boolean; created_at?: string };
  const items: Session[] = ((data as { items?: Session[] } | undefined)?.items ?? []).filter(
    (s) => !filter || (s.id ?? "").toLowerCase().includes(filter.toLowerCase()),
  );

  if (!current) {
    return (
      <>
        <PageHeader icon={<MessagesSquare className="size-5" />} title="Sessions" />
        <EmptyState icon={<AlertCircle className="size-5" />} title="No workspace selected"
          description="Pick a workspace from the top bar to browse its sessions." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        icon={<MessagesSquare className="size-5" />}
        title="Sessions"
        description="Conversation threads. Multiple peers can share one session, building shared context."
      />

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
        <Input placeholder="Filter sessions…" value={filter} onChange={(e) => setFilter(e.target.value)} hasLeftIcon />
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : error ? (
          <EmptyState icon={<MessagesSquare className="size-5" />} title="Couldn't list sessions"
            description={(error as Error).message} />
        ) : items.length === 0 ? (
          <EmptyState icon={<MessagesSquare className="size-5" />} title="No sessions"
            description="Sessions are created automatically when agents send messages." />
        ) : (
          <ul className="divide-y divide-surface1/40">
            {items.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/sessions/${encodeURIComponent(s.id ?? "")}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-surface1/30 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <MessagesSquare className="size-3.5 text-mauve" />
                    <span className="font-mono text-sm">{s.id}</span>
                    {s.is_active ? (
                      <Badge tone="green">active</Badge>
                    ) : (
                      <Badge tone="outline">inactive</Badge>
                    )}
                  </span>
                  <span className="text-[11px] text-muted tabular-nums">
                    {s.created_at ? new Date(s.created_at).toLocaleString() : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
