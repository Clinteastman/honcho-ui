import { MessagesSquare, ChevronLeft, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Spinner } from "@/components/ui/empty";
import { useNavigate } from "@/lib/router";
import { useCurrentWorkspace } from "@/lib/workspace";
import { useSession, useMessages } from "@/lib/api/queries";
import { formatDistanceToNow } from "date-fns";

export function SessionDetailPage({ sessionId }: { sessionId: string }) {
  const { current } = useCurrentWorkspace();
  const navigate = useNavigate();
  const session = useSession(current ?? "", sessionId);
  const messages = useMessages(current ?? "", sessionId, {});

  type Msg = { id?: string; peer_id?: string; content?: string; created_at?: string };
  const msgs: Msg[] = (messages.data as { items?: Msg[] } | undefined)?.items ?? [];

  if (!current) {
    return <EmptyState icon={<AlertCircle className="size-5"/>} title="No workspace" />;
  }

  const sess = session.data as { id?: string; is_active?: boolean; created_at?: string } | undefined;

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate("/sessions")}>
        <ChevronLeft className="size-3.5" /> All sessions
      </Button>

      <PageHeader
        icon={<MessagesSquare className="size-5" />}
        title={sessionId}
        description={
          sess
            ? <>Session in <code className="font-mono">{current}</code>{" "}
                {sess.is_active ? <Badge tone="green" className="ml-1">active</Badge> : <Badge tone="outline" className="ml-1">inactive</Badge>}
              </>
            : "Loading…"
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <Card className="lg:col-span-3">
          <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto py-5">
            {messages.isLoading ? (
              <div className="flex items-center justify-center py-12"><Spinner /></div>
            ) : msgs.length === 0 ? (
              <EmptyState
                icon={<MessagesSquare className="size-5" />}
                title="No messages in this session"
                description="When peers send messages here, they appear in a timeline. Use the API to send one (POST /sessions/{id}/messages)."
              />
            ) : (
              msgs.map((m) => <Message key={m.id} message={m} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 text-sm py-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted">Messages</span>
              <span className="tabular-nums">{(messages.data as { total?: number } | undefined)?.total ?? msgs.length}</span>
            </div>
            {sess?.created_at && (
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted">Created</span>
                <span>{new Date(sess.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Message({ message }: { message: { id?: string; peer_id?: string; content?: string; created_at?: string } }) {
  return (
    <div className="flex gap-3 rounded-lg border border-surface1/40 bg-mantle/40 p-3">
      <div className="grid place-items-center size-7 rounded-md bg-surface1/80 text-[11px] font-medium uppercase shrink-0">
        {(message.peer_id ?? "?").slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="font-mono text-xs text-mauve">{message.peer_id ?? "—"}</span>
          {message.created_at && (
            <span className="text-[11px] text-muted">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
          )}
        </div>
        <p className="text-sm text-text leading-relaxed whitespace-pre-wrap break-words">
          {message.content || <span className="text-muted italic">(no content)</span>}
        </p>
      </div>
    </div>
  );
}
