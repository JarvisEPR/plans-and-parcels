# Plans & Parcels Online

Plans & Parcels is a facilitator-led cooperative browser game about planning under pressure.
One host creates a temporary room, players join from their phones with a QR code, and the
team investigates a contested proposal before defending a recommendation at a public hearing.

The first online scenario is **The Copperline Crossroads**.

## Current release

Version `0.1.0` is an online alpha for one facilitator, one public display, and four to six
players. Players use temporary display names; no account is required.

## Local development

Requirements:

- Node.js 22 or later
- pnpm 11

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite. Create a room from the landing page, then open the display
and join links in separate browser profiles to simulate multiple participants.

## Validation

```bash
pnpm validate
pnpm test:e2e
```

## Project layout

- `apps/game` — React client, Worker API, WebSocket server, and Durable Object
- `packages/game-core` — shared contracts, state machine, and rules
- `content/copperline` — versioned Copperline scenario
- `docs/tabletop-v0.1` — original printable tabletop prototype

## Deployment

Production deploys from protected `main` through GitHub Actions. Configure these repository
secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The token must be limited to the Cloudflare account and Workers deployment permissions required
by this project.

## Licensing

Source code is available under the MIT License. Written game content is available under the
Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International license. See
`LICENSE-CODE.md` and `LICENSE-CONTENT.md`.
