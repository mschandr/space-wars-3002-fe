# Space Wars 3002 — Frontend

A turn-based space trading and conquest game built with SvelteKit 2 and Svelte 5. Players explore procedurally generated galaxies, trade minerals, buy ships, and warp between star systems.

## Tech Stack

| Technology | Version | Role |
|---|---|---|
| **Svelte** | 5.x | UI framework (runes reactivity) |
| **SvelteKit** | 2.22+ | Routing, SSR, builds |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **Vite** | 7.x | Build tool and dev server |
| **Vitest** | 3.2+ | Unit and component testing |
| **Playwright** | 1.53+ | Browser-based component tests |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A running Space Wars 3002 backend API (proxied via `/api`)

### Setup

```bash
npm install
```

### Hosts Configuration

The dev server binds to a custom hostname. Add this to your `/etc/hosts`:

```text
127.0.0.1  space-wars-3002-fe.local
```

### Development

```bash
npm run dev          # Start dev server at http://space-wars-3002-fe.local:3001
```

HMR is configured to connect through port 80 — ensure your reverse proxy or network setup forwards WebSocket connections accordingly.

### Build and Preview

```bash
npm run build        # Production build
npm run preview      # Preview the production build locally
```

### Code Quality

```bash
npm run check        # TypeScript type checking (svelte-check)
npm run lint         # Prettier + ESLint checks
npm run format       # Auto-format all files with Prettier
```

### Testing

```bash
npm run test         # Run all tests once (CI mode)
npm run test:unit    # Run tests in watch mode (development)

# Run a single test file:
npm run test:unit -- --run src/path/to/file.spec.ts
```

Tests are split into two Vitest projects:

- **Client tests** (`*.svelte.spec.ts`) — Run in Chromium via Playwright. Use these for component rendering and DOM interaction tests.
- **Server tests** (`*.spec.ts`) — Run in Node.js. Use these for utility functions and non-DOM logic.

All test files require at least one assertion (`expect.requireAssertions: true` in config).

## Project Structure

```text
src/
├── lib/
│   ├── api.ts                          # REST API client (all endpoints + types)
│   ├── auth.svelte.ts                  # Auth store (login, register, token management)
│   ├── galaxyCache.ts                  # localStorage cache for galaxy lists
│   ├── types/
│   │   └── scanning.ts                 # Scan/map system types and constants
│   ├── stores/
│   │   └── playerState.svelte.ts       # Central game state store
│   └── components/
│       ├── AuthLayout.svelte           # Auth page wrapper
│       ├── SpaceBackdrop.svelte        # Animated starfield background
│       ├── SpaceLoader.svelte          # Galaxy generation spinner
│       ├── GalaxyCard.svelte           # Galaxy selection card
│       └── game/                       # Game UI components
│           ├── PlayerStats.svelte      # Ship status bars
│           ├── StatBar.svelte          # Reusable progress bar
│           ├── SystemMenu.svelte       # Service/action menu
│           ├── ActionPanel.svelte      # Context panel for selected service
│           ├── TradingPanel.svelte     # Buy/sell mineral interface
│           ├── MineralRow.svelte       # Single mineral in inventory
│           ├── CargoManifest.svelte    # Player cargo display
│           ├── PriceDisplay.svelte     # Credit amount formatting
│           ├── WarpLoader.svelte       # Warp travel animation
│           ├── SectorGrid.svelte       # Sector position grid
│           ├── SectorStarMap.svelte    # Sector-level star map
│           ├── StarMap.svelte          # Full galaxy SVG map
│           ├── SystemNode.svelte       # Star system on map
│           ├── MapFilters.svelte       # Zoom and filter controls
│           └── MapLegend.svelte        # Map symbol legend
├── routes/
│   ├── +layout.svelte                  # Root layout (SpaceBackdrop)
│   ├── +page.svelte                    # Home (auth check + redirect)
│   ├── login/+page.svelte              # Login form
│   ├── register/
│   │   ├── +page.svelte               # Registration form
│   │   └── confirm/+page.svelte       # Registration success
│   └── galaxies/
│       ├── +page.svelte               # Galaxy list + creation modal
│       └── [uuid]/play/
│           ├── +page.ts               # Extract galaxyUuid from URL
│           ├── +page.svelte           # Main gameplay interface
│           └── map/
│               ├── +page.ts
│               └── +page.svelte       # Full galaxy star map
├── app.css                             # Tailwind CSS imports
├── app.d.ts                            # Global TypeScript declarations
└── app.html                            # HTML shell template
```

## Architecture

### State Management

The app uses two singleton stores, both built with the Svelte 5 factory pattern:

**`auth`** (`src/lib/auth.svelte.ts`) — Authentication state. Manages user identity, tokens, and a 5-minute localStorage user cache.

**`playerState`** (`src/lib/stores/playerState.svelte.ts`) — All in-game state. Manages the player's location, ship, cargo, credits, travel status, scanning, and trading.

Both stores:
- Use `$state` internally with getter-only public access (no direct mutation from outside)
- Expose async methods that call the API and update state atomically
- Are imported directly by components — no prop drilling for global data

### API Layer

All backend communication goes through `src/lib/api.ts`. The `api` object is organized by resource:

```typescript
api.auth.*          // Login, register, logout, token refresh
api.galaxies.*      // List, create, join, get map
api.players.*       // Scan, travel, cargo, facilities, ships
api.tradingHubs.*   // Inventory, buy, sell
api.ships.*         // Ship catalog
api.location.*      // Current location details
api.sectors.*       // Sector details
```

Every API call returns `ApiResponse<T>` with a `success` boolean, typed `data`, and structured `error` with code/message/details.

### Routing

SvelteKit file-based routing. Dynamic segments use `[uuid]`. Pages load data via `+page.ts` load functions and render with `+page.svelte`.

## Development Guidelines

### Svelte 5 Runes

This codebase uses Svelte 5's runes system exclusively. **Do not use Svelte 4 syntax.**

| Use | Instead of |
|---|---|
| `let x = $state(0)` | `let x = 0` (Svelte 4 reactive) |
| `const y = $derived(x * 2)` | `$: y = x * 2` |
| `$effect(() => { ... })` | `$: { ... }` (reactive statements) |
| `let { prop } = $props()` | `export let prop` |
| `{@render children()}` | `<slot />` |

### Store Files

Files that use runes outside `.svelte` components **must** use the `.svelte.ts` extension. Standard `.ts` files cannot contain `$state`, `$derived`, or `$effect`.

### Component Props

Always define an `interface Props` and destructure from `$props()`:

```svelte
<script lang="ts">
  interface Props {
    label: string;
    count: number;
    onAction?: () => void;
  }

  let { label, count, onAction }: Props = $props();
</script>
```

### API Type Definitions

All request/response types live in `src/lib/api.ts`. When adding a new endpoint:

1. Define the response interface in `api.ts`
2. Add the method to the appropriate namespace in the `api` object
3. Use the shared `request<T>()` helper for standard calls
4. Keep type names matching the API response shape (use `snake_case` in interfaces, convert to `camelCase` in stores)

### Service Name Matching

The backend returns service names in inconsistent formats. `SystemMenu.svelte` has a fuzzy matching map that normalizes these. When the backend adds new service name variants, add them to the `serviceMenuMap` in that component.

### Travel System

Travel uses a poll-based pattern for system generation:
1. `POST /players/{uuid}/travel` — may return `status: "generating"`
2. If generating, poll `GET /players/{uuid}/current-system` every 2 seconds
3. Enforce a minimum 2-second warp animation for UX
4. Clear `locationDetails` and `facilities` after arrival (they belong to the old location)
5. Reload location data for the new system

### Caching Strategy

| Cache | Location | Invalidation |
|---|---|---|
| Auth user | localStorage | 5-minute TTL |
| Galaxy list | localStorage | Version-based (bump `CACHE_VERSION` in `galaxyCache.ts`) |
| Scan levels | In-memory (playerState) | Per-session, cleared on `reset()` |

### SSR Safety

SvelteKit runs code on the server during SSR. Always guard browser-only APIs:

```typescript
if (typeof localStorage === 'undefined') return null;
```

### CSS and Styling

- Use Tailwind utility classes for layout and spacing
- Use scoped `<style>` blocks for component-specific styles
- Animations use CSS `@keyframes` (GPU-accelerated, no JS timers)
- Always respect `prefers-reduced-motion` for animations
- Color palette: dark theme with blue primary, orange accent

### Error Handling

- API errors have typed codes (`response.error.code`) — use `switch` statements for user-facing messages
- Use guard clauses (`if (!state.playerUuid) return null`) at the top of methods
- Network errors are caught with try/catch — never let a failed API call crash the UI
- There is no global error boundary — each page handles its own errors

### Adding a New Game Service

1. Add the endpoint to `api.ts` (types + method)
2. Add state fields and a load method to `playerState.svelte.ts`
3. Add name variants to `serviceMenuMap` in `SystemMenu.svelte`
4. Add a panel case to `ActionPanel.svelte`
5. Create any new sub-components in `src/lib/components/game/`

## Documentation

- [`docs/LEARNING_GUIDE.md`](docs/LEARNING_GUIDE.md) — File-by-file walkthrough for learning Svelte 5 and JavaScript
- [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) — Backend API endpoint reference
- [`docs/API_WORKFLOW_GUIDE.md`](docs/API_WORKFLOW_GUIDE.md) — API integration patterns and flows
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — Feature implementation roadmap
