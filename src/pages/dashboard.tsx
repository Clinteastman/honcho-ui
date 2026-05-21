import { Activity, Folder, MessageCircle, MessagesSquare, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Spinner, EmptyState, Skeleton } from "@/components/ui/empty";
import { useCurrentWorkspace } from "@/lib/workspace";
import { useWorkspaces, usePeers, useSessions, useConclusions } from "@/lib/api/queries";
import { formatCount } from "@/lib/utils";
import { Link } from "@/lib/router";

export function DashboardPage() {
  const { current } = useCurrentWorkspace();
  const workspaces = useWorkspaces({});
  const peers = usePeers(current ?? "", {});
  const sessions = useSessions(current ?? "", {});
  const conclusions = useConclusions(current ?? "", {});

  type Listish = { items?: unknown[]; total?: number };
  const wsItems = (workspaces.data as Listish | undefined)?.items ?? [];
  const wsCount = wsItems.length;

  const stat = (q: { data?: unknown }) => (q.data as Listish | undefined)?.total;

  const stats = [
    { label: "Workspaces", value: wsCount, icon: Folder, loading: workspaces.isLoading, href: "/workspaces" },
    { label: "Peers",      value: stat(peers),    icon: Users,            loading: peers.isLoading,       href: "/peers" },
    { label: "Sessions",   value: stat(sessions), icon: MessagesSquare,   loading: sessions.isLoading,    href: "/sessions" },
    { label: "Conclusions", value: stat(conclusions), icon: MessageCircle, loading: conclusions.isLoading, href: "/conclusions" },
  ];

  return (
    <>
      <PageHeader
        icon={<Activity className="size-5" />}
        title="Overview"
        description={
          current
            ? <>Showing stats for workspace <strong className="text-text font-mono">{current}</strong></>
            : "Pick a workspace from the top bar to see its stats."
        }
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              to={s.href}
              className="group"
            >
              <Card className="p-5 transition-colors hover:border-surface2/80 hover:bg-mantle/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-widest text-muted">{s.label}</span>
                  <Icon className="size-4 text-muted group-hover:text-mauve transition-colors" />
                </div>
                <div className="text-2xl font-semibold tracking-tight tabular-nums">
                  {s.loading
                    ? <Skeleton className="h-7 w-16" />
                    : s.value == null
                      ? <span className="text-muted text-base">—</span>
                      : formatCount(s.value as number)}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Workspaces list */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Folder className="size-4 text-mauve" />
          Workspaces
        </h2>
        <Card variant="default">
          {workspaces.isLoading ? (
            <div className="flex items-center justify-center py-12"><Spinner /></div>
          ) : wsCount === 0 ? (
            <EmptyState
              icon={<Folder className="size-5" />}
              title="No workspaces visible"
              description="The current token either has no workspaces yet, or doesn't have list-workspace scope. Try the API Explorer for a deeper look."
            />
          ) : (
            <ul className="divide-y divide-surface1/40">
              {wsItems.map((w) => {
                const ws = w as { id?: string; created_at?: string };
                return (
                  <li key={ws.id}>
                    <Link
                      to={`/workspaces`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-surface1/30 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Folder className="size-3.5 text-mauve" />
                        <span className="font-mono text-sm">{ws.id}</span>
                      </span>
                      <span className="text-[11px] text-muted">
                        {ws.created_at ? new Date(ws.created_at).toLocaleDateString() : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
