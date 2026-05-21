/**
 * Tiny hash-based router. ~70 lines, zero deps beyond React.
 *
 * Why hash and not history?
 *   - Hash works on ANY static host with no server config. The repo is
 *     designed to be cloned + deployed by other people, who shouldn't have
 *     to know about SPA fallback redirects.
 *   - URLs become #/peers/chris instead of /peers/chris. Not pretty,
 *     but admin tools don't typically need shareable URLs.
 *
 * Supports:
 *   - useLocation() -> current path (string)
 *   - useNavigate() -> imperative navigation
 *   - <Link to="..."> -> anchor element with active highlight support
 *   - Route matching with simple :param placeholders
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface RouterContextValue {
  path: string;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

function readPath(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || "/";
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(readPath);

  useEffect(() => {
    const onChange = () => setPath(readPath());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
    const target = to.startsWith("/") ? to : "/" + to;
    const next = "#" + target;
    if (window.location.hash === next) return;
    if (opts?.replace) {
      window.history.replaceState(null, "", next);
      setPath(target);
    } else {
      window.location.hash = next;
    }
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useCtx() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter() outside <RouterProvider>");
  return ctx;
}

export const useLocation = () => useCtx().path;
export const useNavigate = () => useCtx().navigate;

/** Match a pattern with :params against the current path. Returns params,
 *  or null if no match. */
export function matchPath(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const pSeg = pattern.split("/").filter(Boolean);
  const aSeg = path.split("/").filter(Boolean);
  if (pSeg.length !== aSeg.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pSeg.length; i++) {
    const p = pSeg[i];
    const a = aSeg[i];
    if (p.startsWith(":")) {
      params[p.slice(1)] = decodeURIComponent(a);
    } else if (p !== a) {
      return null;
    }
  }
  return params;
}

/** Hook: returns params if the current path matches `pattern`, else null. */
export function useParams(pattern: string) {
  const path = useLocation();
  return useMemo(() => matchPath(pattern, path), [pattern, path]);
}

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  replace?: boolean;
}

export function Link({ to, replace, onClick, children, ...rest }: LinkProps) {
  const navigate = useNavigate();
  return (
    <a
      href={"#" + (to.startsWith("/") ? to : "/" + to)}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        navigate(to, { replace });
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
