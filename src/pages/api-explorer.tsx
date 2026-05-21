import { useEffect, useMemo, useState } from "react";
import { Terminal, Send, ChevronRight, Copy, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState, Spinner } from "@/components/ui/empty";
import { getAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * API Explorer — the safety net for "every endpoint surfaced".
 *
 * Loads the live OpenAPI spec from the configured Honcho instance and renders
 * every endpoint with a try-it-out form. Path parameters become inputs;
 * request bodies become a JSON textarea (Honcho's schemas are mostly free-
 * form objects so a structured form would be overkill).
 *
 * Responses are shown with status code, headers, and JSON body. Errors are
 * surfaced clearly so the user knows whether their token / payload was the
 * problem.
 */
interface OpenAPISpec {
  paths: Record<string, Record<string, Operation>>;
  components?: { schemas?: Record<string, unknown> };
  info?: { version?: string };
}

interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: {
    required?: boolean;
    content?: { "application/json"?: { schema?: { example?: unknown } } };
  };
}

interface Parameter {
  name: string;
  in: "path" | "query" | "header";
  required?: boolean;
  description?: string;
  schema?: { type?: string; default?: unknown };
}

interface SelectedEndpoint {
  path: string;
  method: string;
  op: Operation;
}

const METHOD_COLORS: Record<string, "green" | "sapphire" | "peach" | "red" | "mauve" | "neutral"> = {
  GET: "sapphire",
  POST: "green",
  PUT: "peach",
  PATCH: "peach",
  DELETE: "red",
};

export function ApiExplorerPage() {
  const auth = getAuth();
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedEndpoint | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!auth) return;
    const root = auth.baseUrl.replace(/\/v\d+$/, "");
    fetch(root + "/openapi.json", { headers: { Accept: "application/json" } })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((s) => setSpec(s as OpenAPISpec))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [auth]);

  // Group endpoints by tag
  const groups = useMemo(() => {
    if (!spec) return [];
    const byTag = new Map<string, Array<SelectedEndpoint>>();
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        if (!["get", "post", "put", "delete", "patch"].includes(method)) continue;
        const M = method.toUpperCase();
        const tag = (op.tags?.[0] ?? "other").toLowerCase();
        if (search) {
          const hay = `${M} ${path} ${op.summary ?? ""} ${op.operationId ?? ""}`.toLowerCase();
          if (!hay.includes(search.toLowerCase())) continue;
        }
        if (!byTag.has(tag)) byTag.set(tag, []);
        byTag.get(tag)!.push({ path, method: M, op });
      }
    }
    return Array.from(byTag.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tag, items]) => ({ tag, items }));
  }, [spec, search]);

  if (!auth) return null;

  return (
    <>
      <PageHeader
        icon={<Terminal className="size-5" />}
        title="API Explorer"
        description="Every endpoint Honcho exposes, with a try-it-out form. Generated live from the OpenAPI spec."
        actions={spec?.info?.version && <Badge tone="mauve">v{spec.info.version}</Badge>}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16"><Spinner /></div>
      ) : error ? (
        <EmptyState icon={<Terminal className="size-5" />} title="Couldn't load OpenAPI spec" description={error} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 min-h-[60vh]">
          <Card className="lg:sticky lg:top-4 lg:max-h-[80vh] flex flex-col">
            <div className="p-3 border-b border-surface1/40">
              <Input
                placeholder="Filter endpoints…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <ScrollArea className="flex-1">
              <div className="py-2">
                {groups.map(({ tag, items }) => (
                  <div key={tag} className="mb-2">
                    <div className="px-3 py-1 text-[10px] uppercase tracking-widest text-muted font-medium sticky top-0 bg-mantle/95 backdrop-blur">
                      {tag}
                    </div>
                    {items.map((e) => (
                      <button
                        key={`${e.method} ${e.path}`}
                        onClick={() => setSelected(e)}
                        className={cn(
                          "w-full text-left px-3 py-2 hover:bg-surface1/40 transition-colors",
                          "flex items-start gap-2 text-xs",
                          selected?.method === e.method && selected.path === e.path && "bg-surface1/80",
                        )}
                      >
                        <Badge tone={METHOD_COLORS[e.method] ?? "neutral"} className="font-mono shrink-0">
                          {e.method}
                        </Badge>
                        <span className="font-mono text-subtext break-all leading-tight">
                          {e.path.replace("/v3", "")}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {selected ? (
            <EndpointForm selected={selected} baseUrl={auth.baseUrl} jwt={auth.jwt} />
          ) : (
            <Card>
              <CardContent className="py-16">
                <EmptyState
                  icon={<ChevronRight className="size-5" />}
                  title="Pick an endpoint to begin"
                  description={`${groups.reduce((n, g) => n + g.items.length, 0)} endpoints available.`}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

function EndpointForm({
  selected,
  baseUrl,
  jwt,
}: {
  selected: SelectedEndpoint;
  baseUrl: string;
  jwt: string;
}) {
  const { path, method, op } = selected;

  // Path params
  const pathParams = (op.parameters ?? []).filter((p) => p.in === "path");
  const queryParams = (op.parameters ?? []).filter((p) => p.in === "query");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  // Body editor
  const bodyExample = op.requestBody?.content?.["application/json"]?.schema?.example;
  const [body, setBody] = useState<string>("");
  const [response, setResponse] = useState<{ status: number; body: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset state when endpoint changes
  useEffect(() => {
    setParamValues({});
    setBody(bodyExample ? JSON.stringify(bodyExample, null, 2) : op.requestBody ? "{}" : "");
    setResponse(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, method]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResponse(null);
    try {
      // Substitute path params
      let url = baseUrl.replace(/\/v3$/, "") + path;
      for (const p of pathParams) {
        const v = paramValues[p.name] ?? "";
        url = url.replace(`{${p.name}}`, encodeURIComponent(v));
      }
      // Append query params
      const qp = new URLSearchParams();
      for (const p of queryParams) {
        const v = paramValues[p.name];
        if (v) qp.set(p.name, v);
      }
      if ([...qp].length) url += "?" + qp.toString();

      const init: RequestInit = {
        method,
        headers: {
          "Authorization": `Bearer ${jwt}`,
          "Accept": "application/json",
          ...(body && method !== "GET" && method !== "DELETE" ? { "Content-Type": "application/json" } : {}),
        },
      };
      if (body && method !== "GET" && method !== "DELETE") {
        try { JSON.parse(body); }
        catch { throw new Error("Body is not valid JSON"); }
        init.body = body;
      }
      const res = await fetch(url, init);
      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* leave as-is */ }
      setResponse({ status: res.status, body: pretty });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="py-5 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone={METHOD_COLORS[method] ?? "neutral"} className="font-mono">{method}</Badge>
            <code className="font-mono text-sm">{path}</code>
          </div>
          {op.summary && <h2 className="text-base font-semibold mt-1">{op.summary}</h2>}
          {op.description && (
            <p className="text-sm text-subtext mt-1 leading-relaxed whitespace-pre-line">
              {op.description}
            </p>
          )}
        </div>

        <Separator />

        <form onSubmit={handleSubmit} className="space-y-4">
          {pathParams.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-widest text-muted">Path parameters</div>
              {pathParams.map((p) => (
                <div key={p.name} className="space-y-1.5">
                  <Label htmlFor={`p-${p.name}`}>
                    {p.name}
                    {p.required && <span className="text-red ml-1">*</span>}
                  </Label>
                  <Input
                    id={`p-${p.name}`}
                    mono
                    value={paramValues[p.name] ?? ""}
                    onChange={(e) => setParamValues((v) => ({ ...v, [p.name]: e.target.value }))}
                    placeholder={p.description ?? p.schema?.type}
                  />
                </div>
              ))}
            </div>
          )}

          {queryParams.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-widest text-muted">Query parameters</div>
              {queryParams.map((p) => (
                <div key={p.name} className="space-y-1.5">
                  <Label htmlFor={`q-${p.name}`}>
                    {p.name}
                    {p.required && <span className="text-red ml-1">*</span>}
                  </Label>
                  <Input
                    id={`q-${p.name}`}
                    mono
                    value={paramValues[p.name] ?? ""}
                    onChange={(e) => setParamValues((v) => ({ ...v, [p.name]: e.target.value }))}
                    placeholder={p.description ?? p.schema?.type}
                  />
                </div>
              ))}
            </div>
          )}

          {op.requestBody && (
            <div className="space-y-1.5">
              <Label htmlFor="body">Request body (JSON)</Label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={Math.min(20, Math.max(4, body.split("\n").length + 1))}
                className="flex w-full rounded-md border border-surface1 bg-crust/60 px-3 py-2 text-xs font-mono leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:border-mauve resize-y"
                spellCheck={false}
              />
            </div>
          )}

          <Button type="submit" disabled={busy}>
            {busy ? <Spinner /> : <Send className="size-4" />}
            Send request
          </Button>
        </form>

        {response && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-widest text-muted">Response</span>
                  <Badge tone={response.status < 400 ? "green" : response.status < 500 ? "peach" : "red"}>
                    {response.status}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(response.body);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? <Check className="size-3.5 text-green" /> : <Copy className="size-3.5" />}
                  Copy
                </Button>
              </div>
              <pre className="text-xs font-mono whitespace-pre-wrap break-all p-3 rounded-md bg-crust/60 border border-surface1 max-h-[400px] overflow-auto">
                {response.body}
              </pre>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
