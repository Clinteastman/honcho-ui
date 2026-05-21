import { decodeJwt } from "jose";

export interface HonchoJWTClaims {
  /** timestamp string (Honcho's `t` claim, ISO-8601). */
  t?: string;
  /** expiration timestamp string. */
  exp?: string | number;
  /** admin flag. */
  ad?: boolean;
  /** workspace scope. */
  w?: string;
  /** peer scope. */
  p?: string;
  /** session scope. */
  s?: string;
}

export interface DecodedJWT {
  raw: string;
  claims: HonchoJWTClaims;
  scope: "admin" | "workspace" | "peer" | "session" | "unscoped";
  scopeLabel: string;
}

/**
 * Decode a Honcho JWT *without verifying signature* - we don't have the
 * server's secret in the browser; the server enforces auth. We just need
 * to know the scope so the UI can hide/show features appropriately.
 *
 * Returns null on any parse error - the caller treats it as "invalid token,
 * route to login".
 */
export function decodeHonchoJWT(token: string): DecodedJWT | null {
  if (!token || token.length < 20) return null;
  try {
    const claims = decodeJwt(token) as HonchoJWTClaims;
    let scope: DecodedJWT["scope"] = "unscoped";
    let scopeLabel = "unscoped";

    if (claims.ad === true) {
      scope = "admin";
      scopeLabel = "admin";
    } else if (claims.s) {
      scope = "session";
      scopeLabel = `session: ${claims.s}`;
    } else if (claims.p) {
      scope = "peer";
      scopeLabel = `peer: ${claims.p}${claims.w ? ` in ${claims.w}` : ""}`;
    } else if (claims.w) {
      scope = "workspace";
      scopeLabel = `workspace: ${claims.w}`;
    }

    return { raw: token, claims, scope, scopeLabel };
  } catch {
    return null;
  }
}

/** Whether a decoded JWT is currently expired (server is authoritative; this
 *  is a UI nicety to warn before sending). */
export function isExpired(decoded: DecodedJWT | null): boolean {
  if (!decoded?.claims.exp) return false;
  const exp = typeof decoded.claims.exp === "number"
    ? decoded.claims.exp
    : Date.parse(decoded.claims.exp) / 1000;
  if (!Number.isFinite(exp)) return false;
  return exp * 1000 < Date.now();
}
