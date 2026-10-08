# Web Frontend

Vue 3 + TypeScript + Vite + Pinia + Vue Router foundation for net*CIRCUIT Remote.

## Run

```bash
npm ci
npm run dev
```

## Build

```bash
npm run build
```

## Verify

```bash
npm test
npm run build
# From the repository root, with pytest installed:
python -m pytest -q tests/frontend
```

Runtime tests use Node's built-in test runner and esbuild, with TypeScript checking before execution. Node 22 is the CI baseline. API tests use a real temporary localhost HTTP server. A restricted Windows sandbox must allow loopback connections and Vite filesystem resolution for these commands.

## Pages and layout

- `/`: Dashboard; `/dashboard` redirects here.
- `/laboratory`: Component Library / Lab Workspace / Inspector with an Instruments, Logic Analyzer and Console dock.
- `/circuits`: create, rename, open and validate session drafts.
- `/stations`: discover targets, refresh after errors, select a station or explicitly choose simulation mode.
- `/experiments`: lifecycle foundation; execution/history awaits backend support.
- `/settings`: panel visibility preferences for the current session.
- Unknown URLs show a not-found page. Deployment requires SPA history fallback; the existing Nginx template provides it.

Laboratory uses three columns at desktop widths, two columns plus an Inspector row below 960 px, and stacked panels below 680 px. Library selection previews logical metadata. The board illustration is a preview; editing and real capture arrive in later phases.

**Drafts are session-only. Reloading clears drafts and preferences.** Structural validation does not mean an experiment has executed or a circuit is electrically safe.

## State boundaries

| Store | Responsibility |
|---|---|
| `circuit.ts` | Drafts, current Circuit Graph, validation and stale-result rejection |
| `workspace.ts` | Selection, component preview, tool and zoom |
| `station.ts` | Discovery, selected target, mode and derived execution status |
| `experiment.ts` | Experiment collection and lifecycle state |
| `instrument.ts` | Active dock tab and bounded console log |
| `ui.ts` | Panel visibility and event connection lifecycle |

Execution status is one of `SIMULATION`, `HARDWARE_AVAILABLE`, `HARDWARE_BUSY`, `HARDWARE_OFFLINE`, `FAULT`. Simulation is the default editing mode. API/WebSocket health is displayed separately. A selected physical target stays offline after disconnect, disappearance or a mode change until it recovers or the user explicitly chooses another mode.

## API and event transport

Only `src/services/api/client.ts` calls fetch. It owns JSON headers, a 10 s timeout, caller cancellation and structured `ApiError`s. Domain DTOs and response parsers live in `types/` and `services/api/`. Circuit validation preserves the backend's HTTP 422 structured result. Compatibility exports remain in `services/api.ts` and `services/websocket.ts`; `openEventSocket` now returns a lifecycle client with `disconnect()`.

The frontend requests the currently implemented `GET /api/stations` and `POST /api/circuits/validate`; the typed health helper supports `GET /api/health`. Experiment list/get service methods are reserved interfaces and are not called by current pages.

`services/websocket/client.ts` owns a single `/ws/events` connection. Unexpected close/error retries with exponential backoff from 1 s to 30 s and up to 25% jitter, capped at 30 s. Opening resets the delay. Disconnect cancels pending retries and ignores callbacks from retired sockets. The application refreshes stations whenever an event connection opens. Malformed/unsupported envelopes are ignored; valid `hello`, `echo`, and reserved `station.updated` envelopes are typed in `events.ts`.

Optional build-time configuration:

```dotenv
VITE_API_BASE_URL=/api
# Omit to derive ws/wss and host from the page URL:
VITE_WS_URL=ws://127.0.0.1:8000/ws/events
```

By default Vite proxies `/api` and `/ws` to the backend on port 8000. Start the existing FastAPI backend to verify live discovery/validation/events. An absent backend produces visible errors and automatic reconnect while local drafting remains usable.

The frontend communicates only through application-level `/api` and `/ws` interfaces. Physical transport details and driver imports are prohibited and checked across all source files by frontend boundary tests.
