import type { ReactNode } from "react";
import { WorkspaceProvider } from "@/lib/workspace";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

/**
 * The frame that wraps every authenticated page: sidebar + top bar + main.
 * Page components are rendered as children.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen overflow-hidden app-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-7xl px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
