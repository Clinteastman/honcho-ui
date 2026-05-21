/**
 * TanStack Query hooks per Honcho resource.
 *
 * These are thin wrappers around the typed client. They return TanStack
 * Query results (data, isLoading, error). Mutations expose mutateAsync
 * so callers can await them in form-submit handlers.
 *
 * Query keys are structured: [resource, scopeArgs...] for cache invalidation.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { makeClient, unwrap } from "./client";

/* --------------------------------------------------------------- workspaces */

/**
 * Body shape for Honcho's POST /list endpoints. Spec only defines `filters`
 * as part of the body; pagination (if any) is server-controlled. Extra
 * fields are accepted at the HTTP level but ignored by the server.
 */
export interface ListBody {
  filters?: Record<string, unknown>;
}

export function useWorkspaces(body: ListBody = {}, opts?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: ["workspaces", body],
    queryFn: async () => {
      const c = makeClient();
      return unwrap(await c.POST("/v3/workspaces/list", { body }));
    },
    ...(opts ?? {}),
  });
}

export function useWorkspace(workspaceId: string, opts?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      const c = makeClient();
      return unwrap(
        await c.POST("/v3/workspaces", {
          body: { id: workspaceId, metadata: {} },
        }),
      );
    },
    enabled: !!workspaceId,
    ...(opts ?? {}),
  });
}

export function useUpdateWorkspace(opts?: UseMutationOptions<unknown, Error, { workspaceId: string; body: Record<string, unknown> }>) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { workspaceId: string; body: Record<string, unknown> }>({
    mutationFn: async ({ workspaceId, body }) => {
      const c = makeClient();
      return unwrap(
        await c.PUT("/v3/workspaces/{workspace_id}", {
          params: { path: { workspace_id: workspaceId } },
          body: body as never,
        }),
      );
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["workspace", v.workspaceId] });
      qc.invalidateQueries({ queryKey: ["workspaces"] });
    },
    ...(opts ?? {}),
  });
}

export function useDeleteWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const c = makeClient();
      return unwrap(
        await c.DELETE("/v3/workspaces/{workspace_id}", {
          params: { path: { workspace_id: workspaceId } },
        }),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

export function useWorkspaceSearch() {
  return useMutation({
    mutationFn: async ({ workspaceId, query }: { workspaceId: string; query: string }) => {
      const c = makeClient();
      return unwrap(
        await c.POST("/v3/workspaces/{workspace_id}/search", {
          params: { path: { workspace_id: workspaceId } },
          body: { query } as never,
        }),
      );
    },
  });
}

/* -------------------------------------------------------------------- peers */

export function usePeers(workspaceId: string, body: ListBody = {}) {
  return useQuery({
    queryKey: ["peers", workspaceId, body],
    queryFn: async () => {
      const c = makeClient();
      return unwrap(
        await c.POST("/v3/workspaces/{workspace_id}/peers/list", {
          params: { path: { workspace_id: workspaceId } },
          body,
        }),
      );
    },
    enabled: !!workspaceId,
  });
}

export function usePeer(workspaceId: string, peerId: string) {
  return useQuery({
    queryKey: ["peer", workspaceId, peerId],
    queryFn: async () => {
      const c = makeClient();
      return unwrap(
        await c.POST("/v3/workspaces/{workspace_id}/peers", {
          params: { path: { workspace_id: workspaceId } },
          body: { id: peerId } as never,
        }),
      );
    },
    enabled: !!workspaceId && !!peerId,
  });
}

export function usePeerRepresentation(
  workspaceId: string,
  peerId: string,
  body: Record<string, unknown> = {},
) {
  return useQuery({
    queryKey: ["peer-representation", workspaceId, peerId, body],
    queryFn: async () => {
      const c = makeClient();
      return unwrap(
        await c.POST(
          "/v3/workspaces/{workspace_id}/peers/{peer_id}/representation",
          {
            params: { path: { workspace_id: workspaceId, peer_id: peerId } },
            body: body as never,
          },
        ),
      );
    },
    enabled: !!workspaceId && !!peerId,
  });
}

export function usePeerChat() {
  return useMutation({
    mutationFn: async (args: {
      workspaceId: string;
      peerId: string;
      body: Record<string, unknown>;
    }) => {
      const c = makeClient();
      return unwrap(
        await c.POST(
          "/v3/workspaces/{workspace_id}/peers/{peer_id}/chat",
          {
            params: { path: { workspace_id: args.workspaceId, peer_id: args.peerId } },
            body: args.body as never,
          },
        ),
      );
    },
  });
}

/* ----------------------------------------------------------------- sessions */

export function useSessions(workspaceId: string, body: ListBody = {}) {
  return useQuery({
    queryKey: ["sessions", workspaceId, body],
    queryFn: async () => {
      const c = makeClient();
      return unwrap(
        await c.POST("/v3/workspaces/{workspace_id}/sessions/list", {
          params: { path: { workspace_id: workspaceId } },
          body,
        }),
      );
    },
    enabled: !!workspaceId,
  });
}

export function useSession(workspaceId: string, sessionId: string) {
  return useQuery({
    queryKey: ["session", workspaceId, sessionId],
    queryFn: async () => {
      const c = makeClient();
      return unwrap(
        await c.POST("/v3/workspaces/{workspace_id}/sessions", {
          params: { path: { workspace_id: workspaceId } },
          body: { id: sessionId } as never,
        }),
      );
    },
    enabled: !!workspaceId && !!sessionId,
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, sessionId }: { workspaceId: string; sessionId: string }) => {
      const c = makeClient();
      return unwrap(
        await c.DELETE("/v3/workspaces/{workspace_id}/sessions/{session_id}", {
          params: { path: { workspace_id: workspaceId, session_id: sessionId } },
        }),
      );
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["sessions", v.workspaceId] }),
  });
}

/* ----------------------------------------------------------------- messages */

export function useMessages(workspaceId: string, sessionId: string, body: ListBody = {}) {
  return useQuery({
    queryKey: ["messages", workspaceId, sessionId, body],
    queryFn: async () => {
      const c = makeClient();
      return unwrap(
        await c.POST(
          "/v3/workspaces/{workspace_id}/sessions/{session_id}/messages/list",
          {
            params: { path: { workspace_id: workspaceId, session_id: sessionId } },
            body,
          },
        ),
      );
    },
    enabled: !!workspaceId && !!sessionId,
  });
}

/* -------------------------------------------------------------- conclusions */

export function useConclusions(workspaceId: string, body: ListBody = {}) {
  return useQuery({
    queryKey: ["conclusions", workspaceId, body],
    queryFn: async () => {
      const c = makeClient();
      return unwrap(
        await c.POST("/v3/workspaces/{workspace_id}/conclusions/list", {
          params: { path: { workspace_id: workspaceId } },
          body,
        }),
      );
    },
    enabled: !!workspaceId,
  });
}

/* ----------------------------------------------------------------- webhooks */

export function useWebhooks(workspaceId: string) {
  return useQuery({
    queryKey: ["webhooks", workspaceId],
    queryFn: async () => {
      const c = makeClient();
      return unwrap(
        await c.GET("/v3/workspaces/{workspace_id}/webhooks", {
          params: { path: { workspace_id: workspaceId } },
        }),
      );
    },
    enabled: !!workspaceId,
  });
}

/* --------------------------------------------------------------------- meta */

/**
 * Validate the current JWT by calling a benign endpoint. Used at login to
 * confirm the token + base URL are good before we route into the app.
 */
export async function validateCurrentAuth() {
  const c = makeClient();
  // /v3/workspaces/list is allowed for admin OR returns at minimum the
  // workspace the token is scoped to. Cheap, no side effects.
  const res = await c.POST("/v3/workspaces/list", { body: {} });
  if (res.error) {
    const status = res.response.status;
    throw new Error(
      status === 401
        ? "Token rejected by Honcho (401). Re-mint and try again."
        : status === 403
        ? "Token doesn't have scope for /workspaces/list. Token may still be valid for narrower endpoints."
        : `Connection failed (HTTP ${status}).`,
    );
  }
  return res.data;
}
