import { Folder, Search } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Spinner } from "@/components/ui/empty";
import { useWorkspaces } from "@/lib/api/queries";

export function WorkspacesPage() {
  const [filter, setFilter] = useState("");
  const { data, isLoading, error } = useWorkspaces({});
  type Listish<T> = { items?: T[] };
  type Ws = { id?: string; created_at?: string; metadata?: Record<string, unknown> };
  const items: Ws[] = ((data as Listish<Ws>)?.items ?? []).filter((w) =>
    !filter || (w.id ?? "").toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        icon={<Folder className="size-5" />}
        title="Workspaces"
        description="The top-level isolation boundary in Honcho. Each workspace has its own peers, sessions, and messages."
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
          <table className="w-full">
            <thead className="text-left text-[11px] uppercase tracking-widest text-muted">
              <tr className="border-b border-surface1/40">
                <th className="px-5 py-2.5 font-medium">ID</th>
                <th className="px-5 py-2.5 font-medium">Metadata</th>
                <th className="px-5 py-2.5 font-medium text-right">Created</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {items.map((ws) => (
                <tr key={ws.id} className="border-b border-surface1/30 last:border-0 hover:bg-surface1/30 transition-colors">
                  <td className="px-5 py-3 font-mono">{ws.id}</td>
                  <td className="px-5 py-3">
                    {ws.metadata && Object.keys(ws.metadata).length > 0
                      ? <Badge tone="outline">{Object.keys(ws.metadata).length} keys</Badge>
                      : <span className="text-muted text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-subtext tabular-nums">
                    {ws.created_at ? new Date(ws.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
