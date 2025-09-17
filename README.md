# 2048 / reverse

Find the exact move sequence that turns a starting board into a target.

## Run

Requires Node 22.12+ (or 20.19+).

```sh
npm install
npm run dev
```

```sh
npm test            # Engine tests
npm run lint
npm run build       # Static site in dist/
npx playwright install chromium
npm run test:e2e    # Desktop and mobile browser tests
```

## Play

- Slide with arrows, WASD, buttons, or swipes. Equal tiles merge once per move.
- Match the target in 4, 5, or 6 moves. No-op moves do not count.
- Undo with Z or Backspace. Inspect or replay the move timeline.
- Hints reveal the next correct move or your first wrong turn.
- Progress saves locally. Copy the puzzle link to share the same challenge.

The daily seed uses the UTC date. New puzzle creates a random seed.

## Structure

- `src/game/engine.ts`: pure moves, seeded spawns, and puzzle generation.
- `src/components/`: game controls, board visualizer, and move timeline.
- `src/game/progress.ts`: validated local progress.
- `src/App.tsx`: page layout and rules.
- `src/App.css`: responsive layout and tile styles.

The generator explores every valid sequence at the selected length, then picks a target reached by exactly one sequence. The seed, difficulty, and move number make each puzzle repeatable. Spawns choose a seeded empty-cell index, so their positions can differ between paths.

Built with React, TypeScript, [Vite](https://vite.dev/guide/), [Motion](https://motion.dev/docs/react), and Lucide. No backend is needed. Fonts load from Google Fonts with local fallbacks.
