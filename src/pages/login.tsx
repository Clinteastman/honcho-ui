import { useState } from "react";
import { Eye, EyeOff, KeyRound, Globe, ShieldCheck, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { setAuth, normalizeBaseUrl } from "@/lib/auth";
import { decodeHonchoJWT } from "@/lib/jwt";
import { validateCurrentAuth } from "@/lib/api/queries";
import { toast } from "sonner";

const DEFAULT_BASE = "https://api.honcho.dev";

export function LoginPage() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [persistent, setPersistent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live JWT scope hint — informative but not blocking
  const decoded = token.length > 30 ? decodeHonchoJWT(token) : null;

  const isHttps = baseUrl.startsWith("https://");
  const isLocal = /(^https?:\/\/(localhost|127\.0\.0\.1|::1|0\.0\.0\.0))/i.test(baseUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = normalizeBaseUrl(baseUrl);
    const cleanToken = token.trim();
    if (!cleanToken) {
      setError("Token is required.");
      return;
    }
    if (!decoded) {
      setError("That doesn't look like a valid JWT.");
      return;
    }

    setBusy(true);
    try {
      // Provisionally set so the API client can read auth from storage.
      setAuth({ baseUrl: normalized, jwt: cleanToken, persistent });
      await validateCurrentAuth();
      toast.success("Connected to Honcho. Welcome.");
      // App component will route into the app on next render.
    } catch (err) {
      // Clear the bad creds we just wrote.
      const msg = err instanceof Error ? err.message : "Connection failed.";
      setAuth({ baseUrl: normalized, jwt: "", persistent });
      // Wipe.
      try { localStorage.removeItem("honcho-ui:auth/v1"); } catch { /* ignore */ }
      try { sessionStorage.removeItem("honcho-ui:auth/v1"); } catch { /* ignore */ }
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid place-items-center app-bg p-6">
      <div className="w-full max-w-md space-y-5">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid place-items-center size-12 rounded-2xl bg-mauve text-base shadow-lg shadow-mauve/30">
            <KeyRound className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Honcho UI</h1>
            <p className="text-sm text-subtext mt-1">
              An open-source admin for Honcho's memory layer.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Connect</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="baseUrl">Honcho endpoint</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
                  <Input
                    id="baseUrl"
                    name="baseUrl"
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.honcho.dev"
                    autoComplete="url"
                    hasLeftIcon
                    mono
                  />
                </div>
                <p className="text-[11px] text-muted leading-relaxed pt-0.5">
                  Cloud is <code className="font-mono text-subtext">api.honcho.dev</code>; for
                  self-hosted, paste your URL.{" "}
                  <code className="font-mono text-subtext">/v3</code> is stripped if you include it.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="token">API token (JWT)</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
                  <Input
                    id="token"
                    name="token"
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="eyJhbGciOi…"
                    hasLeftIcon
                    mono
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-muted hover:text-text hover:bg-surface1 transition-colors"
                    aria-label={showToken ? "Hide token" : "Show token"}
                  >
                    {showToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                {decoded && (
                  <div className="pt-1 flex items-center gap-2">
                    <Badge tone={decoded.scope === "admin" ? "mauve" : "sapphire"}>
                      <ShieldCheck className="size-3" />
                      {decoded.scopeLabel}
                    </Badge>
                    <span className="text-[11px] text-muted">Scope detected from token.</span>
                  </div>
                )}
              </div>

              {/* Persistence toggle */}
              <label className="flex items-start gap-2.5 text-xs text-subtext cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={persistent}
                  onChange={(e) => setPersistent(e.target.checked)}
                  className="mt-0.5 size-3.5 rounded border-surface2 bg-surface0 accent-mauve"
                />
                <span className="leading-relaxed">
                  <span className="text-text">Remember this token in this browser.</span>{" "}
                  Uncheck to forget on tab close (sessionStorage).
                </span>
              </label>

              {/* Security advisories */}
              {!isHttps && !isLocal && (
                <div className="flex items-start gap-2.5 rounded-md border border-peach/30 bg-peach/10 px-3 py-2.5 text-xs text-peach">
                  <ShieldCheck className="size-3.5 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">
                    This endpoint isn't HTTPS. Tokens sent in clear text can be intercepted.
                    Use HTTPS or a tunnel like Tailscale/CF Access.
                  </span>
                </div>
              )}

              {error && (
                <div className="rounded-md border border-red/30 bg-red/10 px-3 py-2.5 text-xs text-red">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Connecting…" : <><LogIn className="size-4" /> Connect</>}
              </Button>

              <Separator />

              <p className="text-[11px] text-muted leading-relaxed">
                <span className="text-subtext">Where does my token go?</span> It's stored
                in this browser's {persistent ? "localStorage" : "sessionStorage"}.
                Nothing is sent to any third party — every request goes directly to
                the endpoint above.
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted">
          <a
            href="https://github.com/Clinteastman/honcho-ui"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-subtext underline-offset-2 hover:underline"
          >
            View source on GitHub
          </a>
          {" · "}MIT licensed
        </p>
      </div>
    </div>
  );
}
