import { Lightbulb, Search } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, Spinner } from "@/components/ui/empty";
import { useCurrentWorkspace } from "@/lib/workspace";
import { useConclusions } from "@/lib/api/queries";

export function ConclusionsPage() {
  const { current } = useCurrentWorkspace();
  const [filter, setFilter] = useState("");
  const { data, isLoading, error } = useConclusions(current ?? "", {});

  type Conc = { id?: string; content?: string; peer_id?: string; created_at?: string };
  const items: Conc[] = ((data as { items?: Conc[] } | undefined)?.items ?? []).filter((c) =>
    !filter || (c.content ?? "").toLowerCase().includes(filter.toLowerCase()),
  );

  if (!current) {
    return (
      <>
        <PageHeader icon={<Lightbulb className="size-5" />} title="Conclusions" />
        <EmptyState title="No workspace selected" description="Pick one from the top bar." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        icon={<Lightbulb className="size-5" />}
        title="Conclusions"
        description="Insights Honcho has drawn from observation. Curated team knowledge lives here."
      />

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
        <Input placeholder="Filter conclusions…" value={filter} onChange={(e) => setFilter(e.target.value)} hasLeftIcon />
      </div>

      <Card>
        <CardContent className="py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Spinner /></div>
          ) : error ? (
            <EmptyState icon={<Lightbulb className="size-5" />} title="Couldn't list conclusions" description={(error as Error).message} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Lightbulb className="size-5" />}
              title="No conclusions yet"
              description="Honcho creates these from extended observation, or you can create them manually via the API."
            />
          ) : (
            <ul className="space-y-2.5">
              {items.map((c) => (
                <li key={c.id} className="flex gap-3 rounded-lg border border-surface1/40 bg-mantle/40 p-3">
                  <Lightbulb className="size-4 text-peach shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted">
                      {c.peer_id && <span className="font-mono">peer: {c.peer_id}</span>}
                      {c.created_at && <span>{new Date(c.created_at).toLocaleString()}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
