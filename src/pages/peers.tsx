import { Users, Search, AlertCircle, Bot, User } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Spinner } from "@/components/ui/empty";
import { Link } from "@/lib/router";
import { useCurrentWorkspace } from "@/lib/workspace";
import { usePeers } from "@/lib/api/queries";
import { classifyPeer } from "@/lib/peer";

export function PeersPage() {
  const { current } = useCurrentWorkspace();
  const [filter, setFilter] = useState("");
  const { data, isLoading, error } = usePeers(current ?? "", {});

  type Peer = { id?: string; created_at?: string; metadata?: Record<string, unknown> };
  const items: Peer[] = ((data as { items?: Peer[] } | undefined)?.items ?? []).filter(
    (p) => !filter || (p.id ?? "").toLowerCase().includes(filter.toLowerCase()),
  );

  const aiCount = items.filter((p) => classifyPeer(p) === "ai").length;
  const humanCount = items.length - aiCount;

  if (!current) {
    return (
      <>
        <PageHeader icon={<Users className="size-5" />} title="Peers" />
        <EmptyState
          icon={<AlertCircle className="size-5" />}
          title="No workspace selected"
          description="Pick a workspace from the top bar to browse its peers."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        icon={<Users className="size-5" />}
        title="Peers"
        description="Identities (humans, agents, repos) that Honcho holds memory for. Click a peer to see its peer card."
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative max-w-md flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
          <Input placeholder="Filter peers…" value={filter} onChange={(e) => setFilter(e.target.value)} hasLeftIcon />
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <Badge tone="sapphire" className="gap-1"><User className="size-3" />{humanCount} human</Badge>
            <Badge tone="mauve" className="gap-1"><Bot className="size-3" />{aiCount} AI</Badge>
          </div>
        )}
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : error ? (
          <EmptyState
            icon={<Users className="size-5" />}
            title="Couldn't list peers"
            description={(error as Error).message}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Users className="size-5" />}
            title="No peers in this workspace"
            description="When agents start sending messages, Honcho creates peers automatically. You can also create one via the API Explorer."
          />
        ) : (
          <ul className="divide-y divide-surface1/40">
            {items.map((p) => {
              const kind = classifyPeer(p);
              const Icon = kind === "ai" ? Bot : User;
              return (
                <li key={p.id}>
                  <Link
                    to={`/peers/${encodeURIComponent(p.id ?? "")}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-surface1/30 transition-colors group"
                  >
                    <span className="flex items-center gap-2.5">
                      <div className={`grid place-items-center size-7 rounded-md text-[11px] font-medium uppercase ${kind === "ai" ? "bg-mauve/15 text-mauve" : "bg-sapphire/15 text-sapphire"}`}>
                        <Icon className="size-3.5" />
                      </div>
                      <span className="font-mono text-sm">{p.id}</span>
                      <Badge tone={kind === "ai" ? "mauve" : "sapphire"}>{kind}</Badge>
                    </span>
                    <span className="text-[11px] text-muted tabular-nums">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
