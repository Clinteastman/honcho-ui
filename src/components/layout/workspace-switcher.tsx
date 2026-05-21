import { useState } from "react";
import { Check, ChevronsUpDown, Folder, Lock } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import { useCurrentWorkspace } from "@/lib/workspace";
import { useWorkspaces } from "@/lib/api/queries";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/empty";

export function WorkspaceSwitcher() {
  const { current, setCurrent, locked } = useCurrentWorkspace();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useWorkspaces({});
  type Item = { id?: string; [k: string]: unknown };
  const items: Item[] = (data as { items?: Item[] } | undefined)?.items ?? [];

  const trigger = (
    <button
      type="button"
      className={cn(
        "flex items-center gap-2 px-2.5 h-8 rounded-md text-sm",
        "border border-surface1/60 bg-mantle/60 hover:bg-surface1/40 transition-colors",
        "min-w-[160px] max-w-[260px]",
      )}
      disabled={locked || isLoading}
    >
      <Folder className="size-3.5 text-mauve shrink-0" />
      <span className="truncate flex-1 text-left">
        {isLoading ? "…" : current || "Select workspace"}
      </span>
      {locked ? (
        <Lock className="size-3.5 text-muted shrink-0" />
      ) : (
        <ChevronsUpDown className="size-3.5 text-muted shrink-0" />
      )}
    </button>
  );

  if (locked) return trigger;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className={cn(
            "w-[280px] z-50 rounded-lg border border-surface1 bg-mantle/95 backdrop-blur shadow-2xl shadow-black/40",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          )}
        >
          <Command className="overflow-hidden rounded-lg">
            <div className="px-3 pt-2.5 pb-1 text-[10px] uppercase tracking-widest text-muted font-medium">
              Switch workspace
            </div>
            <CommandInput
              placeholder="Find workspace…"
              className="bg-transparent border-0 border-b border-surface1/60 outline-none px-3 py-2 text-sm w-full placeholder:text-muted"
            />
            <CommandList className="max-h-[300px] overflow-auto py-1">
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Spinner />
                </div>
              )}
              <CommandEmpty className="px-3 py-6 text-xs text-muted text-center">
                No workspaces found.
              </CommandEmpty>
              <CommandGroup>
                {items.map((ws) => {
                  const id = ws.id as string;
                  const isCurrent = current === id;
                  return (
                    <CommandItem
                      key={id}
                      value={id}
                      onSelect={(value: string) => {
                        setCurrent(value);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer rounded-sm mx-1",
                        "aria-selected:bg-surface1 aria-selected:text-text",
                      )}
                    >
                      <Folder className="size-3.5 text-muted" />
                      <span className="flex-1 truncate">{id}</span>
                      {isCurrent && <Check className="size-3.5 text-mauve" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
