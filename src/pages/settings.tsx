import { Settings, Globe, KeyRound, ShieldCheck, Github } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth, clearAuth } from "@/lib/auth";
import { toast } from "sonner";

export function SettingsPage() {
  const { config, decoded } = useAuth();

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
