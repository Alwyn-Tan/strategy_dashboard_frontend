# Project Context

## Purpose
`dma-frontend` is the React dashboard for the DMA strategy MVP. It visualizes price bars, moving averages, trade signals, and (optionally) a strategy-vs-benchmark performance comparison, backed by `dma-strategy-backend`.

Primary goals:
- Provide a fast “run query → see chart + signals” workflow for a selected symbol
- Visualize OHLCV + MA lines and BUY/SELL markers on a TradingView-style chart
- Show signal list with basic filtering/interaction (click-to-focus date)
- Integrate with backend `/api/*` endpoints via Vite proxy in dev or configurable base URL in other environments

## Tech Stack
- React 19 + TypeScript
- Vite (dev server + build)
- UI: Ant Design (`antd`)
- Data fetching: Axios (`axios`)
- Server state/caching: `@tanstack/react-query`
- Charts (MVP): TradingView `lightweight-charts`
- Time utilities: `dayjs`
- Additional charting libs (present): `echarts`, `echarts-for-react`
- CSV parsing (present): `papaparse`
- Linting: ESLint 9 + `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`

## Project Conventions

### Code Style
- TypeScript is strict (`tsconfig.app.json`); keep types explicit at module boundaries (API payloads, component props).
- Prefer function components + hooks (`useState`, `useMemo`, `useEffect`); avoid class components.
- Centralize API types in `src/api/types.ts` and keep request wrappers in `src/api/endpoints.ts`.
- Keep chart components isolated in `src/components/` (imperative chart APIs live behind a React component boundary).
- Use ESLint as the primary style gate (`npm run lint`); no Prettier config is currently enforced.

### Architecture Patterns
**App structure**
- Entry: `src/main.tsx` sets up:
  - React StrictMode
  - React Query `QueryClientProvider`
  - Ant Design `ConfigProvider` (dark theme, `en_US`)
- Main page: `src/App.tsx` (Controls + Status + Chart + Signals + optional performance chart).

**Data flow**
- React Query is used for server state:
  - `['codes']` → `GET /api/codes/`
  - `['stock-data', submitted, showBenchmark]` → `GET /api/stock-data/`
  - `['signals', submitted]` → `GET /api/signals/`
- `submitted` query params are derived from AntD `Form` values (run/reset workflow).

**Charting**
- Price chart: `src/components/PriceChart.tsx`
  - Candlesticks + MA(short/long) lines + volume histogram + BUY/SELL markers
  - “focus date” zooms the visible range around a selected signal date
- Performance chart: `src/components/PerformanceChart.tsx`
  - Two normalized line series: strategy vs buy-and-hold benchmark

**Backend integration**
- Default dev path uses Vite proxy (`/api` → `http://127.0.0.1:8000`) configured in `vite.config.ts`.
- Optional override: `VITE_API_BASE_URL` for Axios `baseURL` (`src/api/client.ts`).

### Testing Strategy
- No dedicated frontend test runner is configured yet (no Vitest/Jest deps).
- Current validation is via:
  - TypeScript compile in build (`npm run build` runs `tsc -b`)
  - ESLint (`npm run lint`)
- If adding tests later, prefer component-level tests for:
  - API adapter functions (`src/api/endpoints.ts`) via mocked Axios
  - UI behavior in `App.tsx` (form → query params → rendering) with a React testing library

### Git Workflow
- No strict conventions enforced; keep commits small and scoped (UI/layout vs data flow vs charts).
- Update docs (`README.md`, `openspec/`) alongside code when behaviors or env vars change.

### Cross-Repo Changes
This project is commonly developed alongside `dma-strategy-backend` (separate repo). When a requirement spans frontend + backend, treat it as a coordinated change across two OpenSpec spaces.

Rules:
- Use the same `change-id` in both repos (e.g., `add-benchmark-performance`).
- Create a change folder in both repos:
  - `dma-frontend/openspec/changes/<change-id>/...`
  - `dma-strategy-backend/openspec/changes/<change-id>/...`
- Pick a “lead” repo for the proposal:
  - Backend-led when API shape/behavior changes.
  - Frontend-led when UI/UX changes without API changes.
- In the lead repo `proposal.md`, document the end-to-end contract (API request/response shapes, error cases, UI behaviors).
- In the companion repo `proposal.md`, keep it short and link to the lead proposal; focus on repo-specific impact only.
- Keep tasks repo-local: `tasks.md` in each repo should only include work that repo owns, plus explicit cross-repo prerequisites (e.g., “merge backend first”).
- Validate in both repos before review: `openspec validate <change-id> --strict`.

API contract convention:
- Treat backend as the canonical source for API contracts/specs; frontend specs/proposals should link to the backend contract sections and keep frontend `src/api/types.ts` aligned.

## Domain Context
- Primary backend endpoints consumed:
  - `GET /api/codes/` → symbol list for selection
  - `GET /api/stock-data/` → OHLCV + `ma_short`/`ma_long` (+ optional `performance` when `include_performance=true`)
  - `GET /api/signals/` → `{ data, meta }` (supports `gen_*` and `filter_*`)
- Signal semantics:
  - `BUY` / `SELL` markers are plotted at the signal date provided by the backend
  - `gen_confirm_bars` and `gen_min_cross_gap` affect which signal dates are produced
- Benchmark toggle:
  - UI switch controls `include_performance=true` and displays a second chart when enabled

## Important Constraints
- Dev assumes backend runs at `http://127.0.0.1:8000` and Vite proxy handles `/api`.
- Avoid coupling UI to a single response shape: `/api/stock-data/` may return either an array or `{ data, meta, performance }` (see `src/api/types.ts`).
- Chart components are imperative; ensure proper cleanup (ResizeObserver, chart disposal) to avoid leaks.
- MVP does not require auth/JWT; requests are anonymous in local dev.

## External Dependencies
- Backend API: `dma-strategy-backend` (proxied as `/api` in dev).
- Charting libraries: `lightweight-charts` (primary), `echarts` (optional/auxiliary).
