import { useEffect, useState } from "react";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Spinner } from "@/components/ui/empty";
import { useCurrentWorkspace } from "@/lib/workspace";
import { usePeers, usePeerChat } from "@/lib/api/queries";
import { toast } from "sonner";

const REASONING_LEVELS = ["minimal", "low", "medium", "high", "max"] as const;
type Level = (typeof REASONING_LEVELS)[number];

interface ChatTurn {
  question: string;
  answer?: string;
  loading?: boolean;
  error?: string;
}

export function ChatPage() {
  const { current } = useCurrentWorkspace();
  const peers = usePeers(current ?? "", {});
  const chat = usePeerChat();

  type Peer = { id?: string };
  const peerItems: Peer[] = (peers.data as { items?: Peer[] } | undefined)?.items ?? [];

  // Read peer from URL query (?peer=foo)
  const initialPeer = (() => {
    const m = window.location.hash.match(/[?&]peer=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  })();

  const [peerId, setPeerId] = useState(initialPeer);
  const [level, setLevel] = useState<Level>("medium");
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<ChatTurn[]>([]);

  useEffect(() => {
    if (!peerId && peerItems[0]?.id) setPeerId(peerItems[0].id);
  }, [peerItems, peerId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !peerId || !current) return;

    const q = question.trim();
    setQuestion("");
    const turn: ChatTurn = { question: q, loading: true };
    setHistory((h) => [...h, turn]);

    try {
      const data = await chat.mutateAsync({
        workspaceId: current,
        peerId,
        body: { queries: [q], reasoning_level: level },
      });
      const content = extractAnswer(data);
      setHistory((h) => h.map((t, i) => i === h.length - 1 ? { ...t, answer: content, loading: false } : t));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Chat failed";
      setHistory((h) => h.map((t, i) => i === h.length - 1 ? { ...t, error: msg, loading: false } : t));
      toast.error(msg);
    }
  };

  if (!current) {
    return (
      <>
        <PageHeader icon={<MessageCircle className="size-5" />} title="Dialectic Chat" />
        <EmptyState title="No workspace selected" description="Pick one from the top bar." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        icon={<MessageCircle className="size-5" />}
        title="Dialectic Chat"
        description="Ask Honcho what it knows about a peer. Powered by the /peers/{peer}/chat endpoint."
      />

      {/* Controls */}
      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="peer">Peer</Label>
            <select
              id="peer"
              value={peerId}
              onChange={(e) => setPeerId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-surface1 bg-surface0/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:border-mauve"
            >
              {!peerId && <option value="" disabled>Select a peer…</option>}
              {peerItems.map((p) => (
                <option key={p.id} value={p.id}>{p.id}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="level">Reasoning level</Label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
              className="flex h-10 w-full rounded-md border border-surface1 bg-surface0/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:border-mauve"
            >
              {REASONING_LEVELS.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transcript */}
      <Card className="mb-4">
        <CardContent className="space-y-4 py-5 min-h-[300px]">
          {history.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="size-5" />}
              title="Ask Honcho about this peer"
              description="Try: 'what does Chris prefer when reviewing code?' or 'summarise Alice's recent debug sessions'."
            />
          ) : (
            history.map((turn, i) => (
              <div key={i} className="space-y-2">
                <div className="rounded-lg bg-mauve/10 border border-mauve/20 px-3 py-2 text-sm text-text">
                  <Badge tone="mauve" className="mb-1.5">you</Badge>
                  <div className="whitespace-pre-wrap leading-relaxed">{turn.question}</div>
                </div>
                <div className="rounded-lg bg-surface0/60 border border-surface1/40 px-3 py-2 text-sm text-text">
                  <Badge tone="sapphire" className="mb-1.5">honcho</Badge>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {turn.loading ? <span className="flex items-center gap-2 text-subtext"><Spinner /> thinking…</span>
                      : turn.error ? <span className="text-red">{turn.error}</span>
                      : turn.answer || <span className="text-muted">(no answer)</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          placeholder={peerId ? `Ask Honcho about ${peerId}…` : "Pick a peer first"}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={!peerId || chat.isPending}
          className="flex-1"
        />
        <Button type="submit" disabled={!question.trim() || !peerId || chat.isPending}>
          <Send className="size-4" />
          Send
        </Button>
      </form>
    </>
  );
}

function extractAnswer(data: unknown): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.content === "string") return d.content;
    if (typeof d.message === "string") return d.message;
    if (typeof d.text === "string") return d.text;
    if (Array.isArray(d.messages) && d.messages[0]) {
      const m = d.messages[0] as Record<string, unknown>;
      if (typeof m.content === "string") return m.content;
    }
  }
  return JSON.stringify(data, null, 2);
}
