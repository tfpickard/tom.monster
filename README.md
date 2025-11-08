# Cellular Automata → Music Playground

Turn cellular automata into evolving microtonal music. This repository contains a production-ready Next.js 15 prototype with square/hex lattices, GA seed search, Tone.js audio, Prisma persistence, real-time WebSocket streaming, and Docker packaging.

## Quickstart

```bash
cp .env.example .env
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
# open http://localhost:3000
```

### Docker

```bash
docker compose up --build
```

The sqlite database lives in the `sqlite-data` volume so runs survive container restarts.

## Architecture

```
src/
  app/           # Next.js App Router routes + UI
  components/    # Canvas + control panels
  hooks/         # Tone.js audio, workers, websocket stream hooks
  lib/
    ca/          # Cellular automata core (rules, hex math, hashing)
    ga/          # Genetic algorithm logic
    music/       # Tunings, mapping utilities
    auth/        # Guest NextAuth config
    server/      # WebSocket hub for ws server + broadcasters
  state/         # Zustand store
workers/         # simulation.worker.ts + ga.worker.ts
prisma/          # schema + seed script
tests/           # Vitest + Playwright suites
```

- App Router handles REST endpoints in `/api/*`.
- `pages/api/ws` hosts a long-lived `ws` server (Route Handlers still lack raw socket hooks). Frames from headless runs are broadcast to rooms (`sim:live`, `runs:<id>`).
- Web workers keep CA + GA computation off the main thread. Typed arrays + Zobrist hashing maintain performance and cycle detection.
- Tone.js voices (percussive/plucked/pad) interpret CA frames via mapping strategies and user-selectable tunings (12/19/31-TET, Bohlen–Pierce, custom Hz/cents parser).
- Prisma + NextAuth provide anonymous guest sessions, preset persistence, and run history.

## Feature Highlights

- Square & hex lattices with B/S rule parsing, torus toggle, random fill density, benchmark readout.
- Rolling hash + oscillator detection (period ≤ maxPeriod) to stop runs early.
- Built-in methuselah seeds (R-pentomino, Acorn, Diehard, Gosper gun) plus curated hex blooms.
- Switch between square/hex lattices before loading a preset to match cell coordinates.
- GA worker with configurable population/mutation/iteration to find long-lived bounded seeds. Best genomes can be loaded into the sim.
- Tone.js transport tied to simulation frames, microtonal tunings, mapping strategies, voice mixer, and 30-second WebM/Opus recording.
- WebSocket broadcast of headless runs so multiple tabs see the same frames in real time (`sim:live` demo auto-starts on load).
- REST API for presets and runs (`/api/presets`, `/api/runs`, `/api/health`).
- Dockerfile + docker-compose for reproducible deploys.

## Extending

### Add a new CA rule

1. Update any seeds/documentation referencing the rule (optional).
2. Pass the rule string (e.g., `"B36/S23"`) into the UI or API. `parseRule` validates and normalises user input.
3. Workers automatically respect the rule when the client updates `SimulationConfig.rule`.

### Add a new tuning

1. Edit `src/lib/music/tunings.ts` and append a new entry in the `tunings` record.
2. Provide a `frequencies` factory that returns an array of Hz values.
3. The Music panel picks up the new option automatically.

### Swap SQLite → Postgres

1. Change `provider` + `DATABASE_URL` in `prisma/schema.prisma`.
2. Update `.env`/deployment secrets with a Postgres connection string.
3. Run `pnpm prisma migrate dev` to recreate the schema.
4. The rest of the app (Prisma client, API routes, seed script) works unchanged.

## Scripts

| Command         | Purpose                             |
| --------------- | ----------------------------------- |
| `pnpm dev`      | Next.js dev server + workers        |
| `pnpm build`    | Production build                    |
| `pnpm start`    | Start built server                  |
| `pnpm lint`     | ESLint                              |
| `pnpm test`     | Vitest unit/component tests         |
| `pnpm test:e2e` | Playwright happy-path test          |
| `pnpm db:push`  | Apply Prisma schema to sqlite       |
| `pnpm db:seed`  | Seed demo guest, presets, GA config |
| `pnpm db:reset` | Reset database                      |

## Known Limits

- WebSocket server currently runs through `pages/api/ws` because App Router handlers do not yet expose Node upgrade hooks; once stable we can migrate.
- GA fitness evaluation uses cloned frames for simplicity; long searches may take several minutes.
- Canvas rendering is CPU-side; large grids may need OffscreenCanvas for further optimisation.
- Audio scheduling is tied to frame delivery rather than a quantized transport grid; heavy worker loads can drift timing slightly.

## Roadmap

1. Persist GA results as Presets automatically with preview GIFs.
2. Add authenticated OAuth providers next to guest mode.
3. Support importing/exporting preset JSON files and GIF thumbnails.
4. Upgrade WebSocket server to the App Router once Node sockets land officially.
5. Add advanced music mapping (voice-per-cluster, centroid tracking) and more tunings.

## File Tree (abridged)

```
.
├── Dockerfile
├── docker-compose.yml
├── prisma/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── pages/api/ws.ts
│   └── state/
├── workers/
└── tests/
```

Enjoy evolving methuselahs into music!
