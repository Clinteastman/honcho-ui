import { useMemo, useState, useEffect } from "react";
import {
  Sparkles, MessageCircle, ChevronLeft, Bot, User, Save, ChevronDown,
  ChevronUp, MessagesSquare,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { EmptyState, Spinner } from "@/components/ui/empty";
import { Link, useNavigate } from "@/lib/router";
import { useCurrentWorkspace } from "@/lib/workspace";
import {
  usePeer, usePeerRepresentation, usePeerCard, useUpdatePeerCard,
  usePeerContext, usePeerSessions, useUpdatePeer,
} from "@/lib/api/queries";
import { classifyPeer } from "@/lib/peer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function PeerDetailPage({ peerId }: { peerId: string }) {
  const { current } = useCurrentWorkspace();
  const navigate = useNavigate();
  const peer = usePeer(current ?? "", peerId);

  if (!current) return <EmptyState title="No workspace" />;

  const peerData = peer.data as { id?: string; metadata?: Record<string, unknown> } | undefined;
  const kind = peerData ? classifyPeer(peerData) : "human";
  const Icon = kind === "ai" ? Bot : User;

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate("/peers")}>
        <ChevronLeft className="size-3.5" /> All peers
      </Button>

      <PageHeader
        icon={<Icon className="size-5" />}
        title={peerId}
        description={
          <span className="flex items-center gap-2">
            Peer in <code className="font-mono">{current}</code>
            <Badge tone={kind === "ai" ? "mauve" : "sapphire"}>{kind}</Badge>
          </span>
        }
        actions={
          <Button asChild>
            <Link to={`/chat?peer=${encodeURIComponent(peerId)}`}>
              <MessageCircle className="size-4" /> Chat with peer
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="representation">
        <TabsList>
          <TabsTrigger value="representation">
            <Sparkles className="size-3.5" /> Representation
          </TabsTrigger>
          <TabsTrigger value="card">Peer card</TabsTrigger>
          <TabsTrigger value="context">Context</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="representation">
          <RepresentationTab workspaceId={current} peerId={peerId} />
        </TabsContent>
        <TabsContent value="card">
          <CardTab workspaceId={current} peerId={peerId} />
        </TabsContent>
        <TabsContent value="context">
          <ContextTab workspaceId={current} peerId={peerId} />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionsTab workspaceId={current} peerId={peerId} />
        </TabsContent>
        <TabsContent value="config">
          <ConfigTab workspaceId={current} peerId={peerId} peer={peerData} />
        </TabsContent>
      </Tabs>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function RepresentationTab({ workspaceId, peerId }: { workspaceId: string; peerId: string }) {
  const repr = usePeerRepresentation(workspaceId, peerId);
  const [showRaw, setShowRaw] = useState(false);
  const reprData = repr.data as Record<string, unknown> | undefined;

  const conclusions = useMemo(() => {
    if (!reprData) return null;
    for (const k of ["conclusions", "observations", "traits", "insights"]) {
      const v = reprData[k];
      if (Array.isArray(v)) return { key: k, items: v };
    }
    return null;
  }, [reprData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-mauve" />
          What Honcho has learned
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setShowRaw((v) => !v)}>
          {showRaw ? "Show summary" : "Show raw JSON"}
        </Button>
      </CardHeader>
      <CardContent>
        {repr.isLoading ? (
          <div className="flex items-center justify-center py-12"><Spinner /></div>
        ) : repr.error ? (
          <EmptyState
            icon={<Sparkles className="size-5" />}
            title="No representation yet"
            description="Honcho builds the peer card over time as messages arrive."
          />
        ) : showRaw ? (
          <RawJson value={reprData} />
        ) : conclusions ? (
          <div className="space-y-3">
            <Badge tone="mauve">{conclusions.items.length} {conclusions.key}</Badge>
            <ul className="space-y-2.5">
              {conclusions.items.map((c, i) => (
                <li key={i} className="flex gap-3 rounded-lg border border-surface1/40 bg-mantle/40 p-3">
                  <div className="size-1.5 rounded-full bg-mauve shrink-0 mt-2" />
                  <span className="text-sm text-text leading-relaxed">
                    {typeof c === "string" ? c : (c as { text?: string; content?: string }).text
                      ?? (c as { content?: string }).content
                      ?? JSON.stringify(c)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <RawJson value={reprData} />
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

function CardTab({ workspaceId, peerId }: { workspaceId: string; peerId: string }) {
  const card = usePeerCard(workspaceId, peerId);
  const update = useUpdatePeerCard();
  const [draft, setDraft] = useState<string>("");
  const [editing, setEditing] = useState(false);

  // Sync local draft with server value when it loads or changes.
  const cardData = card.data as unknown;
  useEffect(() => {
    if (cardData != null && !editing) {
      const txt = typeof cardData === "string" ? cardData : JSON.stringify(cardData, null, 2);
      setDraft(txt);
    }
  }, [cardData, editing]);

  const handleSave = async () => {
    let body: Record<string, unknown>;
    try { body = JSON.parse(draft); }
    catch { toast.error("Card must be valid JSON"); return; }
    try {
      await update.mutateAsync({ workspaceId, peerId, body });
      toast.success("Peer card saved");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Peer card</CardTitle>
          <p className="text-xs text-subtext mt-1">
            Editable team-curated knowledge about this peer. Stored as a JSON
            blob; edit when you want to seed something Honcho hasn't learned yet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={update.isPending}>
                {update.isPending ? <Spinner /> : <Save className="size-3.5" />}
                Save
              </Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {card.isLoading ? (
          <Spinner />
        ) : (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            readOnly={!editing}
            spellCheck={false}
            rows={18}
            className={cn(
              "w-full text-xs font-mono leading-relaxed",
              "rounded-md border border-surface1 bg-crust/60 px-3 py-2",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:border-mauve resize-y",
              !editing && "opacity-90",
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

function ContextTab({ workspaceId, peerId }: { workspaceId: string; peerId: string }) {
  const ctx = usePeerContext(workspaceId, peerId);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Context</CardTitle>
        <p className="text-xs text-subtext mt-1">
          What Honcho returns when an agent asks <code>context()</code> for this peer.
        </p>
      </CardHeader>
      <CardContent>
        {ctx.isLoading ? <Spinner /> :
         ctx.error ? <EmptyState title="Couldn't load context" description={(ctx.error as Error).message} /> :
         <RawJson value={ctx.data} />}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

function SessionsTab({ workspaceId, peerId }: { workspaceId: string; peerId: string }) {
  const sessions = usePeerSessions(workspaceId, peerId);
  type Session = { id?: string; is_active?: boolean; created_at?: string };
  const items: Session[] = (sessions.data as { items?: Session[] } | undefined)?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions for this peer</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.isLoading ? <Spinner /> :
         items.length === 0 ? <EmptyState icon={<MessagesSquare className="size-5"/>} title="No sessions" /> :
         <ul className="divide-y divide-surface1/40">
           {items.map((s) => (
             <li key={s.id}>
               <Link
                 to={`/sessions/${encodeURIComponent(s.id ?? "")}`}
                 className="flex items-center justify-between py-2.5 hover:bg-surface1/20 -mx-3 px-3 rounded transition-colors"
               >
                 <span className="flex items-center gap-2">
                   <MessagesSquare className="size-3.5 text-mauve" />
                   <span className="font-mono text-sm">{s.id}</span>
                   {s.is_active && <Badge tone="green">active</Badge>}
                 </span>
                 <span className="text-[11px] text-muted">
                   {s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}
                 </span>
               </Link>
             </li>
           ))}
         </ul>
        }
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

function ConfigTab({
  workspaceId,
  peerId,
  peer,
}: {
  workspaceId: string;
  peerId: string;
  peer?: { metadata?: Record<string, unknown>; configuration?: Record<string, unknown> };
}) {
  const update = useUpdatePeer();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (peer && !editing) {
      setDraft(JSON.stringify({
        metadata: peer.metadata ?? {},
        configuration: peer.configuration ?? {},
      }, null, 2));
    }
  }, [peer, editing]);

  const handleSave = async () => {
    let body: Record<string, unknown>;
    try { body = JSON.parse(draft); }
    catch { toast.error("Config must be valid JSON"); return; }
    try {
      await update.mutateAsync({ workspaceId, peerId, body });
      toast.success("Peer config saved");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Configuration & metadata</CardTitle>
          <p className="text-xs text-subtext mt-1">
            Peer-level settings (e.g. <code>metadata.kind</code> to flip AI vs human classification).
            Sent via <code>PUT /peers/{"{peer_id}"}</code>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={update.isPending}>
                {update.isPending ? <Spinner /> : <Save className="size-3.5" />}
                Save
              </Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          readOnly={!editing}
          spellCheck={false}
          rows={16}
          className={cn(
            "w-full text-xs font-mono leading-relaxed",
            "rounded-md border border-surface1 bg-crust/60 px-3 py-2",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:border-mauve resize-y",
            !editing && "opacity-90",
          )}
        />
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

function RawJson({ value }: { value: unknown }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-end mb-1">
        <Button variant="ghost" size="sm" onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
          {collapsed ? "Expand" : "Collapse"}
        </Button>
      </div>
      {!collapsed && (
        <pre className="text-xs font-mono text-subtext overflow-auto p-4 rounded-md bg-crust/60 border border-surface1/60 leading-relaxed">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

// Unused import suppression - Label is exported by ui/label and we may use it later.
export const _LabelKeep = Label;
