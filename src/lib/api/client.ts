import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./types.gen";
import { clearAuth, getAuth } from "../auth";

/**
 * Build a typed Honcho API client bound to the current auth.
 *
 * Each call to `makeClient()` reads auth fresh - we don't memoize, because
 * the token / base URL can change between calls (login, settings change,
 * token refresh) and a stale client would send the wrong header.
 *
 * On 401 the client clears auth (token's bad, force re-login). 403 is
 * NOT cleared (token's valid, scope insufficient).
 */
export function makeClient() {
  const auth = getAuth();
  if (!auth) throw new ApiError(401, "Not authenticated");

  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      request.headers.set("Authorization", `Bearer ${auth.jwt}`);
      request.headers.set("Accept", "application/json");
      return request;
    },
    async onResponse({ response }) {
      if (response.status === 401) {
        clearAuth();
      }
      return response;
    },
  };

  // Defense in depth: strip any trailing /vN from the stored base URL.
  // Generated paths already include the version (e.g. /v3/workspaces/list).
  // Without this, a stored baseUrl like ".../v3" would yield ".../v3/v3/...".
  const baseUrl = auth.baseUrl.replace(/\/v\d+$/, "");
  const client = createClient<paths>({ baseUrl });
  client.use(authMiddleware);
  return client;
}

export class ApiError extends Error {
  constructor(public status: number, public message: string, public detail?: unknown) {
    super(message);
  }
}

/** Helper to surface FastAPI's `{detail: ...}` error shape consistently. */
export async function unwrap<T>(
  res: { data?: T; error?: unknown; response: Response }
): Promise<T> {
  if (res.data !== undefined) return res.data as T;
  const status = res.response.status;
  const errObj = res.error as { detail?: string } | undefined;
  const message =
    typeof errObj?.detail === "string"
      ? errObj.detail
      : `HTTP ${status} ${res.response.statusText || ""}`.trim();
  throw new ApiError(status, message, res.error);
}
