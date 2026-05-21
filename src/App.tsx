import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation, useNavigate, matchPath } from "@/lib/router";
import { LoginPage } from "@/pages/login";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/pages/dashboard";
import { WorkspacesPage } from "@/pages/workspaces";
import { PeersPage } from "@/pages/peers";
import { PeerDetailPage } from "@/pages/peer-detail";
import { SessionsPage } from "@/pages/sessions";
import { SessionDetailPage } from "@/pages/session-detail";
import { ChatPage } from "@/pages/chat";
import { ConclusionsPage } from "@/pages/conclusions";
import { SearchPage } from "@/pages/search";
import { WebhooksPage } from "@/pages/webhooks";
import { KeysPage } from "@/pages/keys";
import { SettingsPage } from "@/pages/settings";
import { ApiExplorerPage } from "@/pages/api-explorer";
import { NotFoundPage } from "@/pages/not-found";

const routes: Array<{ pattern: string; component: (params: Record<string, string>) => React.ReactNode }> = [
  { pattern: "/", component: () => <DashboardPage /> },
  { pattern: "/workspaces", component: () => <WorkspacesPage /> },
  { pattern: "/peers", component: () => <PeersPage /> },
  { pattern: "/peers/:peerId", component: (p) => <PeerDetailPage peerId={p.peerId!} /> },
  { pattern: "/sessions", component: () => <SessionsPage /> },
  { pattern: "/sessions/:sessionId", component: (p) => <SessionDetailPage sessionId={p.sessionId!} /> },
  { pattern: "/chat", component: () => <ChatPage /> },
  { pattern: "/conclusions", component: () => <ConclusionsPage /> },
  { pattern: "/search", component: () => <SearchPage /> },
  { pattern: "/webhooks", component: () => <WebhooksPage /> },
  { pattern: "/keys", component: () => <KeysPage /> },
  { pattern: "/settings", component: () => <SettingsPage /> },
  { pattern: "/api-explorer", component: () => <ApiExplorerPage /> },
];

export function App() {
  const { config, decoded } = useAuth();
  const path = useLocation();
  const navigate = useNavigate();

  // Bounce to /login if not authed (or token clearly invalid). Bounce to /
  // if authed and somehow on /login.
  useEffect(() => {
    if (!config && path !== "/login") navigate("/login", { replace: true });
    if (config && decoded && path === "/login") navigate("/", { replace: true });
  }, [config, decoded, path, navigate]);

  if (!config) return <LoginPage />;

  // Resolve the current route
  for (const { pattern, component } of routes) {
    const params = matchPath(pattern, path);
    if (params) {
      return <AppShell>{component(params)}</AppShell>;
    }
  }

  return <AppShell><NotFoundPage /></AppShell>;
}
