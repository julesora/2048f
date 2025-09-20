# 2048 / reverse

Find the unique move sequence that matches the target.

[Play](https://julesora.github.io/2048f/)

## Develop

Node 24 and npm.

```sh
npm ci
npm run dev
```

## Check

```sh
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

## Controls

Arrows / WASD: move. Z: undo. R: reset. H: hint. P: replay.
Escape: exit replay. N: new puzzle. ?: controls.

Tiles spawn in the first empty cell, left to right, top to bottom.
Values are seeded. Each puzzle has one solution in 4–6 moves.
Progress saves locally; the daily seed uses UTC.

## Deploy

Push to `main` to deploy through GitHub Actions. Pages serves `dist/` at `/2048f/`.

React, TypeScript, Vite, Motion, and Lucide. No backend.
