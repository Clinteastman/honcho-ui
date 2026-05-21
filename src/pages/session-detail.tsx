import { useMemo, useState } from "react";
import { MessagesSquare, ChevronLeft, AlertCircle, ChevronDown, ChevronUp, Wrench } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState, Spinner } from "@/components/ui/empty";
import { useNavigate } from "@/lib/router";
import { useCurrentWorkspace } from "@/lib/workspace";
import { useSession, useMessages } from "@/lib/api/queries";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Msg {
  id?: string;
  peer_id?: string;
  content?: string;
  created_at?: string;
  token_count?: number;
  metadata?: Record<string, unknown>;
}

type MessageKind = "user" | "assistant" | "tool" | "system";

/**
 * Classify a message by its source. We use peer_id + metadata.type to
 * decide; the claude-honcho plugin tags assistant messages with
 * metadata.type=assistant_prose and tool calls have content prefixed by
 * "[Tool]" in our deployment.
 */
function classify(m: Msg): MessageKind {
  const t = (m.metadata?.type as string) ?? "";
  if (t.includes("tool")) return "tool";
  if (t === "assistant_prose" || t === "assistant") return "assistant";
  if (m.peer_id === "claude" && (m.content ?? "").startsWith("[Tool]")) return "tool";
  if (m.peer_id === "claude") return "assistant";
  if (m.peer_id) return "user";
  return "system";
}

export function SessionDetailPage({ sessionId }: { sessionId: string }) {
  const { current } = useCurrentWorkspace();
  const navigate = useNavigate();
  const session = useSession(current ?? "", sessionId);
  const messages = useMessages(current ?? "", sessionId, {});

  const [filter, setFilter] = useState("");
  const [hideTools, setHideTools] = useState(false);

  const allMsgs: Msg[] = (messages.data as { items?: Msg[] } | undefined)?.items ?? [];
  // Honcho returns messages in arbitrary order; sort chronologically.
  const sorted = useMemo(() => {
    return [...allMsgs].sort((a, b) =>
      (a.created_at ?? "").localeCompare(b.created_at ?? "")
    );
  }, [allMsgs]);

  const filtered = useMemo(() => {
    return sorted.filter((m) => {
      const kind = classify(m);
      if (hideTools && kind === "tool") return false;
      if (filter && !(m.content ?? "").toLowerCase().includes(filter.toLowerCase())) return false;
      return true;
    });
  }, [sorted, filter, hideTools]);

  const toolCount = sorted.filter((m) => classify(m) === "tool").length;

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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-3 min-w-0">
          {/* Filters */}
          <Card variant="flat">
            <CardContent className="py-3 flex flex-wrap items-center gap-3">
              <Input
                placeholder="Search messages…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 min-w-[200px] h-8 text-xs"
              />
              <label className="flex items-center gap-2 text-xs text-subtext cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideTools}
                  onChange={(e) => setHideTools(e.target.checked)}
                  className="size-3.5 rounded border-surface2 bg-surface0 accent-mauve"
                />
                Hide tool calls ({toolCount})
              </label>
              <span className="text-xs text-muted tabular-nums">
                {filtered.length} of {sorted.length}
              </span>
            </CardContent>
          </Card>

          {/* Timeline */}
          {messages.isLoading ? (
            <Card><CardContent className="flex items-center justify-center py-16"><Spinner /></CardContent></Card>
          ) : sorted.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={<MessagesSquare className="size-5" />}
                  title="No messages in this session"
                  description="When peers send messages here, they appear in a timeline."
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((m) => <MessageBubble key={m.id} message={m} kind={classify(m)} />)}
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-3">
          <Card>
            <CardContent className="space-y-2.5 text-sm py-4">
              <Row label="Messages" value={(messages.data as { total?: number } | undefined)?.total ?? sorted.length} />
              <Row label="Tool calls" value={toolCount} />
              <Row label="Conversational" value={sorted.length - toolCount} />
              {sess?.created_at && (
                <Row label="Created" value={new Date(sess.created_at).toLocaleString()} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs uppercase tracking-widest text-muted">{label}</span>
      <span className="text-right text-text tabular-nums">{value}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

interface BubbleProps {
  message: Msg;
  kind: MessageKind;
}

function MessageBubble({ message, kind }: BubbleProps) {
  const [expanded, setExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const longContent = (message.content?.length ?? 0) > 600;

  // Tool calls: tiny, muted, single-line with expand-on-click.
  if (kind === "tool") {
    return (
      <div
        className="flex items-center gap-2 text-[11px] text-muted px-3 py-1 cursor-pointer hover:bg-surface1/30 rounded"
        onClick={() => setExpanded((e) => !e)}
      >
        <Wrench className="size-3" />
        <span className="font-mono truncate flex-1">{message.content}</span>
        {message.created_at && (
          <span className="tabular-nums shrink-0">
            {new Date(message.created_at).toLocaleTimeString()}
          </span>
        )}
        {expanded && (
          <pre className="absolute mt-8 z-10 max-w-xl text-xs bg-mantle border border-surface1 rounded-md p-3 font-mono whitespace-pre-wrap">
            {JSON.stringify(message.metadata, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  // User / Assistant / System: chat-bubble style
  const isUser = kind === "user";

  return (
    <div
      className={cn(
        "rounded-lg border px-3.5 py-2.5",
        isUser
          ? "bg-mauve/10 border-mauve/20 ml-8"
          : "bg-surface0/40 border-surface1/50 mr-8",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1.5">
        <Badge tone={isUser ? "mauve" : "sapphire"} className="gap-1">
          <span className="font-mono">{message.peer_id ?? "—"}</span>
        </Badge>
        {message.created_at && (
          <span className="text-[11px] text-muted tabular-nums">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        )}
        {message.token_count != null && (
          <span className="text-[11px] text-muted ml-auto tabular-nums">
            {message.token_count} tok
          </span>
        )}
      </div>

      {/* Content */}
      {showRaw ? (
        <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-crust/60 border border-surface1 rounded p-2 leading-relaxed">
          {JSON.stringify(message, null, 2)}
        </pre>
      ) : (
        <div className={cn(
          "text-sm text-text leading-relaxed",
          !expanded && longContent && "max-h-32 overflow-hidden relative",
        )}>
          <MessageContent content={message.content ?? ""} />
          {!expanded && longContent && (
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface0/40 to-transparent pointer-events-none" />
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 mt-2 text-[11px]">
        {longContent && !showRaw && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-muted hover:text-text inline-flex items-center gap-1 transition-colors"
          >
            {expanded ? <><ChevronUp className="size-3" /> Less</> : <><ChevronDown className="size-3" /> More</>}
          </button>
        )}
        <button
          onClick={() => setShowRaw((s) => !s)}
          className="text-muted hover:text-text transition-colors"
        >
          {showRaw ? "Show rendered" : "Show raw"}
        </button>
      </div>
    </div>
  );
}

/**
 * Lightweight content renderer: preserves newlines, highlights fenced
 * code blocks (```), and basic inline code (`). Not a full markdown
 * implementation - we don't need bold/italic/etc. for a chat log.
 */
function MessageContent({ content }: { content: string }) {
  // Split on triple-backtick fenced blocks
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const inner = part.slice(3, -3);
          const newline = inner.indexOf("\n");
          // Skip optional language hint on first line
          const code = newline >= 0 ? inner.slice(newline + 1) : inner;
          return (
            <pre
              key={i}
              className="text-xs font-mono bg-crust/60 border border-surface1/60 rounded p-3 overflow-x-auto whitespace-pre leading-relaxed"
            >
              {code}
            </pre>
          );
        }
        // Inline `code`
        const inlineParts = part.split(/(`[^`]+`)/g);
        return (
          <p key={i} className="whitespace-pre-wrap break-words">
            {inlineParts.map((p, j) =>
              p.startsWith("`") && p.endsWith("`") && p.length > 2 ? (
                <code
                  key={j}
                  className="font-mono text-[0.875em] px-1 py-0.5 rounded bg-surface1/60 border border-surface1"
                >
                  {p.slice(1, -1)}
                </code>
              ) : (
                p
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}
