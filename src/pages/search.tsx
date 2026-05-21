import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/empty";
import { useCurrentWorkspace } from "@/lib/workspace";
import { useWorkspaceSearch } from "@/lib/api/queries";

export function SearchPage() {
  const { current } = useCurrentWorkspace();
  const search = useWorkspaceSearch();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !query.trim()) return;
    search.mutate({ workspaceId: current, query: query.trim() });
  };

  const results = (search.data as { items?: unknown[] } | undefined)?.items ?? [];

  if (!current) {
    return (
      <>
        <PageHeader icon={<Search className="size-5" />} title="Search" />
        <EmptyState title="No workspace selected" description="Pick one from the top bar." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        icon={<Search className="size-5" />}
        title="Search"
        description="Semantic search across messages in the current workspace."
      />

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <Input
          placeholder="What are you looking for?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="flex-1"
        />
        <Button type="submit" disabled={!query.trim() || search.isPending}>
          {search.isPending ? <Spinner /> : <Search className="size-4" />}
          Search
        </Button>
      </form>

      <Card>
        <CardContent className="py-5">
          {!search.data && !search.isPending ? (
            <EmptyState icon={<Search className="size-5" />} title="Type a query to search" />
          ) : search.isPending ? (
            <div className="flex items-center justify-center py-12"><Spinner /></div>
          ) : results.length === 0 ? (
            <EmptyState icon={<Search className="size-5" />} title="No results" description={`Nothing matched "${query}".`} />
          ) : (
            <ul className="space-y-3">
              {results.map((r, i) => {
                const m = r as { content?: string; peer_id?: string; session_id?: string; score?: number };
                return (
                  <li key={i} className="rounded-lg border border-surface1/40 bg-mantle/40 p-3">
                    <p className="text-sm leading-relaxed">{m.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted font-mono">
                      {m.peer_id && <span>peer: {m.peer_id}</span>}
                      {m.session_id && <span>session: {m.session_id}</span>}
                      {m.score != null && <span className="text-mauve">score: {m.score.toFixed(3)}</span>}
                    </div>
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
