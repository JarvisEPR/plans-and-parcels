# Contributing

Thank you for helping make Plans & Parcels useful, welcoming, and playable.

## Before opening a change

1. Open or select an issue.
2. Keep the change focused.
3. Preserve the distinction between public, role-private, and facilitator-only content.
4. Do not add personal information, production credentials, or unlicensed artwork.
5. Treat communities as stakeholders with legitimate interests, not as obstacles or monsters.

## Development

```bash
pnpm install
pnpm validate
```

Changes to game rules require unit tests. Changes to room authorization require integration
tests. Changes to the join flow require a Playwright test at mobile width.

By contributing, you agree that code is provided under the MIT License and game content under
CC BY-NC-SA 4.0 unless the contribution explicitly documents another compatible license.
