import { useState } from "react";
import { Key, Copy, Check, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { makeClient, unwrap } from "@/lib/api/client";
import { toast } from "sonner";

/**
 * Keys page — mint scoped JWTs via POST /v3/keys. Admin-only on the server,
 * but we surface the form regardless and let the server reject.
 *
 * Reasoning: this is the single most consequential endpoint in the API.
 * It deserves a careful UI with explicit scope selection and a one-time-show
 * for the resulting token.
 */
export function KeysPage() {
  const { decoded } = useAuth();
  const isAdmin = decoded?.scope === "admin";

  const [workspace, setWorkspace] = useState("");
  const [peer, setPeer] = useState("");
  const [session, setSession] = useState("");
  const [issuedJwt, setIssuedJwt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setIssuedJwt(null);
    try {
      const c = makeClient();
      const body: Record<string, unknown> = {};
      if (workspace) body.workspace_id = workspace;
      if (peer) body.peer_id = peer;
      if (session) body.session_id = session;

      const raw = await unwrap<unknown>(
        await c.POST("/v3/keys", { body: body as never }),
      );
      const data = raw as { key?: string; token?: string; jwt?: string };
      const jwt = data.key ?? data.token ?? data.jwt;
      if (!jwt) {
        toast.error("Server didn't return a token");
        return;
      }
      setIssuedJwt(jwt);
      toast.success("Token minted. Copy it now - it won't be shown again.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mint token");
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = () => {
    if (!issuedJwt) return;
    navigator.clipboard.writeText(issuedJwt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <PageHeader
        icon={<Key className="size-5" />}
        title="API Keys"
        description="Mint scoped JWTs for agents and team members. All claims are optional - leave blank for unscoped."
      />

      {!isAdmin && (
        <Card className="mb-4 border-peach/40 bg-peach/5">
          <CardContent className="flex items-start gap-2.5 py-3">
            <AlertTriangle className="size-4 text-peach shrink-0 mt-0.5" />
            <div className="text-sm text-text leading-relaxed">
              Minting new tokens is an admin operation. Your current token is{" "}
              <Badge tone="sapphire">{decoded?.scopeLabel ?? "unscoped"}</Badge>{" "}
              - the server will likely refuse this request.
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardContent className="py-5">
            <form onSubmit={handleMint} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="workspace">Workspace ID</Label>
                <Input id="workspace" mono value={workspace} onChange={(e) => setWorkspace(e.target.value)} placeholder="e.g. work" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="peer">Peer ID</Label>
                <Input id="peer" mono value={peer} onChange={(e) => setPeer(e.target.value)} placeholder="e.g. alice" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="session">Session ID</Label>
                <Input id="session" mono value={session} onChange={(e) => setSession(e.target.value)} placeholder="optional" />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Minting…" : "Mint token"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-5">
            <Label className="mb-2 block">Issued token</Label>
            {issuedJwt ? (
              <>
                <div className="relative">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all p-3 pr-12 rounded-md bg-crust/60 border border-surface1 text-subtext">
                    {issuedJwt}
                  </pre>
                  <button
                    onClick={handleCopy}
                    aria-label="Copy"
                    className="absolute right-2 top-2 p-1.5 rounded text-muted hover:text-text hover:bg-surface1 transition-colors"
                  >
                    {copied ? <Check className="size-3.5 text-green" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted mt-2 leading-relaxed">
                  Save this somewhere safe. The full token won't be shown again - we
                  don't store it.
                </p>
              </>
            ) : (
              <div className="text-xs text-muted py-3">Fill in the form and click "Mint token".</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
