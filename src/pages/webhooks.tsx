import { Webhook, Terminal } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Spinner } from "@/components/ui/empty";
import { Link } from "@/lib/router";
import { useCurrentWorkspace } from "@/lib/workspace";
import { useWebhooks } from "@/lib/api/queries";

export function WebhooksPage() {
  const { current } = useCurrentWorkspace();
  const { data, isLoading, error } = useWebhooks(current ?? "");

  const items = Array.isArray(data) ? data : ((data as { items?: unknown[] } | undefined)?.items ?? []);

  if (!current) {
    return <>
      <PageHeader icon={<Webhook className="size-5" />} title="Webhooks" />
      <EmptyState title="No workspace selected" description="Pick one from the top bar." />
    </>;
  }

  return (
    <>
      <PageHeader
        icon={<Webhook className="size-5" />}
        title="Webhooks"
        description="Honcho can fire HTTP callbacks on events. Manage endpoints + test deliveries."
        actions={
          <Button asChild variant="secondary">
            <Link to="/api-explorer">
              <Terminal className="size-4" />
              Create in API Explorer
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Spinner /></div>
          ) : error ? (
            <EmptyState icon={<Webhook className="size-5" />} title="Couldn't list webhooks" description={(error as Error).message} />
          ) : items.length === 0 ? (
            <EmptyState icon={<Webhook className="size-5" />} title="No webhooks configured" description="Create one to receive event callbacks from Honcho." />
          ) : (
            <ul className="space-y-3">
              {items.map((w, i) => {
                const hook = w as { url?: string; endpoint_id?: string };
                return (
                  <li key={hook.endpoint_id ?? i} className="rounded-lg border border-surface1/40 bg-mantle/40 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Webhook className="size-4 text-mauve shrink-0" />
                      <code className="font-mono text-sm truncate">{hook.url}</code>
                    </div>
                    {hook.endpoint_id && <Badge tone="outline">{hook.endpoint_id.slice(0, 8)}</Badge>}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
