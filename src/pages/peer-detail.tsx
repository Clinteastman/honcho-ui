import { useMemo, useState } from "react";
import { Users, Sparkles, MessageCircle, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Spinner } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Link, useNavigate } from "@/lib/router";
import { useCurrentWorkspace } from "@/lib/workspace";
import { usePeer, usePeerRepresentation } from "@/lib/api/queries";

/**
 * Peer detail — the headline feature of Honcho UI.
 *
 * What we show:
 *   - peer ID + created date
 *   - the peer card / representation (what Honcho has learned about the peer)
 *   - "Chat with this peer" button -> dialectic endpoint via /chat page
 *
 * The representation is rendered as a structured layout rather than dumped
 * JSON. We try common shapes first (conclusions array, traits array) and
 * fall back to formatted JSON for anything else.
 */
export function PeerDetailPage({ peerId }: { peerId: string }) {
  const { current } = useCurrentWorkspace();
  const navigate = useNavigate();
  const peer = usePeer(current ?? "", peerId);
  const repr = usePeerRepresentation(current ?? "", peerId);
  const [showRaw, setShowRaw] = useState(false);

  const reprData = repr.data as Record<string, unknown> | undefined;
  const conclusions = useMemo(() => {
    if (!reprData) return null;
    // Honcho representations frequently embed conclusions / observations
    // as arrays at the top level; surface them as bullets if present.
    for (const k of ["conclusions", "observations", "traits", "insights"]) {
      const v = reprData[k];
      if (Array.isArray(v)) return { key: k, items: v };
    }
    return null;
  }, [reprData]);

  if (!current) return <EmptyState icon={<Users className="size-5"/>} title="No workspace" />;

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate("/peers")}>
        <ChevronLeft className="size-3.5" /> All peers
      </Button>

      <PageHeader
        icon={<Users className="size-5" />}
        title={peerId}
        description={peer.data ? `Peer in workspace ${current}` : "Loading…"}
        actions={
          <Button asChild>
            <Link to={`/chat?peer=${encodeURIComponent(peerId)}`}>
              <MessageCircle className="size-4" /> Chat with peer
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Peer card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-mauve" />
              Peer card
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRaw((v) => !v)}
            >
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
                description="Honcho builds the peer card over time as messages arrive. If this peer is brand new, send some messages and check back."
              />
            ) : showRaw ? (
              <pre className="text-xs font-mono text-subtext overflow-auto p-4 rounded-md bg-crust/60 border border-surface1/60 leading-relaxed">
                {JSON.stringify(reprData, null, 2)}
              </pre>
            ) : conclusions ? (
              <div className="space-y-3">
                <Badge tone="mauve">{conclusions.items.length} {conclusions.key}</Badge>
                <ul className="space-y-2.5">
                  {conclusions.items.map((c, i) => (
                    <li
                      key={i}
                      className="flex gap-3 rounded-lg border border-surface1/40 bg-mantle/40 p-3"
                    >
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
              <pre className="text-xs font-mono text-subtext overflow-auto p-4 rounded-md bg-crust/60 border border-surface1/60 leading-relaxed">
                {JSON.stringify(reprData, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {peer.isLoading ? (
                <Spinner />
              ) : peer.data ? (
                <>
                  <Row label="ID" value={<code className="font-mono">{(peer.data as { id?: string }).id}</code>} />
                  <Row label="Workspace" value={<code className="font-mono">{current}</code>} />
                  {(peer.data as { created_at?: string }).created_at && (
                    <>
                      <Separator />
                      <Row label="Created" value={new Date((peer.data as { created_at: string }).created_at).toLocaleString()} />
                    </>
                  )}
                </>
              ) : (
                <span className="text-muted">No details available.</span>
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
      <span className="text-right text-text">{value}</span>
    </div>
  );
}
