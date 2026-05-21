# Contributing to Honcho UI

Thanks for considering a contribution!

## Quick start

```bash
git clone https://github.com/Clinteastman/honcho-ui.git
cd honcho-ui
npm install
npm run dev
```

Connect the dev server to a real Honcho instance via the login screen
(you can use `https://api.honcho.dev` with a Honcho cloud key, or your
own self-hosted instance).

## Project layout

```
src/
├── lib/
│   ├── api/
│   │   ├── client.ts      # typed fetch wrapper bound to current auth
│   │   ├── queries.ts     # TanStack Query hooks per resource
│   │   └── types.gen.ts   # generated from /openapi.json (gitignored)
│   ├── auth.ts            # JWT storage + cross-tab sync
│   ├── jwt.ts             # client-side JWT decoding (no verification)
│   ├── router.tsx         # hash-based router (deliberately tiny)
│   └── workspace.tsx      # current-workspace context
├── components/
│   ├── ui/                # primitives: button, card, input, dialog, ...
│   └── layout/            # sidebar, top bar, page header, switcher
├── pages/                 # one file per top-level route
├── styles.css             # Tailwind v4 + Catppuccin tokens
├── App.tsx                # route table
└── main.tsx               # entry, providers
```

## Adding a page

1. Add a file under `src/pages/`.
2. Register it in `src/App.tsx`'s `routes` array.
3. If it's a top-level nav item, add it to `src/components/layout/sidebar.tsx`.

Pages should:

- Use `<PageHeader title=... icon=... description=... actions=... />` for the top bar
- Read the current workspace from `useCurrentWorkspace()`
- Use query hooks from `src/lib/api/queries.ts` (add new ones if needed)
- Show empty/loading/error states explicitly (use `<EmptyState>` and `<Spinner>` from `components/ui/empty.tsx`)

## Working with the API

All API calls go through the typed `openapi-fetch` client. Hooks live in
`src/lib/api/queries.ts`. If Honcho gets a new endpoint:

```bash
HONCHO_BASE_URL=https://api.honcho.dev npm run gen:types
```

then add a hook in `queries.ts`. Try to follow the existing pattern:

- `useThing(ids)` for reads → `useQuery`
- `useUpdateThing()`, `useDeleteThing()` for writes → `useMutation`
- Always `unwrap()` the response so FastAPI's `{detail: ...}` errors surface cleanly

## Styling

Tailwind v4 with the Catppuccin Mocha palette. Use the semantic Tailwind
classes wired to CSS vars (`bg-base`, `text-text`, `text-subtext`,
`text-muted`, `bg-mantle`, `border-surface1`, `text-mauve`, etc).

Don't import shadcn components from the CLI — primitives are hand-written
in `src/components/ui/` to keep the design coherent. If you need a new
primitive, write it.

## Type safety

This project is strict TypeScript. PRs that disable `strict` or sprinkle
`any` won't be accepted. The generated `types.gen.ts` is the source of
truth for API shapes — adjust hooks to match it rather than `as` casting
away type mismatches.

## Pull requests

- One topic per PR.
- Run `npm run build` before pushing — it includes `tsc -b` so type errors fail the build.
- Include a screenshot for any UI change.
- If you touched the API surface, mention which Honcho endpoint and what version of the spec you tested against.

## License

By contributing you agree your changes are released under the MIT license.
