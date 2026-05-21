# Honcho UI

An open-source admin dashboard for [Honcho](https://honcho.dev/), the
AI-native memory layer for stateful agents.

Browse workspaces, peers, sessions and messages. View what Honcho has
learned about each peer. Talk to a peer via the dialectic chat endpoint.
Mint scoped JWTs. Search across messages. And — because the UI is
generated directly from the live OpenAPI spec — every endpoint Honcho
exposes is reachable via the **API Explorer**, even ones the
purpose-built pages don't surface yet.

Works against the hosted instance at `api.honcho.dev` *and* any
self-hosted Honcho deployment.

![screenshot — coming soon]()

## Features

- **Workspace, Peer, Session and Message browsers** with filtering and detail views.
- **Peer card viewer** — Honcho's accumulated representation of a peer, rendered as structured insights rather than raw JSON.
- **Dialectic Chat** — ask Honcho what it knows about a peer, with reasoning-level picker.
- **API Explorer** — every endpoint from the live OpenAPI spec, with try-it-out forms and response inspection.
- **Token minting** — POST to `/v3/keys` with a careful UI for scope selection.
- **Webhooks, conclusions, search** — all covered.
- **Scope-aware** — works correctly with admin, workspace-, peer- or session-scoped JWTs.
- **Cross-tab auth sync** — sign out in one tab, signs out everywhere.

## Design principles

- **Browser-only.** No backend, no telemetry, no third-party scripts, no CDN fonts. Every request goes directly from your browser to the Honcho endpoint you configured.
- **OpenAPI-driven.** Types are generated from the live spec via `openapi-typescript`. The API Explorer is generated at runtime. If Honcho adds an endpoint, this UI sees it after you re-run `npm run gen:types`.
- **Catppuccin Mocha.** Tuned for app density rather than off-the-shelf.

## Quick start

```bash
git clone https://github.com/Clinteastman/honcho-ui.git
cd honcho-ui
npm install
npm run dev
# opens http://localhost:5173
```

Then in the UI:

1. Enter your Honcho endpoint (default: `https://api.honcho.dev`)
2. Paste a JWT for that instance
3. Connect

For the cloud Honcho, get a key from <https://app.honcho.dev>.
For a self-hosted instance, mint one against your `AUTH_JWT_SECRET`:

```bash
docker compose exec api python -c "
from src.security import create_jwt, JWTParams
print(create_jwt(JWTParams(ad=True)))"
```

## Self-hosting the UI

The build output is a static SPA — drop it anywhere.

```bash
npm run build
# dist/ contains everything you need to serve
```

### Cloudflare Pages

1. Connect this repo to Cloudflare Pages.
2. Build command: `npm run build`
3. Build output: `dist`
4. The included `public/_redirects` handles SPA fallback automatically.

### Behind Cloudflare Access (recommended)

Honcho UI stores your JWT in the browser's localStorage, which means
anyone who can run JavaScript in the same origin can read it. Mitigate by
putting the deployment behind Cloudflare Access, Tailscale, basic auth,
or any other proxy-level auth — so only people you trust can even reach
the login page.

### Generic static host

Any host that serves an SPA with a 200-fallback to `/index.html` works
(Netlify, S3+CloudFront, nginx with `try_files`). The UI uses hash-based
routing so even a server with no SPA fallback works for sub-pages —
`https://yoursite.com/#/peers` is fine.

## Security model

| Threat | Mitigation |
|---|---|
| XSS in your browser steals the token | Strict Content-Security-Policy in `index.html`; no third-party scripts; no inline scripts; subresource integrity on bundle. |
| Token sent over HTTP | Login form warns when endpoint isn't HTTPS. |
| Unauthorized access to the UI itself | None — bring your own (Cloudflare Access, basic auth, VPN). Deliberately not built into the UI to keep the deploy story simple. |
| Token persisted past intended session | Optional "Remember me" toggle switches storage from localStorage to sessionStorage. |
| Token leaked via logs / URLs | Token is never logged, never put in URL params, never sent to anything except the Honcho endpoint. |

## Regenerating types

If Honcho's API changes, regenerate the TypeScript types:

```bash
HONCHO_BASE_URL=https://api.honcho.dev npm run gen:types
# or for a self-hosted instance:
HONCHO_BASE_URL=https://honcho.example.com npm run gen:types
```

## Stack

- [Vite](https://vitejs.dev) + [React 19](https://react.dev) + TypeScript
- [TanStack Query](https://tanstack.com/query) for data fetching
- [Tailwind CSS v4](https://tailwindcss.com) with Catppuccin Mocha tokens
- [Radix UI](https://www.radix-ui.com/) primitives (no shadcn CLI; components are hand-written)
- [openapi-fetch](https://openapi-ts.pages.dev/openapi-fetch/) + [openapi-typescript](https://openapi-ts.pages.dev/) for type-safe API calls
- [Lucide](https://lucide.dev) for icons
- [Sonner](https://sonner.emilkowal.ski/) for toasts
- [jose](https://github.com/panva/jose) for JWT decoding (client-side, no signature verification)

## Contributing

PRs welcome. See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
