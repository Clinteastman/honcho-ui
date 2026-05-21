import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./auth";

/**
 * Tracks the currently-selected workspace.
 *
 * Source of truth precedence (highest first):
 *   1. JWT scope (`w` claim) — if the token is workspace-scoped, the
 *      selector is locked to that workspace.
 *   2. localStorage (persists across reloads).
 *   3. null until the user picks one.
 */
const STORAGE_KEY = "honcho-ui:current-workspace/v1";

interface WorkspaceCtxValue {
  current: string | null;
  setCurrent: (id: string | null) => void;
  /** True when the JWT scope pins the workspace and the user can't switch. */
  locked: boolean;
}

const Ctx = createContext<WorkspaceCtxValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { decoded } = useAuth();
  const jwtWorkspace = decoded?.claims.w ?? null;
  const locked = !!jwtWorkspace;

  const [current, setCurrentRaw] = useState<string | null>(() => {
    return jwtWorkspace || localStorage.getItem(STORAGE_KEY) || null;
  });

  // Force-pin to JWT workspace when the token is scoped.
  useEffect(() => {
    if (jwtWorkspace && jwtWorkspace !== current) {
      setCurrentRaw(jwtWorkspace);
    }
  }, [jwtWorkspace, current]);

  const setCurrent = (id: string | null) => {
    if (locked) return; // ignore writes when locked
    setCurrentRaw(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({ current, setCurrent, locked }), [current, locked]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrentWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCurrentWorkspace() outside <WorkspaceProvider>");
  return ctx;
}
