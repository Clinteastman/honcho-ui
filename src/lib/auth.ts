import { useEffect, useSyncExternalStore } from "react";
import { decodeHonchoJWT, type DecodedJWT } from "./jwt";

/* ---------------------------------------------------------------------------
   Auth state for the UI.

   What we store:
     - baseUrl: the Honcho API root (e.g. https://honcho.mossom.co.uk/v3).
     - jwt: bearer token.

   What we DO NOT store:
     - The decoded JWT claims (we re-derive from `jwt` on read - source of
       truth is one place).
     - Anything in URL params or cookies.

   Storage backend:
     - localStorage by default. Toggleable to sessionStorage via the login
       form so paranoid users can opt into "forget on tab close".
     - Token is NOT base64-encoded or otherwise "obfuscated" - that's
       theater. The real defense is CSP + HTTPS + proxy auth in front.
--------------------------------------------------------------------------- */

const STORAGE_KEY = "honcho-ui:auth/v1";

export interface StoredAuth {
  baseUrl: string;
  jwt: string;
  /** which storage was used - so we know where to remove from on logout */
  persistent: boolean;
}

export interface AuthState {
  config: StoredAuth | null;
  decoded: DecodedJWT | null;
}

function readFromStorage(storage: Storage): StoredAuth | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (typeof v?.baseUrl === "string" && typeof v?.jwt === "string") {
      return { baseUrl: v.baseUrl, jwt: v.jwt, persistent: v.persistent !== false };
    }
  } catch { /* ignore */ }
  return null;
}

function readAuth(): StoredAuth | null {
  return readFromStorage(localStorage) ?? readFromStorage(sessionStorage);
}

/* --- subscribe/snapshot store for useSyncExternalStore -------------------

   getSnapshot() must be referentially stable when the underlying data
   hasn't changed - otherwise useSyncExternalStore detects a "change" on
   every render and triggers an infinite re-render loop (React error #185).

   Cache the snapshot by a string key derived from the stored auth, and
   invalidate the cache only when notify() fires.
------------------------------------------------------------------------ */

const subscribers = new Set<() => void>();
let cachedSnapshot: AuthState | null = null;

function notify() {
  cachedSnapshot = null;
  subscribers.forEach((cb) => cb());
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => { subscribers.delete(cb); };
}

function getSnapshot(): AuthState {
  if (cachedSnapshot) return cachedSnapshot;
  const config = readAuth();
  cachedSnapshot = {
    config,
    decoded: config ? decodeHonchoJWT(config.jwt) : null,
  };
  return cachedSnapshot;
}

/**
 * Cross-tab synchronization: storage events fire in OTHER tabs when this
 * tab calls localStorage.setItem. One global listener; we attach lazily
 * the first time anything reads auth.
 */
let storageListenerInstalled = false;
function ensureStorageListener() {
  if (storageListenerInstalled || typeof window === "undefined") return;
  storageListenerInstalled = true;
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) notify();
  });
}

/** Hook into the auth state. Re-renders subscribers when storage changes. */
export function useAuth(): AuthState {
  // Register the storage listener exactly once across all components.
  useEffect(ensureStorageListener, []);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Imperative read of the current token (e.g. from inside an API call). */
export function getAuth(): StoredAuth | null {
  return readAuth();
}

/** Save and broadcast. */
export function setAuth(next: StoredAuth) {
  // Tidy any prior storage in the *other* backend.
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  const target = next.persistent ? localStorage : sessionStorage;
  target.setItem(STORAGE_KEY, JSON.stringify(next));
  notify();
}

/** Clear auth and broadcast. */
export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  notify();
}

/** Normalize a user-entered base URL: strip trailing slash, add /v3 if missing. */
export function normalizeBaseUrl(input: string): string {
  let v = input.trim();
  if (!v) return v;
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  v = v.replace(/\/+$/, "");
  // Add /v3 unless they explicitly included a version
  if (!/\/v\d+$/.test(v)) v = v + "/v3";
  return v;
}
