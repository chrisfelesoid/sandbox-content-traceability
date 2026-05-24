# Benchmark Viewer

Local dev-only React viewer for watermarking benchmark results.

## Run

```bash
pnpm install
pnpm dev
```

Visit http://localhost:5173/.

## Architecture

- React 19 + Vite 8 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- `@tanstack/react-query` for parallel per-tool fetches
- Custom Vite middleware plugin (`viewer/server/benchmark-api-plugin.ts`)
  exposes `/api/manifest`, `/api/results`, `/api/source`, `/api/files`
  by reading `../{audio,image,video}/benchmark/...` at request time.
- Scenario knowledge (row keys, labels, media filename rules) lives
  in `viewer/src/scenarios/*` — add new scenarios by adding a file there.

## Scripts

- `pnpm dev` — start Vite dev server (port 5173)
- `pnpm test` — run unit tests (Vitest)
- `pnpm test:watch` — Vitest in watch mode
- `pnpm test:integrity` — verify scenario filenames match on-disk files

## Manual QA checklist

- [ ] `pnpm dev` starts; http://localhost:5173/ shows audio / volume / sample-000000
- [ ] Switch Modality → image: "No benchmark data found"
- [ ] Switch Scenario → single_pass: Sub-Scenario select activates with mp3/noise/resample
- [ ] Switch Scenario → volume: Sub-Scenario select is disabled
- [ ] Click any cell → Sheet slides in with raw JSON + enlarged player
- [ ] Copy URL, open new tab → same view restored
- [ ] silentcipher mp3_loop iter 3–5 → "no data" + gray background
- [ ] Pink cell shows cause text below score
