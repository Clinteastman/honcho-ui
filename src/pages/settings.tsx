import { Settings, Globe, KeyRound, ShieldCheck, Github, Server, Brain, Cpu } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/empty";
import { useAuth, clearAuth } from "@/lib/auth";
import { useServerInfo } from "@/lib/api/queries";
import { toast } from "sonner";

export function SettingsPage() {
  const { config, decoded } = useAuth();
  const info = useServerInfo();

  if (!config) return null;

  return (
    <>
      <PageHeader
        icon={<Settings className="size-5" />}
        title="Settings"
        description="Connection details and token info."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-4 text-mauve" />
              Endpoint
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted mb-1">URL</div>
              <code className="font-mono text-sm break-all">{config.baseUrl}</code>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { clearAuth(); toast.success("Disconnected."); }}
              >
                Disconnect & change endpoint
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-4 text-mauve" />
              Token scope
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {decoded && (
              <>
                <div>
                  <Badge tone="mauve" className="mb-2"><ShieldCheck className="size-3" />{decoded.scope}</Badge>
                  <div className="text-sm text-text">{decoded.scopeLabel}</div>
                </div>
                <Separator />
                <dl className="space-y-2 text-sm">
                  {decoded.claims.w && (
                    <Field label="Workspace" value={<code className="font-mono">{decoded.claims.w}</code>} />
                  )}
                  {decoded.claims.p && (
                    <Field label="Peer" value={<code className="font-mono">{decoded.claims.p}</code>} />
                  )}
                  {decoded.claims.s && (
                    <Field label="Session" value={<code className="font-mono">{decoded.claims.s}</code>} />
                  )}
                  {decoded.claims.t && (
                    <Field label="Issued" value={decoded.claims.t} />
                  )}
                  {decoded.claims.exp && (
                    <Field label="Expires" value={String(decoded.claims.exp)} />
                  )}
                </dl>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="size-4 text-mauve" />
              Server deployment
              {info.data?.version && (
                <Badge tone="outline">v{info.data.version}</Badge>
              )}
            </CardTitle>
            <p className="text-xs text-subtext mt-1">
              What LLMs the connected Honcho is configured to use. Surfaced
              via <code className="font-mono">/v3/info</code> — a local extension
              on this deployment; cloud Honcho or older self-hosted versions
              may not expose it yet.
            </p>
          </CardHeader>
          <CardContent>
            {info.isLoading ? (
              <Spinner />
            ) : !info.data ? (
              <div className="text-sm text-subtext leading-relaxed">
                <code className="font-mono">/v3/info</code> isn't available on
                this Honcho instance. To enable, see the
                {" "}
                <a
                  className="text-mauve hover:underline"
                  href="https://github.com/Clinteastman/k12-homelab/tree/main/vps/honcho/patches"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  reference patch
                </a>
                {" "}or check whether your Honcho version added it natively.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(info.data.features ?? {}).map(([feat, cfg]) => (
                  <div
                    key={feat}
                    className="flex items-center justify-between gap-3 rounded-md border border-surface1/40 bg-mantle/40 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {feat === "embedding"
                        ? <Cpu className="size-3.5 text-sapphire shrink-0" />
                        : <Brain className="size-3.5 text-mauve shrink-0" />}
                      <span className="text-xs uppercase tracking-widest text-muted truncate">
                        {feat.replace(/_/g, " ")}
                      </span>
                    </div>
                    {cfg ? (
                      <div className="text-right min-w-0">
                        <div className="text-sm font-mono truncate">{cfg.model ?? "—"}</div>
                        {cfg.transport && (
                          <Badge tone="outline" className="mt-0.5">{cfg.transport}</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted">not configured</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="size-4 text-mauve" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-subtext leading-relaxed">
            <p>
              Honcho UI is an open-source admin built directly against the
              Honcho OpenAPI spec. It runs entirely in your browser — no
              backend, no telemetry, no third-party scripts.
            </p>
            <p>
              <a className="text-mauve hover:underline" href="https://github.com/Clinteastman/honcho-ui" target="_blank" rel="noreferrer noopener">
                github.com/Clinteastman/honcho-ui
              </a>
              {" · "}MIT licensed
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-xs uppercase tracking-widest text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
